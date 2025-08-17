// src/pages/Dashboard.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Phone, Users, BookOpen, Star, ShieldCheck, Calendar, X } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { baserowService } from '../lib/baserowService';
import { MetricCard } from '../components/Dashboard/MetricCard';
import { CallsTable } from '../components/Dashboard/CallsTable';
import { KPIWidget } from '../components/Dashboard/KPIWidget';
import { GamificationWidget } from '../components/Dashboard/GamificationWidget';
import { SpinRadarChart } from '../components/Dashboard/charts/SpinRadarChart';

// --- Interfaces ---
interface DashboardData {
  totalCalls: number;
  teamSize: number;
  avgEfficiencyScore: number;
  kpis: any[];
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
type DateRange = { startDate: string; endDate: string; };

const DATE_RANGES = {
  'Este Mês': () => {
    const start = new Date();
    start.setDate(1);
    const end = new Date();
    return { startDate: start.toISOString().split('T')[0], endDate: end.toISOString().split('T')[0] };
  },
  'Últimos 7 Dias': () => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 6);
    return { startDate: start.toISOString().split('T')[0], endDate: end.toISOString().split('T')[0] };
  },
  'Mês Passado': () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 0);
    return { startDate: start.toISOString().split('T')[0], endDate: end.toISOString().split('T')[0] };
  },
};

// --- Componente para o Dashboard de Administrador ---
function AdminDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [recentCalls, setRecentCalls] = useState<CombinedCallData[]>([]);
  const [dateRange, setDateRange] = useState<DateRange>(DATE_RANGES['Este Mês']());
  const [selectedPreset, setSelectedPreset] = useState<string>('Este Mês');
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  const startDateRef = useRef<HTMLInputElement>(null);
  const endDateRef = useRef<HTMLInputElement>(null);
  
  const fetchDashboardData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const allSDRs = await baserowService.getAllSDRs(user.organizationId);
      const sdrMap = new Map(allSDRs.map(sdr => [sdr.id, sdr.name]));

      const allAnalyses = await baserowService.getCallAnalyses();
      const filteredAnalyses = allAnalyses.filter(a => {
        const isFromOrg = a.Organization?.[0]?.id === user.organizationId;
        const callRecordingLink = a.Call_Recording && a.Call_Recording.length > 0 ? a.Call_Recording[0] : null;
        if (!isFromOrg || !callRecordingLink) return false;

        const callDate = new Date(callRecordingLink.Call_Date);
        const start = new Date(dateRange.startDate);
        const end = new Date(dateRange.endDate);
        return callDate >= start && callDate <= end;
      });

      const totalCalls = filteredAnalyses.length;
      const totalScore = filteredAnalyses.reduce((sum, a) => sum + (a.Efficiency_Score || 0), 0);
      const avgEfficiencyScore = totalCalls > 0 ? Math.round(totalScore / totalCalls) : 0;
      
      const recordings = await baserowService.getCallRecordings(user.organizationId);
      const analysesMap = new Map(allAnalyses.map(a => [a.Call_Recording?.[0]?.id, a]));
      let combinedData: CombinedCallData[] = recordings
        .sort((a, b) => new Date(b.Call_Date).getTime() - new Date(a.Call_Date).getTime())
        .map(rec => {
          const sdrId = rec.SDR && rec.SDR.length > 0 ? rec.SDR[0].id : null;
          return {
            call_id: rec.id.toString(),
            sdr_id: sdrId,
            prospect_name: rec.Prospect_Name,
            call_date: rec.Call_Date,
            efficiency_score: analysesMap.get(rec.id)?.Efficiency_Score || 0,
            status: rec.Status?.value || 'N/A',
            sdr_name: sdrId ? sdrMap.get(sdrId) : 'N/A',
            call_duration_seconds: rec.Call_Duration_Seconds || 0,
          };
        });
      setRecentCalls(combinedData.slice(0, 5));

      const teamSpinScores = await baserowService.getTeamSpinScores(user.organizationId, dateRange.startDate, dateRange.endDate);

      setDashboardData({
        totalCalls,
        teamSize: allSDRs.length,
        avgEfficiencyScore,
        kpis: [
            { label: 'Novas Reuniões Agendadas', value: '0', target: '50', progress: 0 },
            { label: 'Leads Qualificados', value: '0', target: '80', progress: 0 },
            { label: 'Taxa de Conversão', value: '0%', target: '30%', progress: 0 },
        ],
        topPerformer: { name: 'A definir', score: 0 },
        recentAchievements: [
          { icon: Star, title: 'Primeira Venda', description: 'A ser conquistado!' },
          { icon: ShieldCheck, title: 'Guardião do Playbook', description: 'A ser conquistado!' },
        ],
        spinAnalysis: [
          { subject: 'Situação', A: Math.round(teamSpinScores.situation), fullMark: 100 },
          { subject: 'Problema', A: Math.round(teamSpinScores.problem), fullMark: 100 },
          { subject: 'Implicação', A: Math.round(teamSpinScores.implication), fullMark: 100 },
          { subject: 'Necessidade', A: Math.round(teamSpinScores.need_payoff), fullMark: 100 },
        ],
      });
    } catch (error) {
      console.error("Erro ao carregar dados do dashboard de admin:", error);
      setDashboardData(null);
    } finally {
      setLoading(false);
    }
  }, [user, dateRange]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleApplyCustomDate = () => {
    if (startDateRef.current && endDateRef.current) {
      setDateRange({
        startDate: startDateRef.current.value,
        endDate: endDateRef.current.value,
      });
      setSelectedPreset('Personalizado');
      setShowDatePicker(false);
    }
  };

  if (loading || !dashboardData) {
    return (
      <div className="p-8 text-center text-text-secondary">
        {loading ? "A carregar dashboard do administrador..." : "Não foi possível carregar os dados do dashboard."}
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Dashboard do Administrador</h1>
          <p className="text-text-secondary mt-1">Visão geral da saúde e desempenho da sua equipe de vendas.</p>
        </div>
        <div className="relative">
          <button 
            onClick={() => setShowDatePicker(!showDatePicker)}
            className="flex items-center gap-2 px-4 py-2 bg-surface text-text-primary font-semibold border border-gray-200 rounded-lg hover:bg-background"
          >
            <Calendar className="w-5 h-5" />
            <span>{selectedPreset}</span>
          </button>
          {showDatePicker && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl p-6 z-10 border border-gray-200">
              <div className="space-y-2 mb-4">
                {Object.keys(DATE_RANGES).map(key => (
                  <button
                    key={key}
                    onClick={() => {
                      setSelectedPreset(key);
                      setDateRange(DATE_RANGES[key as keyof typeof DATE_RANGES]());
                      setShowDatePicker(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${selectedPreset === key ? 'bg-primary text-white' : 'hover:bg-gray-100'}`}
                  >
                    {key}
                  </button>
                ))}
              </div>
              <div className="pt-4 mt-4 border-t border-gray-200">
                <h4 className="text-sm font-semibold mb-2">Período Personalizado</h4>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <input type="date" ref={startDateRef} defaultValue={dateRange.startDate} className="w-full text-sm border-gray-300 rounded-md px-2 py-2" />
                  <input type="date" ref={endDateRef} defaultValue={dateRange.endDate} className="w-full text-sm border-gray-300 rounded-md px-2 py-2" />
                </div>
                <button
                  type="button" 
                  onClick={handleApplyCustomDate}
                  className="w-full px-4 py-2 bg-primary text-white font-semibold rounded-lg hover:opacity-90 transition-opacity"
                >
                  Aplicar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <MetricCard title="Chamadas no Período" value={dashboardData.totalCalls} icon={Phone} />
        <MetricCard title="Pontuação Média" value={dashboardData.avgEfficiencyScore} icon={BookOpen} />
        <MetricCard title="Membros na Equipe" value={dashboardData.teamSize} icon={Users} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-surface p-6 rounded-2xl shadow-lg border border-gray-100 h-[400px]">
            <h3 className="text-lg font-bold text-text-primary mb-4">Adoção do SPIN Selling</h3>
            {dashboardData.spinAnalysis && dashboardData.spinAnalysis.some((d: any) => d.A > 0) ? (
              <SpinRadarChart data={dashboardData.spinAnalysis} />
            ) : (
              <div className="flex h-full items-center justify-center text-text-secondary">
                Nenhum dado de análise SPIN para o período selecionado.
              </div>
            )}
          </div>
          <div className="bg-surface p-6 rounded-2xl shadow-lg border border-gray-100 h-[400px]">
            <h3 className="text-lg font-bold text-text-primary mb-4">Metas e KPIs</h3>
            <KPIWidget title="Metas e KPIs" data={dashboardData.kpis} />
          </div>
      </div>
      <GamificationWidget topPerformer={dashboardData.topPerformer} recentAchievements={dashboardData.recentAchievements} />
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
      const recordings = await baserowService.getCallRecordings(user.organizationId);
      const analyses = await baserowService.getCallAnalyses();
      const analysesMap = new Map(analyses.map(a => [a.Call_Recording?.[0]?.id, a]));
      
      let combinedData: CombinedCallData[] = recordings
        .sort((a, b) => new Date(b.Call_Date).getTime() - new Date(a.Call_Date).getTime())
        .map(rec => ({
          call_id: rec.id.toString(),
          sdr_id: rec.SDR && rec.SDR.length > 0 ? rec.SDR[0].id : null,
          prospect_name: rec.Prospect_Name,
          call_date: rec.Call_Date,
          efficiency_score: analysesMap.get(rec.id)?.Efficiency_Score || 0,
          status: rec.Status?.value || 'N/A',
          sdr_name: '',
          call_duration_seconds: rec.Call_Duration_Seconds || 0,
        }));
      
      const myFilteredCalls = combinedData.filter(call => call.sdr_id === user.id);
      setMyCalls(myFilteredCalls);
    } catch (error) {
      console.error('Erro ao buscar minhas chamadas:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchMyCalls();
  }, [fetchMyCalls]);

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