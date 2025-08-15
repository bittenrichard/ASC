// src/pages/CallDetails.tsx

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Play, Pause, Clock, TrendingUp, MessageCircle, User, Calendar, Save, Loader2 
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { baserowService, BaserowCallRecording, BaserowCallAnalysis, SpinAnalysisData } from '../lib/baserowService';
import { SpinAnalysis } from '../components/Calls/SpinAnalysis';

interface CallDetailsData {
  recording: BaserowCallRecording;
  analysis: BaserowCallAnalysis | null;
  sdrName: string;
}

export function CallDetails() {
  const { callId } = useParams<{ callId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [callDetails, setCallDetails] = useState<CallDetailsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [savingFeedback, setSavingFeedback] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCallDetails = async () => {
      if (!callId) {
        setError("ID da chamada não encontrado.");
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const recordingId = parseInt(callId, 10);
        
        const allRecordings = await baserowService.getCallRecordings();
        const allAnalyses = await baserowService.getCallAnalyses();
        const allSDRs = await baserowService.getAllSDRs();

        const recording = allRecordings.find(r => r.id === recordingId);
        
        if (!recording) {
          setError("Gravação não encontrada.");
          return;
        }

        const analysis = allAnalyses.find(a => 
          a.call_recording && a.call_recording.length > 0 && a.call_recording[0].id === recordingId
        ) || null;
        
        const sdrId = recording.sdr && recording.sdr.length > 0 ? recording.sdr[0].id : null;
        const sdrName = allSDRs.find(sdr => sdr.id === sdrId)?.name || 'N/A';
        
        setCallDetails({ recording, analysis, sdrName });
        setFeedback(analysis?.manager_feedback || '');

      } catch (err) {
        console.error('Erro ao buscar detalhes da chamada:', err);
        setError('Falha ao carregar os dados da chamada.');
      } finally {
        setLoading(false);
      }
    };

    fetchCallDetails();
  }, [callId]);
  
  // Usamos useMemo para parsear o JSON do SPIN analysis apenas quando necessário
  const spinData: SpinAnalysisData | null = useMemo(() => {
    if (callDetails?.analysis?.spin_analysis) {
      try {
        return JSON.parse(callDetails.analysis.spin_analysis);
      } catch (e) {
        console.error("Erro ao parsear JSON da análise SPIN:", e);
        return null;
      }
    }
    return null;
  }, [callDetails?.analysis?.spin_analysis]);

  const saveFeedbackHandler = async () => {
    if (!callDetails?.analysis || user?.role !== 'manager' || savingFeedback) return;

    setSavingFeedback(true);
    try {
      const updatedAnalysis = await baserowService.updateManagerFeedback(callDetails.analysis.id, feedback);
      setCallDetails(prevDetails => prevDetails ? { ...prevDetails, analysis: updatedAnalysis } : null);
    } catch (error) {
      console.error('Erro ao salvar feedback:', error);
    } finally {
      setSavingFeedback(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'Positivo': return 'text-green-600 bg-green-50';
      case 'Negativo': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatTranscript = (transcript: string) => {
    return transcript.split('\n').map((line, index) => {
      const isSDR = line.toLowerCase().startsWith('sdr:');
      const isProspect = line.toLowerCase().startsWith('prospecto:');
      return (
        <div key={index} className={`mb-3 ${isSDR ? 'text-right' : ''}`}>
          <span className={`inline-block px-3 py-1 rounded-lg text-sm ${
            isSDR ? 'bg-blue-100 text-blue-900' : isProspect ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
          }`}>
            {line}
          </span>
        </div>
      );
    });
  };

  if (loading) {
    return (
      <div className="p-6 animate-pulse space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/3"></div>
        <div className="h-24 bg-gray-200 rounded-xl"></div>
        <div className="h-64 bg-gray-200 rounded-xl"></div>
        <div className="h-48 bg-gray-200 rounded-xl"></div>
      </div>
    );
  }

  if (error || !callDetails) {
    return (
      <div className="p-6 text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900">{error || 'Chamada não encontrada'}</h2>
        <button onClick={() => navigate(-1)} className="mt-4 text-blue-600 hover:text-blue-800">&larr; Voltar</button>
      </div>
    );
  }

  const { recording, analysis, sdrName } = callDetails;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><ArrowLeft className="h-5 w-5" /></button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{recording.prospect_name}</h1>
            <p className="text-gray-600">Detalhes e Análise da Chamada</p>
          </div>
        </div>
        {analysis && (
          <div className={`px-4 py-2 rounded-lg border ${getScoreColor(analysis.efficiency_score)}`}>
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span className="text-2xl font-bold">{analysis.efficiency_score}</span><span className="text-sm">/100</span>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="flex items-center space-x-3"><User className="h-5 w-5 text-gray-400" /><div><p className="text-sm text-gray-500">SDR</p><p className="font-medium">{sdrName}</p></div></div>
        <div className="flex items-center space-x-3"><Calendar className="h-5 w-5 text-gray-400" /><div><p className="text-sm text-gray-500">Data</p><p className="font-medium">{new Date(recording.call_date).toLocaleDateString('pt-BR')}</p></div></div>
        <div className="flex items-center space-x-3"><Clock className="h-5 w-5 text-gray-400" /><div><p className="text-sm text-gray-500">Duração</p><p className="font-medium">{formatDuration(recording.call_duration_seconds)}</p></div></div>
        <div className="flex items-center space-x-3"><MessageCircle className="h-5 w-5 text-gray-400" /><div><p className="text-sm text-gray-500">Status</p><span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${recording.status[0]?.value === 'Analisada' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{recording.status[0]?.value || 'N/A'}</span></div></div>
      </div>
      
      <SpinAnalysis analysisData={spinData} />

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4">Gravação de Áudio</h3>
        <div className="flex items-center space-x-4">
          <button onClick={() => setIsPlaying(!isPlaying)} className="flex items-center justify-center w-12 h-12 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors">{isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-1" />}</button>
          <div className="flex-1">
            <div className="w-full bg-gray-200 rounded-full h-2"><div className="bg-blue-600 h-2 rounded-full" style={{ width: '30%' }}></div></div>
            <p className="text-sm text-gray-500 mt-1">Simulação do player. <a href={recording.audio_file_url} target="_blank" rel="noopener noreferrer" className="text-blue-600">Link para o áudio.</a></p>
          </div>
        </div>
      </div>

      {analysis ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"><h3 className="text-sm font-medium text-gray-500 mb-2">Proporção Fala/Escuta</h3><p className="text-2xl font-bold text-gray-900">{analysis.talk_listen_ratio}</p><div className="mt-3 bg-gray-200 rounded-full h-2"><div className="bg-blue-600 h-2 rounded-full" style={{ width: `${analysis.talk_listen_ratio.split('/')[0]}%` }}></div></div></div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"><h3 className="text-sm font-medium text-gray-500 mb-2">Maior Monólogo</h3><p className="text-2xl font-bold text-gray-900">{formatDuration(analysis.longest_monologue_seconds)}</p></div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"><h3 className="text-sm font-medium text-gray-500 mb-2">Sentimento</h3><span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${getSentimentColor(analysis.sentiment[0]?.value)}`}>{analysis.sentiment[0]?.value || 'N/A'}</span></div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-4">Transcrição Completa</h3>
            <div className="max-h-96 overflow-y-auto bg-gray-50 rounded-lg p-4 border">{formatTranscript(analysis.full_transcript)}</div>
          </div>
        </>
      ) : (
        <div className="text-center py-12 bg-white rounded-xl border"><p className="text-gray-600">A análise detalhada desta chamada ainda não está disponível.</p></div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4">Feedback do Gerente</h3>
        {user?.role === 'manager' ? (
          <div className="space-y-4">
            <textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="Adicione seu feedback para esta chamada..." rows={4} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" disabled={!analysis} />
            <button onClick={saveFeedbackHandler} disabled={!analysis || savingFeedback} className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {savingFeedback ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              <span>{savingFeedback ? 'Salvando...' : 'Salvar Feedback'}</span>
            </button>
          </div>
        ) : (
          <div className="bg-gray-50 rounded-lg p-4 border">{analysis?.manager_feedback ? <p className="text-gray-700">{analysis.manager_feedback}</p> : <p className="text-gray-500 italic">Nenhum feedback do gerente fornecido ainda.</p>}</div>
        )}
      </div>
    </div>
  );
}