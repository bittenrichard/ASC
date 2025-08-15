// src/pages/Dashboard.tsx

import React, { useState, useEffect } from 'react';
import { TrendingUp, Phone, Clock, Target, Users, Award } from 'lucide-react';
import { useAuth, AppUser } from '../hooks/useAuth';
import { baserowService, BaserowCallRecording, BaserowCallAnalysis, BaserowUser } from '../lib/baserowService';
import { MetricCard } from '../components/Dashboard/MetricCard';
import { CallsTable } from '../components/Dashboard/CallsTable';

// Interface para os dados da tabela, combinando informações de gravação e análise
interface FormattedCall {
  call_id: string; // Usaremos o ID da gravação como string
  prospect_name: string;
  call_date: string;
  efficiency_score: number;
  status: string;
  sdr_name?: string;
  call_duration_seconds: number;
}

// Interface para as métricas exibidas nos cards
interface DashboardMetrics {
  avgScore: number;
  avgTalkRatio: string;
  totalCalls: number;
  analyzedCalls: number;
  teamSize: number;
  topPerformer: string;
}

export function Dashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    avgScore: 0,
    avgTalkRatio: '0/0',
    totalCalls: 0,
    analyzedCalls: 0,
    teamSize: 0,
    topPerformer: '',
  });
  const [recentCalls, setRecentCalls] = useState<FormattedCall[]>([]);

  useEffect(() => {
    // A função de busca de dados agora é chamada aqui dentro
    const fetchDashboardData = async (currentUser: AppUser) => {
      setLoading(true);
      try {
        const allRecordings = await baserowService.getCallRecordings();
        const allAnalyses = await baserowService.getCallAnalyses();
        const allSDRs = await baserowService.getAllSDRs();

        // Mapeia analyses por recording_id para acesso rápido
        const analysesMap = new Map<number, BaserowCallAnalysis>();
        allAnalyses.forEach(analysis => {
          if (analysis.call_recording && analysis.call_recording.length > 0) {
            const recordingId = analysis.call_recording[0].id;
            analysesMap.set(recordingId, analysis);
          }
        });

        let recordingsToProcess: BaserowCallRecording[] = [];
        let analysesToProcess: BaserowCallAnalysis[] = [];
        let newMetrics: Partial<DashboardMetrics> = {};

        if (currentUser.role === 'manager') {
          recordingsToProcess = allRecordings;
          analysesToProcess = allAnalyses;
          
          // Calcular Top Performer
          const sdrScores: { [sdrId: number]: { totalScore: number; count: number; name: string } } = {};
          allSDRs.forEach(sdr => {
            sdrScores[sdr.id] = { totalScore: 0, count: 0, name: sdr.name };
          });

          allRecordings.forEach(rec => {
            const analysis = analysesMap.get(rec.id);
            if (analysis && rec.sdr && rec.sdr.length > 0) {
              const sdrId = rec.sdr[0].id;
              if (sdrScores[sdrId]) {
                sdrScores[sdrId].totalScore += analysis.efficiency_score;
                sdrScores[sdrId].count += 1;
              }
            }
          });
          
          let topPerformerName = 'N/A';
          let maxAvgScore = -1;

          Object.values(sdrScores).forEach(sdrData => {
            if (sdrData.count > 0) {
              const avg = sdrData.totalScore / sdrData.count;
              if (avg > maxAvgScore) {
                maxAvgScore = avg;
                topPerformerName = sdrData.name;
              }
            }
          });

          newMetrics = {
            teamSize: allSDRs.length,
            topPerformer: topPerformerName,
          };

        } else { // Papel é 'sdr'
          recordingsToProcess = allRecordings.filter(rec =>
            rec.sdr && rec.sdr.some(s => s.id === currentUser.id)
          );
          const sdrRecordingIds = new Set(recordingsToProcess.map(rec => rec.id));
          analysesToProcess = allAnalyses.filter(analysis =>
            analysis.call_recording && analysis.call_recording.some(rec => sdrRecordingIds.has(rec.id))
          );
        }
        
        // Calcular métricas comuns
        const totalCalls = recordingsToProcess.length;
        const analyzedCalls = analysesToProcess.length;
        const avgScore = analyzedCalls > 0
          ? Math.round(analysesToProcess.reduce((sum, a) => sum + a.efficiency_score, 0) / analyzedCalls)
          : 0;
        
        // Formatar chamadas recentes para a tabela
        const sdrNamesMap = new Map(allSDRs.map(sdr => [sdr.id, sdr.name]));
        
        const formattedCalls = recordingsToProcess
          .sort((a, b) => new Date(b.call_date).getTime() - new Date(a.call_date).getTime()) // Ordenar por mais recente
          .slice(0, 10) // Pegar as 10 últimas
          .map(rec => {
            const analysis = analysesMap.get(rec.id);
            const sdrInfo = rec.sdr && rec.sdr.length > 0 ? { id: rec.sdr[0].id, name: sdrNamesMap.get(rec.sdr[0].id) || 'N/A' } : null;
            
            return {
              call_id: rec.id.toString(),
              prospect_name: rec.prospect_name,
              call_date: rec.call_date,
              efficiency_score: analysis ? analysis.efficiency_score : 0,
              status: rec.status[0]?.value || 'N/A',
              sdr_name: sdrInfo?.name,
              call_duration_seconds: rec.call_duration_seconds,
            };
          });

        setMetrics({
          avgScore,
          avgTalkRatio: 'N/A', // Placeholder, precisa ser calculado
          totalCalls,
          analyzedCalls,
          teamSize: newMetrics.teamSize || 0,
          topPerformer: newMetrics.topPerformer || '',
        });

        setRecentCalls(formattedCalls);

      } catch (error) {
        console.error('Erro ao buscar dados do dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchDashboardData(user);
    }
  }, [user]);


  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
           <div className="h-64 bg-gray-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {user?.role === 'manager' ? 'Dashboard da Equipe' : 'Meu Dashboard'}
        </h1>
        <p className="text-gray-600">
          {user?.role === 'manager' 
            ? 'Visão geral do desempenho da sua equipe e métricas de chamadas'
            : 'Visão geral do seu desempenho e análises de chamadas'
          }
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Pontuação Média"
          value={metrics.avgScore}
          icon={TrendingUp}
          iconColor="text-blue-600"
        />
        
        <MetricCard
          title="Proporção Fala/Escuta"
          value={metrics.avgTalkRatio}
          icon={Clock}
          iconColor="text-green-600"
        />
        
        <MetricCard
          title="Total de Chamadas"
          value={metrics.totalCalls}
          icon={Phone}
          iconColor="text-purple-600"
        />

        {user?.role === 'manager' ? (
          <MetricCard
            title="Tamanho da Equipe"
            value={metrics.teamSize}
            icon={Users}
            iconColor="text-orange-600"
          />
        ) : (
          <MetricCard
            title="Chamadas Analisadas"
            value={metrics.analyzedCalls}
            icon={Target}
            iconColor="text-red-600"
          />
        )}
      </div>

      {/* Top Performer Card (Manager only) */}
      {user?.role === 'manager' && metrics.topPerformer && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
          <div className="flex items-center space-x-3">
            <Award className="h-6 w-6 text-blue-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Melhor Desempenho</h3>
              <p className="text-blue-600 font-medium">{metrics.topPerformer}</p>
            </div>
          </div>
        </div>
      )}

      {/* Recent Calls Table */}
      <CallsTable calls={recentCalls} showSDRColumn={user?.role === 'manager'} />
    </div>
  );
}