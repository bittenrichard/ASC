// src/pages/Calls.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { baserowService } from '../lib/baserowService';
import { CallsTable } from '../components/Dashboard/CallsTable';
import { UploadModal } from '../components/Calls/UploadModal';
import { RecordingModal } from '../components/Calls/RecordingModal';
import { Calendar, Filter, Search, Upload, Mic } from 'lucide-react';
import type { BaserowCallRecording, BaserowUser, BaserowCallAnalysis } from '../lib/baserowService';

interface CombinedCallData {
  call_id: string;
  sdr_id: number | null;
  prospect_name: string;
  call_date: string;
  efficiency_score: number;
  status: string;
  sdr_name?: string;
  call_duration_seconds: number;
}

const Calls: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [allCalls, setAllCalls] = useState<CombinedCallData[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isRecordingModalOpen, setIsRecordingModalOpen] = useState(false);

  const fetchCallsData = useCallback(async () => {
    // Guarda de segurança: só executa se o utilizador estiver carregado e tiver um organizationId
    if (!user || !user.organizationId) {
      setLoadingData(false);
      return;
    }

    setLoadingData(true);
    try {
      const recordings = await baserowService.getCallRecordings(user.organizationId);
      const analyses = await baserowService.getCallAnalyses(user.organizationId);
      const allSDRs = await baserowService.getAllSDRs(user.organizationId);

      const analysesMap = new Map(analyses.map(a => [a.Call_Recording[0]?.id, a]));
      const sdrMap = new Map(allSDRs.map(sdr => [sdr.id, sdr.Name]));

      let combinedData: CombinedCallData[] = recordings
        .sort((a, b) => new Date(b.Call_Date).getTime() - new Date(a.Call_Date).getTime())
        .map(rec => {
          const sdrId = rec.SDR && rec.SDR.length > 0 ? rec.SDR[0].id : null;
          return {
            call_id: rec.id.toString(),
            sdr_id: sdrId,
            prospect_name: rec.Prospect_Name,
            call_date: rec.Call_Date,
            efficiency_score: analysesMap.get(rec.id)?.Efficiency_Score || 0,
            status: rec.Status?.value || 'N/A',
            sdr_name: sdrId ? sdrMap.get(sdrId) : 'N/A',
            call_duration_seconds: rec.Call_Duration_Seconds || 0,
          };
        });

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
  
  const filteredCalls = allCalls.filter(call => 
    call.prospect_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (authLoading || loadingData) {
    return <div className="p-8 text-center">A carregar chamadas...</div>;
  }

  return (
    <>
      <UploadModal 
        isOpen={isUploadModalOpen} 
        onClose={() => setIsUploadModalOpen(false)}
        onUploadComplete={fetchCallsData}
      />
      <RecordingModal
        isOpen={isRecordingModalOpen}
        onClose={() => setIsRecordingModalOpen(false)}
        onUploadComplete={fetchCallsData}
      />
      <div className="p-8 space-y-8">
        <div className="flex justify-between items-center flex-wrap gap-4">
            <h1 className="text-3xl font-bold text-text-primary">Histórico de Chamadas</h1>
            <div className="flex items-center space-x-4">
                <button 
                    onClick={() => setIsRecordingModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-surface text-text-primary font-semibold border border-gray-200 rounded-lg hover:bg-background"
                >
                    <Mic className="w-5 h-5" />
                    <span>Gravar Chamada</span>
                </button>
                <button 
                    onClick={() => setIsUploadModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white font-semibold rounded-lg hover:opacity-90"
                >
                    <Upload className="w-5 h-5" />
                    <span>Enviar Gravação</span>
                </button>
            </div>
        </div>

        {/* Os filtros podem ser adicionados aqui no futuro */}
        
        <CallsTable calls={filteredCalls} showSDRColumn={user?.role === 'administrator'} title="Todas as Chamadas" />
      </div>
    </>
  );
};

export default Calls;