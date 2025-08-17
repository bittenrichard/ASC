// src/pages/Leaderboard.tsx
import React, { useState, useEffect } from 'react';
import { Trophy, Users } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { baserowService } from '../lib/baserowService';
import toast from 'react-hot-toast';
import { ComparisonModal } from '../components/Leaderboard/ComparisonModal'; // NOVA IMPORTAÇÃO

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
  const [selectedSDRs, setSelectedSDRs] = useState<LeaderboardEntry[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    // ... (lógica fetchLeaderboard existente)
  }, [user]);

  const handleSelectSDR = (sdr: LeaderboardEntry) => {
    setSelectedSDRs(prev =>
      prev.find(item => item.sdr_id === sdr.sdr_id)
        ? prev.filter(item => item.sdr_id !== sdr.sdr_id)
        : [...prev, sdr]
    );
  };

  if (loading) {
    return <div className="p-8 text-center text-text-secondary">A carregar ranking...</div>;
  }

  return (
    <>
      <ComparisonModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        sdrData={selectedSDRs}
      />
      <div className="p-8 space-y-8">
        <div className="flex justify-between items-center">
            <div>
                <h1 className="text-3xl font-bold text-text-primary">Ranking da Equipe</h1>
                <p className="text-text-secondary mt-1">Desempenho e métricas de todos os SDRs.</p>
            </div>
            {selectedSDRs.length >= 2 && (
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white font-semibold rounded-lg hover:opacity-90"
                >
                    <Users className="w-5 h-5"/>
                    Comparar {selectedSDRs.length} SDRs
                </button>
            )}
        </div>
        
        <div className="bg-surface p-6 rounded-2xl shadow-lg border border-gray-100">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-text-secondary uppercase bg-background">
                <tr>
                  <th className="px-2 py-3"></th>
                  {/* ... (cabeçalhos existentes) */}
                </tr>
              </thead>
              <tbody className="text-text-primary">
                {leaderboard.map((sdr, index) => (
                  <tr key={sdr.sdr_id} className="hover:bg-background border-b border-gray-100">
                    <td className="px-2 py-4">
                        <input 
                            type="checkbox" 
                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            checked={selectedSDRs.some(item => item.sdr_id === sdr.sdr_id)}
                            onChange={() => handleSelectSDR(sdr)}
                        />
                    </td>
                    {/* ... (células da tabela existentes) */}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}