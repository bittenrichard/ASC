// src/components/Dashboard/CallsTable.tsx
import React from 'react';
import { TrendingUp, Calendar, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Call {
  call_id: string;
  prospect_name: string;
  call_date: string;
  efficiency_score: number;
  status: string;
  sdr_name?: string;
  call_duration_seconds: number;
}

interface CallsTableProps {
  calls: Call[];
  showSDRColumn?: boolean;
  title?: string;
}

export function CallsTable({ calls, showSDRColumn = false, title = "Chamadas Recentes" }: CallsTableProps) {
  const navigate = useNavigate();

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-accent-dark bg-accent/10';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Analisada': return 'text-accent-dark bg-accent/10';
      case 'Pendente': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-text-secondary bg-gray-100';
    }
  };

  const formatDuration = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-surface p-6 rounded-2xl shadow-lg border border-gray-100">
      <h3 className="text-lg font-bold text-text-primary mb-4">{title}</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-text-secondary uppercase bg-background">
            <tr>
              <th className="px-6 py-3">Prospecto</th>
              {showSDRColumn && <th className="px-6 py-3">SDR</th>}
              <th className="px-6 py-3">Data</th>
              <th className="px-6 py-3">Duração</th>
              <th className="px-6 py-3">Pontuação</th>
              <th className="px-6 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="text-text-primary">
            {calls.map((call) => (
              <tr 
                key={call.call_id}
                className="hover:bg-background cursor-pointer border-b border-gray-100"
                onClick={() => navigate(`/call/${call.call_id}`)}
              >
                <td className="px-6 py-4 font-semibold">{call.prospect_name}</td>
                {showSDRColumn && <td className="px-6 py-4">{call.sdr_name || 'N/A'}</td>}
                <td className="px-6 py-4 flex items-center gap-2 text-text-secondary"><Calendar className="h-4 w-4" />{new Date(call.call_date).toLocaleDateString('pt-BR')}</td>
                <td className="px-6 py-4 flex items-center gap-2 text-text-secondary"><Clock className="h-4 w-4" />{formatDuration(call.call_duration_seconds)}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full font-semibold ${getScoreColor(call.efficiency_score)}`}>
                    <TrendingUp className="h-4 w-4 mr-1" />
                    {call.efficiency_score}/100
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex px-2.5 py-1 rounded-full font-semibold ${getStatusColor(call.status)}`}>
                    {call.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {calls.length === 0 && <div className="text-center py-10 text-text-secondary">Nenhuma chamada encontrada</div>}
      </div>
    </div>
  );
}