// src/pages/Dashboard.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Phone, Users, BookOpen, Star, ShieldCheck } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { baserowService } from '../lib/baserowService';
import { MetricCard } from '../components/Dashboard/MetricCard';
import { CallsTable } from '../components/Dashboard/CallsTable';
import { KPIWidget } from '../components/Dashboard/KPIWidget';
import { GamificationWidget } from '../components/Dashboard/GamificationWidget';

// --- Interfaces ---
// ... (Interfaces sem alterações) ...

// --- Componente para o Dashboard de Administrador ---
function AdminDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [recentCalls, setRecentCalls] = useState<any[]>([]);
  const [adminData, setAdminData] = useState<any | null>(null);

  useEffect(() => {
    const fetchAdminData = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const recordings = await baserowService.getCallRecordings(user.organizationId);
        const allSDRs = await baserowService.getAllSDRs(user.organizationId);
        setAdminData({
          totalCalls: recordings.length,
          teamSize: allSDRs.length,
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
        });
      } catch (error) {
        console.error("Erro ao carregar dados do dashboard de admin:", error);
        setAdminData(null);
      } finally {
        setLoading(false);
      }
    };
    fetchAdminData();
  }, [user]);

  if (loading) {
    return <div className="p-8 text-center text-text-secondary">A carregar dashboard do administrador...</div>;
  }
  if (!adminData) {
    return <div className="p-8 text-center text-text-secondary">Não foi possível carregar os dados do dashboard.</div>;
  }

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-text-primary">Dashboard do Administrador</h1>
        <p className="text-text-secondary mt-1">Visão geral da saúde e desempenho da sua equipe de vendas.</p> {/* CORRIGIDO */}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <MetricCard title="Total de Chamadas" value={adminData.totalCalls} icon={Phone} />
        <MetricCard title="Pontuação Média" value="N/A" icon={BookOpen} />
        <MetricCard title="Membros na Equipe" value={adminData.teamSize} icon={Users} /> {/* CORRIGIDO */}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1"><KPIWidget title="Metas e KPIs Mensais" data={adminData.kpis} /></div>
          <div className="lg:col-span-2"><GamificationWidget topPerformer={adminData.topPerformer} recentAchievements={adminData.recentAchievements} /></div>
      </div>
      <CallsTable title="Últimas Chamadas da Equipe" calls={recentCalls} showSDRColumn={true} /> {/* CORRIGIDO */}
    </div>
  );
}

// --- Componente para o Dashboard de SDR ---
function SdrDashboard() {
  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-text-primary">Meu Dashboard</h1>
        <p className="text-text-secondary mt-1">Visão geral do seu desempenho e análises de chamadas.</p>
      </div>
      <CallsTable title="Minhas Últimas Chamadas" calls={[]} showSDRColumn={false} />
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