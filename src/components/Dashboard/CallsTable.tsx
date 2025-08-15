// src/components/Dashboard/CallsTable.tsx

import React from 'react';
import { Play, Clock, TrendingUp, Calendar } from 'lucide-react';
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
  title?: string; // Propriedade opcional para o título
}

export function CallsTable({ calls, showSDRColumn = false, title = "Chamadas Recentes" }: CallsTableProps) {
  const navigate = useNavigate();

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Analisada': return 'text-green-600 bg-green-50';
      case 'Processando': return 'text-yellow-600 bg-yellow-50';
      case 'Análise Pendente': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prospecto</th>
              {showSDRColumn && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SDR</th>}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duração</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pontuação</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {calls.map((call) => (
              <tr 
                key={call.call_id}
                className="hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => navigate(`/call/${call.call_id}`)}
              >
                <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm font-medium text-gray-900">{call.prospect_name}</div></td>
                {showSDRColumn && <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm text-gray-900">{call.sdr_name || 'N/A'}</div></td>}
                <td className="px-6 py-4 whitespace-nowrap"><div className="flex items-center text-sm text-gray-500"><Calendar className="h-4 w-4 mr-1" />{new Date(call.call_date).toLocaleDateString('pt-BR')}</div></td>
                <td className="px-6 py-4 whitespace-nowrap"><div className="flex items-center text-sm text-gray-500"><Clock className="h-4 w-4 mr-1" />{formatDuration(call.call_duration_seconds)}</div></td>
                <td className="px-6 py-4 whitespace-nowrap"><span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getScoreColor(call.efficiency_score)}`}><TrendingUp className="h-3 w-3 mr-1" />{call.efficiency_score}/100</span></td>
                <td className="px-6 py-4 whitespace-nowrap"><span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(call.status)}`}>{call.status}</span></td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button onClick={(e) => { e.stopPropagation(); navigate(`/call/${call.call_id}`); }} className="text-blue-600 hover:text-blue-800 transition-colors">
                    <Play className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {calls.length === 0 && <div className="text-center py-8 text-gray-500">Nenhuma chamada encontrada</div>}
    </div>
  );
}