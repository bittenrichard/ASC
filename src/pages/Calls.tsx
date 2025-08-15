// src/pages/Calls.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
// CORREÇÃO APLICADA AQUI: O caminho do import foi ajustado de '../../' para '../'
import { baserowService, BaserowCallAnalysis } from '../lib/baserowService';
import { CallsTable } from '../components/Dashboard/CallsTable';
import { UploadModal } from '../components/Calls/UploadModal';
import { RecordingModal } from '../components/Calls/RecordingModal';
import { Calendar, Filter, Search, Upload, Mic } from 'lucide-react';

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
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSDR, setSelectedSDR] = useState('');
  const [dateRange, setDateRange] = useState('');
  const [scoreFilter, setScoreFilter] = useState('');
  
  const [allCalls, setAllCalls] = useState<CombinedCallData[]>([]);
  const [loading, setLoading] = useState(true);
  const [sdrs, setSDRs] = useState<{ id: number; name: string }[]>([]);
  
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isRecordingModalOpen, setIsRecordingModalOpen] = useState(false);

  const fetchCallsData = useCallback(async () => {
    if (!user) return;

    if (allCalls.length === 0) {
        setLoading(true);
    }

    try {
      const recordings = await baserowService.getCallRecordings();
      const analyses = await baserowService.getCallAnalyses();
      const allSDRs = await baserowService.getAllSDRs();
      setSDRs(allSDRs);

      const analysesMap = new Map<number, BaserowCallAnalysis>();
      analyses.forEach(a => {
        if (a.call_recording && a.call_recording.length > 0) {
          analysesMap.set(a.call_recording[0].id, a);
        }
      });

      const sdrNamesMap = new Map(allSDRs.map(sdr => [sdr.id, sdr.name]));

      let combinedData: CombinedCallData[] = recordings
        .sort((a, b) => new Date(b.call_date).getTime() - new Date(a.call_date).getTime())
        .map(rec => {
          const analysis = analysesMap.get(rec.id);
          const sdrId = rec.sdr && rec.sdr.length > 0 ? rec.sdr[0].id : null;
          const sdrName = sdrId ? sdrNamesMap.get(sdrId) : 'N/A';

          return {
            call_id: rec.id.toString(),
            sdr_id: sdrId,
            prospect_name: rec.prospect_name,
            call_date: rec.call_date,
            efficiency_score: analysis ? analysis.efficiency_score : 0,
            status: rec.status[0]?.value || 'N/A',
            sdr_name: sdrName,
            call_duration_seconds: rec.call_duration_seconds,
          };
        });

      if (user.role !== 'manager') {
        combinedData = combinedData.filter(call => call.sdr_id === user.id);
      }

      setAllCalls(combinedData);
    } catch (error) {
      console.error('Erro ao buscar chamadas:', error);
    } finally {
      setLoading(false);
    }
  }, [user, allCalls.length]);

  useEffect(() => {
    fetchCallsData();
  }, [fetchCallsData]);

  const filteredCalls = allCalls.filter(call => {
    const matchesSearch = call.prospect_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSDR = !selectedSDR || call.sdr_id === parseInt(selectedSDR, 10);
    const matchesScore = !scoreFilter ||
      (scoreFilter === 'high' && call.efficiency_score >= 80) ||
      (scoreFilter === 'medium' && call.efficiency_score >= 50 && call.efficiency_score < 80) ||
      (scoreFilter === 'low' && call.efficiency_score < 50);
    
    return matchesSearch && matchesSDR && matchesScore;
  });

  if (loading) {
    return (
      <div className="p-6 space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4"></div>
        <div className="h-10 bg-gray-200 rounded w-1/3"></div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-10 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
        <div className="h-96 bg-gray-200 rounded-lg"></div>
      </div>
    );
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
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <h1 className="text-3xl font-bold text-gray-900">Chamadas</h1>
          <div className="flex items-center space-x-2">
            <button 
                onClick={() => setIsRecordingModalOpen(true)}
                className="flex items-center space-x-2 bg-white text-gray-700 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
                <Mic className="w-4 h-4" />
                <span>Gravar Chamada</span>
            </button>
            <button 
                onClick={() => setIsUploadModalOpen(true)}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
                <Upload className="w-4 h-4" />
                <span>Enviar Gravação</span>
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar por prospect..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {user?.role === 'manager' && (
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <select
                  value={selectedSDR}
                  onChange={(e) => setSelectedSDR(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                >
                  <option value="">Todos os SDRs</option>
                  {sdrs.map(sdr => (
                    <option key={sdr.id} value={sdr.id}>{sdr.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                value={scoreFilter}
                onChange={(e) => setScoreFilter(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
              >
                <option value="">Todos os Scores</option>
                <option value="high">Alto (80-100)</option>
                <option value="medium">Médio (50-79)</option>
                <option value="low">Baixo (0-49)</option>
              </select>
            </div>

            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
              >
                <option value="">Todas as Datas</option>
                <option value="today">Hoje</option>
                <option value="week">Esta Semana</option>
                <option value="month">Este Mês</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tabela de Chamadas */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <CallsTable calls={filteredCalls} showSDRColumn={user?.role === 'manager'} />
        </div>
      </div>
    </>
  );
};

export default Calls;