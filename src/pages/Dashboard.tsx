// src/pages/Dashboard.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Phone, Users, BookOpen, Star, ShieldCheck, Target, TrendingUp, Loader2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { baserowService, GoalData, AppUserObject, SpinAnalysisData, FIELD_IDS } from '../lib/baserowService';
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
interface ChartDataPoint {
  subject: string;
  A: number;
  fullMark: number;
}

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
};

// --- Componente para o Dashboard de Administrador ---
function AdminDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [recentCalls, setRecentCalls] = useState<CombinedCallData[]>([]);
  const [allSDRs, setAllSDRs] = useState<AppUserObject[]>([]);
  const [spinChartData, setSpinChartData] = useState<ChartDataPoint[]>([]);
  
  const [selectedSdrId, setSelectedSdrId] = useState<string>('team');
  const [dateRange, setDateRange] = useState<DateRange>(DATE_RANGES['Este Mês']());
  const [selectedPreset, setSelectedPreset] = useState<string>('Este Mês');

  const fetchDashboardData = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    try {
      const sdrIdToFetch = selectedSdrId === 'team' ? undefined : parseInt(selectedSdrId);

      const [sdrList, recordings, analyses, goals, leaderboard] = await Promise.all([
        baserowService.getAllSDRs(user.organizationId),
        baserowService.getCallRecordings(user.organizationId, sdrIdToFetch),
        baserowService.getCallAnalyses(user.organizationId, sdrIdToFetch),
        baserowService.getGoals(user.organizationId),
        baserowService.getLeaderboardData(user.organizationId)
      ]);
      
      const safeSDRs = sdrList || [];
      const safeRecordings = recordings || [];
      const safeAnalyses = analyses || [];
      const safeGoals = goals || [];
      const safeLeaderboard = leaderboard || [];

      setAllSDRs(safeSDRs);
      const sdrMap = new Map(safeSDRs.map(sdr => [sdr.id, sdr.name]));
      const analysesMap = new Map(safeAnalyses.map(a => [a[FIELD_IDS.analyses.callRecording]?.[0]?.id, a]));

      const start = new Date(dateRange.startDate + 'T00:00:00');
      const end = new Date(dateRange.endDate + 'T23:59:59');

      const filteredRecordings = safeRecordings.filter(rec => {
        const callDateStr = rec[FIELD_IDS.callRecordings.callDate];
        if (!callDateStr) return false;
        const callDate = new Date(callDateStr);
        return callDate >= start && callDate <= end;
      });

      const combinedData: CombinedCallData[] = filteredRecordings
        .map(rec => {
          const sdrId = rec[FIELD_IDS.callRecordings.sdr]?.[0]?.id || null;
          const analysis = analysesMap.get(rec.id);
          return {
            call_id: rec.id.toString(),
            sdr_id: sdrId,
            prospect_name: rec[FIELD_IDS.callRecordings.prospectName] || 'N/A',
            call_date: rec[FIELD_IDS.callRecordings.callDate],
            efficiency_score: analysis?.[FIELD_IDS.analyses.efficiencyScore] || 0,
            status: analysis ? 'Analisada' : 'Pendente',
            sdr_name: sdrId ? sdrMap.get(sdrId) : 'N/A',
            call_duration_seconds: rec[FIELD_IDS.callRecordings.duration] || 0,
          };
        })
        .sort((a, b) => new Date(b.call_date).getTime() - new Date(a.call_date).getTime());
      
      setRecentCalls(combinedData.slice(0, 5));

      const totalCalls = combinedData.length;
      const analyzedCalls = combinedData.filter(c => c.status === 'Analisada');
      const totalScore = analyzedCalls.reduce((sum, call) => sum + call.efficiency_score, 0);
      const avgEfficiencyScore = analyzedCalls.length > 0 ? Math.round(totalScore / analyzedCalls.length) : 0;
      
      const topPerformer = safeLeaderboard.length > 0 ? { name: safeLeaderboard[0].name, score: safeLeaderboard[0].avg_score } : { name: 'N/A', score: 0 };
      
      // Lógica para o Gráfico de Radar SPIN
      let avgSpinScores = { situation: 0, problem: 0, implication: 0, need_payoff: 0 };
      let spinCount = 0;
      safeAnalyses.forEach(analysis => {
          const spinRaw = analysis[FIELD_IDS.analyses.spinAnalysis];
          if (spinRaw) {
              try {
                  const spinData: SpinAnalysisData = typeof spinRaw === 'string' ? JSON.parse(spinRaw) : spinRaw;
                  if (spinData && spinData.situation) {
                    avgSpinScores.situation += spinData.situation.score;
                    avgSpinScores.problem += spinData.problem.score;
                    avgSpinScores.implication += spinData.implication.score;
                    avgSpinScores.need_payoff += spinData.need_payoff.score;
                    spinCount++;
                  }
              } catch (e) {
                  console.error("Erro ao fazer parse da análise SPIN:", e);
              }
          }
      });

      if (spinCount > 0) {
          setSpinChartData([
              { subject: 'Situação', A: Math.round(avgSpinScores.situation / spinCount), fullMark: 100 },
              { subject: 'Problema', A: Math.round(avgSpinScores.problem / spinCount), fullMark: 100 },
              { subject: 'Implicação', A: Math.round(avgSpinScores.implication / spinCount), fullMark: 100 },
              { subject: 'Necessidade', A: Math.round(avgSpinScores.need_payoff / spinCount), fullMark: 100 },
          ]);
      } else {
          setSpinChartData([]);
      }
      
      setDashboardData({
        totalCalls: totalCalls,
        avgEfficiencyScore: avgEfficiencyScore,
        kpis: [], 
        topPerformer: topPerformer,
        recentAchievements: [],
      });

    } catch (error) {
      console.error("Erro ao carregar dados do dashboard de admin:", error);
      toast.error("Falha ao carregar dados do Dashboard.");
      setDashboardData(null);
    } finally {
      setLoading(false);
    }
  }, [user, dateRange, selectedSdrId]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (loading || !dashboardData) {
    return <div className="p-8 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto" /><p className="mt-2">A carregar dashboard...</p></div>;
  }

  const selectedSdrName = selectedSdrId === 'team' ? 'Equipe Inteira' : allSDRs.find(sdr => sdr.id.toString() === selectedSdrId)?.name;
  const displayStartDate = new Date(dateRange.startDate.replace(/-/g, '/')).toLocaleDateString('pt-BR');
  const displayEndDate = new Date(dateRange.endDate.replace(/-/g, '/')).toLocaleDateString('pt-BR');

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
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-surface p-6 rounded-2xl shadow-lg border border-gray-100 flex flex-col justify-between">
          <h3 className="text-lg font-bold text-text-primary mb-4">Média da Análise SPIN</h3>
          <div className="h-64 flex items-center justify-center">
            {spinChartData.length > 0 ? (
                <SpinRadarChart data={spinChartData} />
            ) : (
                <div className="text-center text-text-secondary">
                    <p>Dados de análise SPIN não disponíveis para este período ou SDR.</p>
                </div>
            )}
          </div>
        </div>
        <div className="lg:col-span-2">
            <CallsTable title="Últimas Chamadas da Equipe" calls={recentCalls} showSDRColumn={true} />
        </div>
      </div>

    </div>
  );
}

// --- Componente para o Dashboard de SDR ---
function SdrDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [myCalls, setMyCalls] = useState<CombinedCallData[]>([]);
  const [sdrSpinChartData, setSdrSpinChartData] = useState<ChartDataPoint[]>([]);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
        const [recordings, analyses] = await Promise.all([
            baserowService.getCallRecordings(user.organizationId, user.id),
            baserowService.getCallAnalyses(user.organizationId, user.id),
        ]);
        
        const safeRecordings = recordings || [];
        const safeAnalyses = analyses || [];
        const analysesMap = new Map(safeAnalyses.map(a => [a[FIELD_IDS.analyses.callRecording]?.[0]?.id, a]));
        
        const combinedData: CombinedCallData[] = safeRecordings
          .sort((a, b) => new Date(b[FIELD_IDS.callRecordings.callDate]).getTime() - new Date(a[FIELD_IDS.callRecordings.callDate]).getTime())
          .map(rec => {
              const analysis = analysesMap.get(rec.id);
              return {
                  call_id: rec.id.toString(),
                  sdr_id: user.id,
                  prospect_name: rec[FIELD_IDS.callRecordings.prospectName] || 'N/A',
                  call_date: rec[FIELD_IDS.callRecordings.callDate],
                  efficiency_score: analysis?.[FIELD_IDS.analyses.efficiencyScore] || 0,
                  status: analysis ? 'Analisada' : 'Pendente',
                  sdr_name: user.name,
                  call_duration_seconds: rec[FIELD_IDS.callRecordings.duration] || 0,
              };
          });
        setMyCalls(combinedData);

        let avgSpinScores = { situation: 0, problem: 0, implication: 0, need_payoff: 0 };
        let spinCount = 0;
        safeAnalyses.forEach(analysis => {
            const spinRaw = analysis[FIELD_IDS.analyses.spinAnalysis];
            if (spinRaw) {
                try {
                    const spinData: SpinAnalysisData = typeof spinRaw === 'string' ? JSON.parse(spinRaw) : spinRaw;
                     if (spinData && spinData.situation) {
                        avgSpinScores.situation += spinData.situation.score;
                        avgSpinScores.problem += spinData.problem.score;
                        avgSpinScores.implication += spinData.implication.score;
                        avgSpinScores.need_payoff += spinData.need_payoff.score;
                        spinCount++;
                    }
                } catch (e) { console.error("Erro ao fazer parse da análise SPIN:", e); }
            }
        });

        if (spinCount > 0) {
            setSdrSpinChartData([
                { subject: 'Situação', A: Math.round(avgSpinScores.situation / spinCount), fullMark: 100 },
                { subject: 'Problema', A: Math.round(avgSpinScores.problem / spinCount), fullMark: 100 },
                { subject: 'Implicação', A: Math.round(avgSpinScores.implication / spinCount), fullMark: 100 },
                { subject: 'Necessidade', A: Math.round(avgSpinScores.need_payoff / spinCount), fullMark: 100 },
            ]);
        } else {
            setSdrSpinChartData([]);
        }

      } catch (error) {
        console.error('Erro ao buscar os dados do SDR:', error);
        toast.error("Falha ao carregar os seus dados.");
      } finally {
        setLoading(false);
      }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalCalls = myCalls.length;
  const analyzedCalls = myCalls.filter(c => c.status === 'Analisada');
  const totalScore = analyzedCalls.reduce((sum, call) => sum + call.efficiency_score, 0);
  const avgEfficiencyScore = analyzedCalls.length > 0 ? Math.round(totalScore / analyzedCalls.length) : 0;
  
  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-text-primary">Meu Dashboard</h1>
        <p className="text-text-secondary mt-1">Visão geral do seu desempenho e análises de chamadas.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <MetricCard title="Minhas Chamadas" value={totalCalls} icon={Phone} />
        <MetricCard title="Minha Pontuação Média" value={`${avgEfficiencyScore} / 100`} icon={TrendingUp} />
        <div className="bg-surface p-6 rounded-2xl shadow-lg border border-gray-100 flex flex-col justify-between">
            <h3 className="text-lg font-bold text-text-primary mb-4">Minha Análise SPIN Média</h3>
            <div className="h-64 flex items-center justify-center">
            {loading ? <Loader2 className="animate-spin" /> : sdrSpinChartData.length > 0 ? (
                <SpinRadarChart data={sdrSpinChartData} />
            ) : (
                <div className="text-center text-text-secondary">
                    <p>Você ainda não tem chamadas analisadas.</p>
                </div>
            )}
          </div>
        </div>
      </div>
      
      {loading ? (
        <div className="p-8 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto" /><p className="mt-2">A carregar as suas chamadas...</p></div>
      ) : (
        <CallsTable title="Minhas Últimas Chamadas" calls={myCalls} showSDRColumn={false} />
      )}
    </div>
  );
}

// --- Componente Principal ---
export function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  if (authLoading) {
    return <div className="p-8 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto" /><p className="mt-2">A autenticar...</p></div>;
  }
  return user?.role === 'administrator' ? <AdminDashboard /> : <SdrDashboard />;
}