// src/pages/Leaderboard.tsx
import React, { useState, useEffect } from 'react';
import { Trophy, Award } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface LeaderboardEntry {
  sdr_id: string;
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
      setLoading(true);
      // Lógica para ir buscar dados reais da base de dados será implementada aqui no futuro.
      // Por agora, usamos dados mock para o design.
      const mockLeaderboard: LeaderboardEntry[] = [
        { sdr_id: '3', name: 'Pedro Oliveira', email: 'pedro.oliveira@empresa.com', avg_score: 92, total_calls: 8, rank: 1 },
        { sdr_id: '1', name: 'João Silva', email: 'joao.silva@empresa.com', avg_score: 78, total_calls: 12, rank: 2 },
      ];
      setLeaderboard(mockLeaderboard);
      setLoading(false);
    };

    if (user?.role === 'administrator') {
      fetchLeaderboard();
    } else {
      setLoading(false);
    }
  }, [user]);

  // CORREÇÃO APLICADA AQUI: Verificamos o 'role' do utilizador.
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
        <h1 className="text-3xl font-bold text-text-primary">Ranking da Equipa</h1>
        <p className="text-text-secondary mt-1">Desempenho e métricas de todos os SDRs da sua organização.</p>
      </div>
      <div className="bg-surface p-8 rounded-2xl shadow-lg border border-gray-100 text-center">
        <p className="text-text-secondary">A funcionalidade de ranking está em desenvolvimento.</p>
      </div>
    </div>
  );
}