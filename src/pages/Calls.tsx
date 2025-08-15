import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { mockDataService } from '../lib/mockData';
import { CallsTable } from '../components/Dashboard/CallsTable';
import { Calendar, Filter, Search, Upload, Mic } from 'lucide-react';
import { UploadModal } from '../components/Calls/UploadModal';
import { RecordingModal } from '../components/Calls/RecordingModal';
import toast, { Toaster } from 'react-hot-toast';

const Calls: React.FC = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSDR, setSelectedSDR] = useState('');
  const [dateRange, setDateRange] = useState('');
  const [scoreFilter, setScoreFilter] = useState('');
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sdrs, setSDRs] = useState([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showRecordingModal, setShowRecordingModal] = useState(false);

  useEffect(() => {
    fetchCalls();
  }, [user]);

  const fetchCalls = async () => {
    if (!user) return;

    setLoading(true);
    try {
      let callsData;
      if (user.role === 'manager') {
        callsData = mockDataService.getAllCalls();
        setSDRs(mockDataService.getAllSDRs());
      } else {
        callsData = mockDataService.getCallsBySDR(user.id);
      }
      setCalls(callsData);
    } catch (error) {
      console.error('Erro ao buscar chamadas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadSuccess = () => {
    fetchCalls();
  };

  const handleRecordingSuccess = () => {
    fetchCalls();
  };

  // Aplicar filtros
  const filteredCalls = calls.filter(call => {
    const matchesSearch = call.prospect_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSDR = !selectedSDR || call.sdr_id === selectedSDR;
    const matchesScore = !scoreFilter || 
      (scoreFilter === 'high' && call.efficiency_score >= 80) ||
      (scoreFilter === 'medium' && call.efficiency_score >= 50 && call.efficiency_score < 80) ||
      (scoreFilter === 'low' && call.efficiency_score < 50);
    
    return matchesSearch && matchesSDR && matchesScore;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-10 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Chamadas</h1>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowRecordingModal(true)}
            className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Mic className="h-4 w-4" />
            <span>Gravar Chamada</span>
          </button>
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Upload className="h-4 w-4" />
            <span>Enviar Gravação</span>
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Busca */}
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

          {/* Filtro por SDR (apenas para gerentes) */}
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

          {/* Filtro por Score */}
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

          {/* Filtro por Data */}
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

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total de Chamadas</p>
              <p className="text-2xl font-bold text-gray-900">{filteredCalls.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Filter className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Score Médio</p>
              <p className="text-2xl font-bold text-gray-900">
                {filteredCalls.length > 0 
                  ? Math.round(filteredCalls.reduce((sum, call) => sum + call.efficiency_score, 0) / filteredCalls.length)
                  : 0
                }
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Search className="w-6 h-6 text-amber-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Analisadas</p>
              <p className="text-2xl font-bold text-gray-900">
                {filteredCalls.filter(call => call.status === 'Analisada').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabela de Chamadas */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <CallsTable calls={filteredCalls} showSDRColumn={user?.role === 'manager'} />
      </div>

      {/* Modals */}
      <UploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onUploadSuccess={handleUploadSuccess}
      />
      <RecordingModal
        isOpen={showRecordingModal}
        onClose={() => setShowRecordingModal(false)}
        onRecordingSuccess={handleRecordingSuccess}
      />

      {/* Toast Container */}
      <Toaster position="top-right" />
    </div>
  );
};

export default Calls;