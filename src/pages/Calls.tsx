// src/pages/Calls.tsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { baserowService, FIELD_IDS } from '../lib/baserowService';
import { Upload, Mic, Loader2, Search, Calendar, Clock, TrendingUp, Edit, Trash2 } from 'lucide-react';
import { UploadModal } from '../components/Calls/UploadModal';
import { ManualRecordingModal } from '../components/Calls/ManualRecordingModal';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

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

export function Calls() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isManualRecordingModalOpen, setIsManualRecordingModalOpen] = useState(false);
  const [allCalls, setAllCalls] = useState<CombinedCallData[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchCallsData = useCallback(async () => {
    if (!user || !user.organizationId) {
      setLoadingData(false);
      return;
    }
    setLoadingData(true);
    try {
        const [recordings, analyses, allSDRs] = await Promise.all([
            baserowService.getCallRecordings(user.organizationId),
            baserowService.getCallAnalyses(user.organizationId),
            baserowService.getAllSDRs(user.organizationId)
        ]);
        const analysesMap = new Map(analyses.map(a => [a[FIELD_IDS.analyses.callRecording]?.[0]?.id, a]));
        const sdrMap = new Map(allSDRs.map(sdr => [sdr.id, sdr.name]));
        
        let combinedData: CombinedCallData[] = recordings
            .sort((a, b) => new Date(b[FIELD_IDS.callRecordings.callDate]).getTime() - new Date(a[FIELD_IDS.callRecordings.callDate]).getTime())
            .map(rec => {
                const sdrId = rec[FIELD_IDS.callRecordings.sdr]?.[0]?.id || null;
                const analysisData = analysesMap.get(rec.id);
                return {
                    call_id: rec.id.toString(),
                    prospect_name: rec[FIELD_IDS.callRecordings.prospectName] || 'N/A',
                    call_date: rec[FIELD_IDS.callRecordings.callDate] || new Date().toISOString(),
                    sdr_id: sdrId,
                    efficiency_score: analysisData?.[FIELD_IDS.analyses.efficiencyScore] || 0,
                    status: analysisData ? 'Analisada' : 'Pendente',
                    sdr_name: sdrId ? sdrMap.get(sdrId) || 'N/A' : 'N/A',
                    call_duration_seconds: rec[FIELD_IDS.callRecordings.duration] || 0,
                };
            });
        
        if (user.role !== 'administrator') {
            combinedData = combinedData.filter(call => call.sdr_id === user.id);
        }
        setAllCalls(combinedData);
    } catch (error) {
        console.error('Erro ao buscar chamadas:', error);
        toast.error('Falha ao carregar as chamadas.');
    } finally {
        setLoadingData(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCallsData();
  }, [fetchCallsData]);

  const handleNewCallRecording = async (audioBlob: Blob, prospectName: string, callDate: string, sdrId: number, callDurationSeconds: number) => {
    if (!user) return;
    setIsProcessing(true);
    try {
        toast.loading('Processando gravação...', { id: 'processing-call' });
        const audioFile = new File([audioBlob], `call-${Date.now()}.webm`, { type: audioBlob.type });
        const savedFile = await baserowService.uploadFile(audioFile);
        if (!savedFile) throw new Error('Falha ao salvar o arquivo de áudio.');
        const newRecording = await baserowService.createCallRecording({
            prospectName: prospectName, sdrId: sdrId, organizationId: user.organizationId,
            duration: callDurationSeconds, fileData: [{ name: savedFile.name }],
        });
        if (!newRecording) throw new Error('Falha ao criar a gravação no Baserow.');
        await baserowService.triggerAnalysis(newRecording.id);
        toast.success('Chamada processada com sucesso!', { id: 'processing-call' });
        fetchCallsData();
    } catch (error: any) {
        console.error('Erro ao processar nova chamada:', error);
        toast.error(`Erro: ${error.message || 'Falha ao processar a chamada.'}`, { id: 'processing-call' });
    } finally {
        setIsProcessing(false);
    }
  };

  const handleEditCall = async (call: CombinedCallData) => {
    const newName = prompt("Digite o novo nome do prospecto:", call.prospect_name);
    if (newName && newName.trim() !== '' && newName !== call.prospect_name) {
      await toast.promise(
        baserowService.updateCallRecording(parseInt(call.call_id), { [FIELD_IDS.callRecordings.prospectName]: newName }),
        { loading: 'A atualizar...', success: 'Nome do prospecto atualizado!', error: 'Não foi possível atualizar o nome.' }
      );
      fetchCallsData();
    }
  };

  const handleDeleteCall = async (callId: string, prospectName: string) => {
    if (window.confirm(`Tem a certeza que deseja excluir a chamada com ${prospectName}? Esta ação não pode ser desfeita.`)) {
      await toast.promise(
        baserowService.deleteCallRecording(parseInt(callId)),
        { loading: 'A excluir...', success: 'Chamada excluída com sucesso!', error: 'Não foi possível excluir a chamada.' }
      );
      fetchCallsData();
    }
  };

  const filteredCalls = useMemo(() => {
    return allCalls.filter(call => (call.prospect_name || '').toLowerCase().includes(searchTerm.toLowerCase()));
  }, [allCalls, searchTerm]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-accent bg-accent/10';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Analisada': return 'text-accent bg-accent/10';
      case 'Pendente': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-text-secondary bg-gray-100';
    }
  };

  const formatDuration = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (!user) return <div className="p-8 text-center text-text-secondary">Faça login para ver as chamadas.</div>;
  
  return (
    <>
      <UploadModal 
          isOpen={isUploadModalOpen} 
          onClose={() => setIsUploadModalOpen(false)} 
          onUploadComplete={() => { setIsUploadModalOpen(false); fetchCallsData(); }} 
      />
      <ManualRecordingModal
          isOpen={isManualRecordingModalOpen}
          onClose={() => setIsManualRecordingModalOpen(false)}
          onRecordingSaved={handleNewCallRecording}
          sdrId={user.id}
      />
      <div className="p-8 space-y-8">
        <div className="flex justify-between items-start flex-wrap gap-4">
            <div>
                <h1 className="text-3xl font-bold text-text-primary">Chamadas de Vendas</h1>
                <p className="text-text-secondary mt-1">Gerencie, ouça e analise suas chamadas.</p>
            </div>
            <div className="flex gap-4">
                <button
                    onClick={() => setIsManualRecordingModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white font-semibold rounded-lg shadow-md hover:bg-primary/80 transition-colors"
                    disabled={isProcessing}
                >
                    <Mic size={20} />
                    Gravar Manualmente
                </button>
                <button
                    onClick={() => setIsUploadModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-surface text-text-primary font-semibold border border-gray-200 rounded-lg shadow-md hover:bg-background transition-colors"
                    disabled={isProcessing}
                >
                    <Upload size={20} />
                    Fazer Upload
                </button>
            </div>
        </div>

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

        <div className="bg-surface p-6 rounded-2xl shadow-lg border border-gray-100">
            <h3 className="text-lg font-bold text-text-primary mb-4">Histórico de Chamadas</h3>
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
                                {user.role === 'administrator' && <th className="px-6 py-3">SDR</th>}
                                <th className="px-6 py-3">Data</th>
                                <th className="px-6 py-3">Duração</th>
                                <th className="px-6 py-3">Pontuação</th>
                                <th className="px-6 py-3">Status</th>
                                <th className="px-6 py-3">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="text-text-primary">
                            {filteredCalls.map(call => (
                                <tr
                                    key={call.call_id}
                                    className="hover:bg-background border-b border-gray-100 cursor-pointer"
                                    onClick={() => navigate(`/call/${call.call_id}`)}
                                >
                                    <td className="px-6 py-4 font-semibold">{call.prospect_name}</td>
                                    {user.role === 'administrator' && <td className="px-6 py-4">{call.sdr_name}</td>}
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-text-secondary">
                                            <Calendar className="h-4 w-4" />
                                            {new Date(call.call_date).toLocaleDateString('pt-BR')}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-text-secondary">
                                            <Clock className="h-4 w-4" />
                                            {formatDuration(call.call_duration_seconds)}
                                        </div>
                                    </td>
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
                                    <td className="px-6 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => handleEditCall(call)} className="p-2 text-text-secondary hover:text-primary transition-colors">
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => handleDeleteCall(call.call_id, call.prospect_name)} className="p-2 text-text-secondary hover:text-red-500 transition-colors">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
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