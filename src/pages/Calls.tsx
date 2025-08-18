// src/pages/Calls.tsx

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { baserowService, BaserowCallRecording, BaserowCallAnalysis, FIELD_IDS } from '../lib/baserowService';
import { UploadCloud, Loader2, Search, Calendar, User, Clock, Star } from 'lucide-react';
import { UploadModal } from '../components/Calls/UploadModal';
import { useNavigate } from 'react-router-dom';

// Interface para os dados combinados que a tabela vai usar
interface CombinedCallData {
  call_id: string;
  sdr_id: number | null;
  prospect_name: string;
  call_date: string;
  efficiency_score: number;
  status: string;
  sdr_name: string;
  call_duration_seconds: number;
}

export default function Calls() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [allCalls, setAllCalls] = useState<CombinedCallData[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Função para buscar e combinar os dados do Baserow
  const fetchCallsData = useCallback(async () => {
    if (!user || !user.organizationId) {
      setLoadingData(false);
      return;
    }

    setLoadingData(true);
    try {
      // Busca os dados brutos do Baserow
      const recordings: BaserowCallRecording[] = await baserowService.getCallRecordings(user.organizationId);
      const analyses: BaserowCallAnalysis[] = await baserowService.getCallAnalyses(user.organizationId);
      const allSDRs = await baserowService.getAllSDRs(user.organizationId);

      // Cria mapas para facilitar a busca de dados relacionados
      const analysesMap = new Map(analyses.map(a => [a[FIELD_IDS.analyses.callRecording]?.[0]?.id, a]));
      const sdrMap = new Map(allSDRs.map(sdr => [sdr.id, sdr.name]));

      // Combina os dados, usando a "REGRA SUPREMA" (FIELD_IDS)
      let combinedData: CombinedCallData[] = recordings
        .sort((a, b) => new Date(b[FIELD_IDS.callRecordings.callDate]).getTime() - new Date(a[FIELD_IDS.callRecordings.callDate]).getTime())
        .map(rec => {
          const sdrId = rec[FIELD_IDS.callRecordings.sdr]?.[0]?.id || null;
          const analysisData = analysesMap.get(rec.id);
          
          return {
            call_id: rec.id.toString(),
            sdr_id: sdrId,
            prospect_name: rec[FIELD_IDS.callRecordings.prospectName] || 'N/A',
            call_date: rec[FIELD_IDS.callRecordings.callDate],
            efficiency_score: analysisData?.[FIELD_IDS.analyses.efficiencyScore] || 0,
            // O acesso a campos de seleção é diferente, por isso não usamos FIELD_IDS aqui
            status: analysisData ? 'Analisada' : 'Pendente',
            sdr_name: sdrId ? sdrMap.get(sdrId) : 'N/A',
            call_duration_seconds: rec[FIELD_IDS.callRecordings.duration] || 0,
          };
        });

      // Filtra as chamadas para o SDR logado, se não for admin
      if (user.role !== 'administrator') {
        combinedData = combinedData.filter(call => call.sdr_id === user.id);
      }

      setAllCalls(combinedData);
    } catch (error) {
      console.error('Erro ao buscar chamadas:', error);
    } finally {
      setLoadingData(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCallsData();
  }, [fetchCallsData]);

  const onUploadSuccess = () => {
    setIsModalOpen(false);
    fetchCallsData(); // Recarrega os dados após um novo upload
  };

  const filteredCalls = useMemo(() => {
    return allCalls.filter(call =>
      // Proteção contra valores nulos/undefined
      (call.prospect_name || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allCalls, searchTerm]);

  // Função para formatar a duração
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <>
      <UploadModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onUploadSuccess={onUploadSuccess} />
      <div className="p-8 space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-text-primary">
              {user?.role === 'administrator' ? 'Todas as Chamadas' : 'Minhas Chamadas'}
            </h1>
            <p className="text-text-secondary mt-1">Veja e analise as gravações da sua equipe.</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white font-semibold rounded-lg hover:opacity-90 transition-opacity"
          >
            <UploadCloud className="w-5 h-5" />
            <span>Nova Gravação</span>
          </button>
        </div>

        {/* Barra de Pesquisa */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Pesquisar por nome do prospecto..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-surface border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Tabela de Chamadas */}
        <div className="bg-surface p-6 rounded-2xl shadow-lg border border-gray-100">
          <div className="overflow-x-auto">
            {loadingData ? (
              <div className="text-center py-12">
                <Loader2 className="h-8 w-8 mx-auto animate-spin text-primary" />
                <p className="mt-2 text-text-secondary">A carregar chamadas...</p>
              </div>
            ) : (
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-text-secondary uppercase bg-background">
                  <tr>
                    <th className="px-6 py-3">Prospecto</th>
                    <th className="px-6 py-3">SDR</th>
                    <th className="px-6 py-3">Data</th>
                    <th className="px-6 py-3">Duração</th>
                    <th className="px-6 py-3">Pontuação</th>
                    <th className="px-6 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="text-text-primary">
                  {filteredCalls.map(call => (
                    <tr
                      key={call.call_id}
                      onClick={() => navigate(`/call/${call.call_id}`)}
                      className="hover:bg-background border-b border-gray-100 cursor-pointer"
                    >
                      <td className="px-6 py-4 font-semibold">{call.prospect_name}</td>
                      <td className="px-6 py-4">{call.sdr_name}</td>
                      <td className="px-6 py-4">{new Date(call.call_date).toLocaleDateString()}</td>
                      <td className="px-6 py-4">{formatDuration(call.call_duration_seconds)}</td>
                      <td className="px-6 py-4 font-bold">{call.efficiency_score || '--'}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                          call.status === 'Analisada'
                            ? 'bg-accent/10 text-accent-dark'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {call.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {!loadingData && filteredCalls.length === 0 && (
              <div className="text-center py-12 text-text-secondary">
                <p>Nenhuma chamada encontrada.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}