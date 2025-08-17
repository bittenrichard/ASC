// src/pages/Dashboard.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Phone, Users, BookOpen, Star, ShieldCheck, Target } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { baserowService, GoalData, AppUserObject } from '../lib/baserowService';
import { MetricCard } from '../components/Dashboard/MetricCard';
import { CallsTable } from '../components/Dashboard/CallsTable';
import { KPIWidget } from '../components/Dashboard/KPIWidget';
import { GamificationWidget } from '../components/Dashboard/GamificationWidget';
import { SpinRadarChart } from '../components/Dashboard/charts/SpinRadarChart';
import toast from 'react-hot-toast';

// --- Interfaces ---
interface DashboardData {
  totalCalls: number;
  avgEfficiencyScore: number;
  kpis: KPIItem[];
  topPerformer: { name: string, score: number };
  recentAchievements: any[];
  spinAnalysis: any;
}
interface CombinedCallData {
  call_id: string;
  sdr_id: number | null;
  prospect_name: string;
  call_date: string;
  efficiency_score: number;
  status: string;
  sdr_name?: string;
  call_duration_seconds: number;
}
interface KPIItem {
  label: string;
  value: string;
  target: string;
  progress: number;
}
type DateRange = { startDate: string; endDate: string; };

const DATE_RANGES = {
  'Este Mês': () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return { startDate: start.toISOString().split('T')[0], endDate: end.toISOString().split('T')[0] };
  },
  'Mês Passado': () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 0);
    return { startDate: start.toISOString().split('T')[0], endDate: end.toISOString().split('T')[0] };
  },
  'Últimos 30 Dias': () => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 29);
    return { startDate: start.toISOString().split('T')[0], endDate: end.toISOString().split('T')[0] };
  },
  'Últimos 7 Dias': () => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 6);
    return { startDate: start.toISOString().split('T')[0], endDate: end.toISOString().split('T')[0] };
  },
};

// --- Componente para o Dashboard de Administrador ---
function AdminDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [recentCalls, setRecentCalls] = useState<CombinedCallData[]>([]);
  const [allSDRs, setAllSDRs] = useState<AppUserObject[]>([]);
  
  const [selectedSdrId, setSelectedSdrId] = useState<string>('team');
  const [dateRange, setDateRange] = useState<DateRange>(DATE_RANGES['Este Mês']());
  const [selectedPreset, setSelectedPreset] = useState<string>('Este Mês');

  const fetchDashboardData = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    try {
      const sdrList = await baserowService.getAllSDRs(user.organizationId);
      setAllSDRs(sdrList);
      const sdrMap = new Map(sdrList.map(sdr => [sdr.id, sdr.name]));
      
      const sdrIdToFetch = selectedSdrId === 'team' ? undefined : parseInt(selectedSdrId);

      const [recordings, analyses, goals] = await Promise.all([
        baserowService.getCallRecordings(user.organizationId, sdrIdToFetch),
        baserowService.getCallAnalyses(user.organizationId, sdrIdToFetch),
        baserowService.getGoals(user.organizationId),
      ]);
      
      const analysesMap = new Map(analyses.map(a => [a.Call_Recording[0]?.id, a]));

      // Adicionamos 'T00:00:00' para garantir que a data de início seja no começo do dia local
      const start = new Date(dateRange.startDate + 'T00:00:00');
      const end = new Date(dateRange.endDate + 'T23:59:59');

      const filteredRecordings = recordings.filter(rec => {
        const callDate = new Date(rec.Call_Date);
        return callDate >= start && callDate <= end;
      });

      const combinedData: CombinedCallData[] = filteredRecordings
        .map(rec => {
          const sdrId = rec.SDR?.[0]?.id || null;
          const analysis = analysesMap.get(rec.id);
          return {
            call_id: rec.id.toString(),
            sdr_id: sdrId,
            prospect_name: rec.Prospect_Name,
            call_date: rec.Call_Date,
            efficiency_score: analysis?.Efficiency_Score || 0,
            status: rec.Status?.value || 'N/A',
            sdr_name: sdrId ? sdrMap.get(sdrId) : 'N/A',
            call_duration_seconds: rec.Call_Duration_Seconds || 0,
          };
        })
        .sort((a, b) => new Date(b.call_date).getTime() - new Date(a.call_date).getTime());
      
      setRecentCalls(combinedData.slice(0, 5));

      const totalCalls = combinedData.length;
      const totalScore = combinedData.reduce((sum, call) => sum + call.efficiency_score, 0);
      const avgEfficiencyScore = totalCalls > 0 ? Math.round(totalScore / totalCalls) : 0;

      const relevantGoals = goals.filter(goal => {
        if (selectedSdrId === 'team') return true;
        return !goal.sdrId || goal.sdrId === parseInt(selectedSdrId);
      });

      const kpis = relevantGoals.map(goal => {
        let currentValue = 0;
        const sdrSpecificData = selectedSdrId === 'team' ? combinedData : combinedData.filter(c => c.sdr_id === parseInt(selectedSdrId));

        switch (goal.metric) {
          case 'Número de Chamadas':
            currentValue = sdrSpecificData.length;
            break;
          case 'Pontuação Média de Eficiência':
            const total = sdrSpecificData.reduce((sum, call) => sum + call.efficiency_score, 0);
            currentValue = sdrSpecificData.length > 0 ? Math.round(total / sdrSpecificData.length) : 0;
            break;
          case 'Reuniões Agendadas':
            currentValue = 0;
            break;
        }

        const progress = goal.targetValue > 0 ? Math.min(Math.round((currentValue / goal.targetValue) * 100), 100) : 0;
        
        return {
          label: `${goal.name} (${goal.sdrName})`,
          value: currentValue.toString(),
          target: goal.targetValue.toString(),
          progress: progress,
        };
      });

      const leaderboard = await baserowService.getLeaderboardData(user.organizationId);
      const topPerformer = leaderboard.length > 0 ? { name: leaderboard[0].name, score: leaderboard[0].avg_score } : { name: 'N/A', score: 0 };
      
      setDashboardData({
        totalCalls: totalCalls,
        avgEfficiencyScore: avgEfficiencyScore,
        kpis: kpis,
        topPerformer: topPerformer,
        recentAchievements: [
          { icon: Star, title: 'Primeira Venda', description: 'A ser conquistado!' },
          { icon: ShieldCheck, title: 'Guardião do Playbook', description: 'A ser conquistado!' },
        ],
        spinAnalysis: [],
      });

    } catch (error) {
      console.error("Erro ao carregar dados do dashboard de admin:", error);
      setDashboardData(null);
    } finally {
      setLoading(false);
    }
  }, [user, dateRange, selectedSdrId]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (loading || !dashboardData) {
    return <div className="p-8 text-center text-text-secondary">A carregar dashboard...</div>;
  }

  const selectedSdrName = selectedSdrId === 'team' ? 'Equipe Inteira' : allSDRs.find(sdr => sdr.id.toString() === selectedSdrId)?.name;

  // INÍCIO DA CORREÇÃO DE TIMEZONE PARA EXIBIÇÃO
  // Truque comum: substituir hífens por barras faz o JavaScript interpretar a data no fuso horário local em vez de UTC.
  const displayStartDate = new Date(dateRange.startDate.replace(/-/g, '/')).toLocaleDateString('pt-BR');
  const displayEndDate = new Date(dateRange.endDate.replace(/-/g, '/')).toLocaleDateString('pt-BR');
  // FIM DA CORREÇÃO

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-start flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Dashboard do Administrador</h1>
          <p className="text-text-secondary mt-1">Visão geral da saúde e desempenho da sua equipe de vendas.</p>
        </div>
        <div className="flex items-center gap-4">
          <select 
            value={selectedSdrId}
            onChange={(e) => setSelectedSdrId(e.target.value)}
            className="flex items-center gap-2 px-4 py-2 bg-surface text-text-primary font-semibold border border-gray-200 rounded-lg hover:bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="team">Equipe Inteira</option>
            {allSDRs.map(sdr => (
              <option key={sdr.id} value={sdr.id}>{sdr.name}</option>
            ))}
          </select>

          <select
              value={selectedPreset}
              onChange={(e) => {
                  const preset = e.target.value;
                  setSelectedPreset(preset);
                  if (DATE_RANGES[preset as keyof typeof DATE_RANGES]) {
                      setDateRange(DATE_RANGES[preset as keyof typeof DATE_RANGES]());
                  }
              }}
              className="flex items-center gap-2 px-4 py-2 bg-surface text-text-primary font-semibold border border-gray-200 rounded-lg hover:bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          >
              {Object.keys(DATE_RANGES).map(key => (
                  <option key={key} value={key}>{key}</option>
              ))}
          </select>
        </div>
      </div>
      
      <div className="bg-primary/10 border border-primary/20 p-4 rounded-xl text-center">
        <h2 className="text-lg font-semibold text-primary">A visualizar dados para: <span className="font-bold">{selectedSdrName}</span></h2>
        {/* LINHA MODIFICADA PARA USAR AS DATAS CORRIGIDAS */}
        <p className="text-sm text-primary/80">Período: {displayStartDate} - {displayEndDate}</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <MetricCard title="Chamadas no Período" value={dashboardData.totalCalls} icon={Phone} />
        <MetricCard title="Pontuação Média" value={`${dashboardData.avgEfficiencyScore} / 100`} icon={BookOpen} />
        <MetricCard title="Metas Ativas" value={dashboardData.kpis.length} icon={Target} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
             <GamificationWidget topPerformer={dashboardData.topPerformer} recentAchievements={dashboardData.recentAchievements} />
          </div>
          <div className="lg:col-span-2">
            <KPIWidget title="Metas e KPIs" data={dashboardData.kpis} />
          </div>
      </div>
      
      <CallsTable title="Últimas Chamadas da Equipe" calls={recentCalls} showSDRColumn={true} />
    </div>
  );
}

// --- Componente para o Dashboard de SDR ---
function SdrDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [myCalls, setMyCalls] = useState<CombinedCallData[]>([]);

  const fetchMyCalls = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
        const recordings = await baserowService.getCallRecordings(user.organizationId, user.id);
        const analyses = await baserowService.getCallAnalyses(user.organizationId, user.id);
        const analysesMap = new Map(analyses.map((a: any) => [a.Call_Recording?.[0]?.id, a]));
        
        const combinedData: CombinedCallData[] = recordings
          .sort((a: any, b: any) => new Date(b.Call_Date).getTime() - new Date(a.Call_Date).getTime())
          .map((rec: any) => {
              const sdrId = rec.SDR?.[0]?.id || null;
              const analysis = analysesMap.get(rec.id);
              return {
                  call_id: rec.id.toString(),
                  sdr_id: sdrId,
                  prospect_name: rec.Prospect_Name,
                  call_date: rec.Call_Date,
                  efficiency_score: analysis?.Efficiency_Score || 0,
                  status: rec.Status?.value || 'N/A',
                  sdr_name: user.name,
                  call_duration_seconds: rec.Call_Duration_Seconds || 0,
              };
          });
        
        setMyCalls(combinedData);
      } catch (error) {
        console.error('Erro ao buscar minhas chamadas:', error);
      } finally {
        setLoading(false);
      }
  }, [user]);

  useEffect(() => {
    if (user) {
        fetchMyCalls();
    }
  }, [user, fetchMyCalls]);

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-text-primary">Meu Dashboard</h1>
        <p className="text-text-secondary mt-1">Visão geral do seu desempenho e análises de chamadas.</p>
      </div>
      {loading ? (
        <div className="p-8 text-center text-text-secondary">A carregar suas chamadas...</div>
      ) : (
        <CallsTable title="Minhas Últimas Chamadas" calls={myCalls} showSDRColumn={false} />
      )}
    </div>
  );
}

// --- Componente Principal que decide qual Dashboard mostrar ---
export function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  if (authLoading) {
    return <div className="p-8 text-center text-text-secondary">A autenticar...</div>;
  }
  if (user?.role === 'administrator') {
    return <AdminDashboard />;
  }
  return <SdrDashboard />;
}
