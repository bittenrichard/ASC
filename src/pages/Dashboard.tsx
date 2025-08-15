// src/pages/Dashboard.tsx

import React, { useState, useEffect } from 'react';
import { TrendingUp, Phone, Users, Award, BookOpen, Smile, Frown } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { baserowService } from '../lib/baserowService';
import { MetricCard } from '../components/Dashboard/MetricCard';
import { CallsTable } from '../components/Dashboard/CallsTable';
import { SentimentPieChart } from '../components/Dashboard/charts/SentimentPieChart';
import { TeamScoreGauge } from '../components/Dashboard/charts/TeamScoreGauge';
import { TopicsBarChart } from '../components/Dashboard/charts/TopicsBarChart';

// Tipos para os dados do dashboard
interface FormattedCall {
  call_id: string;
  prospect_name: string;
  call_date: string;
  efficiency_score: number;
  status: string;
  sdr_name?: string;
  call_duration_seconds: number;
}

interface AdminDashboardData {
  teamScore: number;
  teamTarget: number;
  playbookAdherence: number;
  sentimentDistribution: { name: 'Positivo' | 'Neutro' | 'Negativo'; value: number }[];
  topTopics: { name: string; count: number }[];
  topPerformer: string;
  teamSize: number;
  totalCalls: number;
}

export function Dashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [recentCalls, setRecentCalls] = useState<FormattedCall[]>([]);
  const [adminData, setAdminData] = useState<AdminDashboardData | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;
      setLoading(true);

      try {
        const recordings = await baserowService.getCallRecordings();
        const analyses = await baserowService.getCallAnalyses();
        const allSDRs = await baserowService.getAllSDRs();

        const analysesMap = new Map(analyses.map(a => [a.call_recording[0]?.id, a]));
        const sdrMap = new Map(allSDRs.map(sdr => [sdr.id, sdr.name]));

        if (user.role === 'administrator') {
          // --- Lógica para o Dashboard do Administrador ---
          const analyzedCalls = analyses.filter(a => a.efficiency_score > 0);
          
          // 1. Média da Equipe
          const totalScore = analyzedCalls.reduce((sum, a) => sum + a.efficiency_score, 0);
          const teamScore = analyzedCalls.length > 0 ? Math.round(totalScore / analyzedCalls.length) : 0;
          
          // 2. Análise de Sentimento
          const sentimentCounts = { Positivo: 0, Neutro: 0, Negativo: 0 };
          analyzedCalls.forEach(a => {
            const sentiment = a.sentiment[0]?.value;
            if (sentiment && sentimentCounts.hasOwnProperty(sentiment)) {
              sentimentCounts[sentiment]++;
            }
          });
          const sentimentDistribution = Object.entries(sentimentCounts).map(([name, value]) => ({ name: name as 'Positivo' | 'Neutro' | 'Negativo', value }));

          // 3. Tópicos Mais Comuns (Simulação)
          const topTopics = [
            { name: 'Preço', count: 25 }, { name: 'Concorrente', count: 18 },
            { name: 'Integração', count: 15 }, { name: 'Contrato', count: 12 },
          ];

          setAdminData({
            teamScore,
            teamTarget: 85, // Meta fixa por enquanto
            playbookAdherence: 78, // Simulado
            sentimentDistribution,
            topTopics,
            topPerformer: 'Pedro Oliveira', // Simulado
            teamSize: allSDRs.length,
            totalCalls: recordings.length,
          });
        }
        
        // Lógica para chamadas recentes (comum a ambos os papéis)
        const callsToShow = user.role === 'administrator' ? recordings : recordings.filter(r => r.sdr[0]?.id === user.id);
        const formattedCalls = callsToShow
            .sort((a, b) => new Date(b.call_date).getTime() - new Date(a.call_date).getTime())
            .slice(0, 5)
            .map(rec => ({
                call_id: rec.id.toString(),
                prospect_name: rec.prospect_name,
                call_date: rec.call_date,
                efficiency_score: analysesMap.get(rec.id)?.efficiency_score || 0,
                status: rec.status[0]?.value || 'N/A',
                sdr_name: sdrMap.get(rec.sdr[0]?.id) || 'N/A',
                call_duration_seconds: rec.call_duration_seconds,
            }));
        setRecentCalls(formattedCalls);

      } catch (error) {
        console.error("Erro ao carregar dados do dashboard:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [user]);

  if (loading) {
    return <div className="p-6 text-center">Carregando...</div>;
  }
  
  // Renderiza o Dashboard do Administrador
  if (user?.role === 'administrator' && adminData) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard do Administrador</h1>
          <p className="text-gray-600">Visão geral da saúde e desempenho da sua equipe de vendas.</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna Principal */}
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <MetricCard title="Total de Chamadas" value={adminData.totalCalls} icon={Phone} />
              <MetricCard title="Aderência ao Playbook" value={`${adminData.playbookAdherence}%`} icon={BookOpen} />
              <MetricCard title="Membros na Equipe" value={adminData.teamSize} icon={Users} />
            </div>
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Tópicos Mais Comuns</h3>
              <TopicsBarChart data={adminData.topTopics} />
            </div>
          </div>

          {/* Coluna Lateral */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border p-6 h-60">
              <TeamScoreGauge score={adminData.teamScore} target={adminData.teamTarget} />
            </div>
            <div className="bg-white rounded-xl shadow-sm border p-6">
               <h3 className="text-lg font-semibold text-gray-800 mb-4">Distribuição de Sentimento</h3>
              <SentimentPieChart data={adminData.sentimentDistribution} />
            </div>
          </div>
        </div>
        
        <CallsTable title="Últimas Chamadas da Equipe" calls={recentCalls} showSDRColumn={true} />
      </div>
    );
  }

  // Renderiza o Dashboard do SDR (simplificado)
  return (
      <div className="p-6 space-y-6">
        <div>
            <h1 className="text-2xl font-bold text-gray-900">Meu Dashboard</h1>
            <p className="text-gray-600">Visão geral do seu desempenho e análises de chamadas.</p>
        </div>
        {/* Adicionar métricas específicas do SDR aqui no futuro */}
        <CallsTable title="Minhas Últimas Chamadas" calls={recentCalls} showSDRColumn={false} />
      </div>
  );
}