// src/pages/Leaderboard.tsx
import React, { useState, useEffect } from 'react';
import { Trophy } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { baserowService } from '../lib/baserowService';
import toast from 'react-hot-toast';

interface LeaderboardEntry {
  sdr_id: number;
  name: string;
  email: string;
  avg_score: number;
  total_calls: number;
  rank: number;
}

export function Leaderboard() {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      if (!user?.organizationId) return;
      setLoading(true);
      try {
        const data = await baserowService.getLeaderboardData(user.organizationId);
        setLeaderboard(data);
      } catch (error) {
        console.error("Erro ao carregar o ranking:", error);
        toast.error("Não foi possível carregar o ranking.");
      } finally {
        setLoading(false);
      }
    };

    if (user?.role === 'administrator') {
      fetchLeaderboard();
    } else {
      setLoading(false);
    }
  }, [user]);

  if (user?.role !== 'administrator') {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold text-text-primary">Acesso Negado</h2>
        <p className="text-text-secondary mt-2">Apenas administradores podem visualizar o ranking.</p>
      </div>
    );
  }

  if (loading) {
    return <div className="p-8 text-center text-text-secondary">A carregar ranking...</div>;
  }

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-text-primary">Ranking da Equipe</h1>
        <p className="text-text-secondary mt-1">Desempenho e métricas de todos os SDRs da sua organização.</p>
      </div>
      
      <div className="bg-surface p-6 rounded-2xl shadow-lg border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-text-secondary uppercase bg-background">
              <tr>
                <th className="px-6 py-3">Posição</th>
                <th className="px-6 py-3">SDR</th>
                <th className="px-6 py-3">Total de Chamadas Analisadas</th>
                <th className="px-6 py-3">Pontuação Média de Eficiência</th>
              </tr>
            </thead>
            <tbody className="text-text-primary">
              {leaderboard.map((sdr, index) => (
                <tr key={sdr.sdr_id} className="hover:bg-background border-b border-gray-100">
                  <td className="px-6 py-4 font-semibold">
                    <div className="flex items-center gap-3">
                      {index < 3 ? <Trophy className={`w-6 h-6 ${
                        index === 0 ? 'text-yellow-400' : index === 1 ? 'text-gray-400' : 'text-yellow-600'
                      }`} /> : <span className="w-6 text-center text-text-secondary font-normal">{sdr.rank}</span>}
                      <span className="text-lg">{sdr.rank}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-base">{sdr.name}</div>
                    <div className="text-xs text-text-secondary">{sdr.email}</div>
                  </td>
                  <td className="px-6 py-4 text-center text-lg">{sdr.total_calls}</td>
                  <td className="px-6 py-4 font-bold text-primary text-xl">{sdr.avg_score} / 100</td>
                </tr>
              ))}
            </tbody>
          </table>
          {leaderboard.length === 0 && <div className="text-center py-10 text-text-secondary">Nenhum dado de ranking disponível. Adicione chamadas e análises para começar.</div>}
        </div>
      </div>
    </div>
  );
}