// src/pages/CallDetails.tsx

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Play, Pause, Clock, TrendingUp, MessageCircle, User, Calendar, Save, Loader2 
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { baserowService, BaserowCallRecording, BaserowCallAnalysis } from '../lib/baserowService';
import { SpinAnalysis } from '../components/CallDetails/SpinAnalysis';

interface CallDetailsData {
  recording: BaserowCallRecording;
  analysis: BaserowCallAnalysis | null;
  sdrName: string;
}

// A interface para os dados do SPIN deve ser exportada do baserowService ou definida aqui
interface SpinAnalysisData {
  situation: { score: number; feedback: string; excerpts: string[] };
  problem: { score: number; feedback: string; excerpts: string[] };
  implication: { score: number; feedback: string; excerpts: string[] };
  need_payoff: { score: number; feedback: string; excerpts: string[] };
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
        
        const recording = await baserowService.getCallRecordingById(recordingId);
        if (!recording) {
          setError("Gravação não encontrada.");
          return;
        }

        const analysis = await baserowService.getAnalysisByRecordingId(recordingId);
        
        const sdrId = recording.SDR && recording.SDR.length > 0 ? recording.SDR[0].id : null;
        let sdrName = 'N/A';
        if (sdrId) {
          const sdr = await baserowService.getSDRById(sdrId);
          sdrName = sdr?.Name || 'N/A';
        }
        
        setCallDetails({ recording, analysis, sdrName });
        if (analysis) {
          setFeedback(analysis.manager_feedback || '');
        }

      } catch (err) {
        console.error('Erro ao buscar detalhes da chamada:', err);
        setError('Falha ao carregar os dados da chamada.');
      } finally {
        setLoading(false);
      }
    };

    fetchCallDetails();
  }, [callId]);
  
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
    if (!callDetails?.analysis || user?.role !== 'administrator' || savingFeedback) return;

    setSavingFeedback(true);
    try {
      const updatedAnalysis = await baserowService.updateManagerFeedback(callDetails.analysis.id, feedback);
      setCallDetails(prevDetails => prevDetails ? { ...prevDetails, analysis: updatedAnalysis } : null);
      toast.success("Feedback salvo com sucesso!");
    } catch (error) {
      console.error('Erro ao salvar feedback:', error);
      toast.error("Não foi possível salvar o feedback.");
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
    if (!transcript) return <p className="text-gray-500 italic">Transcrição não disponível.</p>;
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
        <div className="p-8 text-center text-text-secondary">
            <Loader2 className="h-8 w-8 animate-spin mx-auto" />
            <p className="mt-4">A carregar detalhes da chamada...</p>
        </div>
    );
  }

  if (error || !callDetails) {
    return (
      <div className="p-6 text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900">{error || 'Chamada não encontrada'}</h2>
        <button onClick={() => navigate(-1)} className="mt-4 text-blue-600 hover:text-blue-800 flex items-center gap-2 mx-auto">
            <ArrowLeft className="h-4 w-4" /> Voltar
        </button>
      </div>
    );
  }

  const { recording, analysis, sdrName } = callDetails;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex items-center space-x-4">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-background rounded-full transition-colors"><ArrowLeft className="h-5 w-5 text-text-secondary" /></button>
        <div>
          <h1 className="text-3xl font-bold text-text-primary">{recording.Prospect_Name}</h1>
          <p className="text-text-secondary mt-1">Detalhes e Análise da Chamada</p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-surface p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4"><User className="h-6 w-6 text-primary" /><div><p className="text-sm text-text-secondary">SDR</p><p className="font-bold text-text-primary">{sdrName}</p></div></div>
        <div className="bg-surface p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4"><Calendar className="h-6 w-6 text-primary" /><div><p className="text-sm text-text-secondary">Data</p><p className="font-bold text-text-primary">{new Date(recording.Call_Date).toLocaleDateString('pt-BR')}</p></div></div>
        <div className="bg-surface p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4"><Clock className="h-6 w-6 text-primary" /><div><p className="text-sm text-text-secondary">Duração</p><p className="font-bold text-text-primary">{formatDuration(recording.Call_Duration_Seconds)}</p></div></div>
        <div className="bg-surface p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4"><MessageCircle className="h-6 w-6 text-primary" /><div><p className="text-sm text-text-secondary">Status</p><span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${recording.Status?.value === 'Analisada' ? 'bg-accent/10 text-accent-dark' : 'bg-yellow-50 text-yellow-600'}`}>{recording.Status?.value || 'N/A'}</span></div></div>
      </div>
      
      {analysis && <SpinAnalysis analysisData={spinData} />}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
            <div className="bg-surface p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-text-primary mb-4">Gravação de Áudio</h3>
                <audio controls className="w-full" src={recording.Audio_File?.[0]?.url}>
                    Seu navegador não suporta o elemento de áudio.
                </audio>
            </div>
            {analysis && (
                <div className="bg-surface p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-text-primary mb-4">Transcrição Completa</h3>
                    <div className="max-h-96 overflow-y-auto bg-background rounded-lg p-4 border">{formatTranscript(analysis.full_transcript)}</div>
                </div>
            )}
        </div>
        <div className="lg:col-span-1 space-y-8">
            {analysis && (
                <div className="bg-surface p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
                    <div><h3 className="text-lg font-bold text-text-primary">Métricas da Análise</h3></div>
                    <div className={`p-4 rounded-xl border-2 text-center ${getScoreColor(analysis.Efficiency_Score)}`}><p className="text-sm font-semibold opacity-80">Pontuação de Eficiência</p><p className="text-4xl font-bold">{analysis.Efficiency_Score}<span className="text-lg">/100</span></p></div>
                    <div className="text-center"><p className="text-sm text-text-secondary">Proporção Fala/Escuta</p><p className="text-2xl font-bold text-text-primary">{analysis.talk_listen_ratio}</p></div>
                    <div className="text-center"><p className="text-sm text-text-secondary">Maior Monólogo</p><p className="text-2xl font-bold text-text-primary">{formatDuration(analysis.longest_monologue_seconds)}</p></div>
                    <div className="text-center"><p className="text-sm text-text-secondary">Sentimento Geral</p><span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${getSentimentColor(analysis.Sentiment?.value)}`}>{analysis.Sentiment?.value || 'N/A'}</span></div>
                </div>
            )}
             <div className="bg-surface p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-text-primary mb-4">Feedback do Gestor</h3>
                {user?.role === 'administrator' ? (
                <div className="space-y-4">
                    <textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="Adicione seu feedback para esta chamada..." rows={5} className="w-full bg-background border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary" disabled={!analysis} />
                    <button onClick={saveFeedbackHandler} disabled={!analysis || savingFeedback} className="w-full flex items-center justify-center space-x-2 bg-primary text-white px-4 py-2 rounded-lg hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    {savingFeedback ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                    <span>{savingFeedback ? 'A salvar...' : 'Salvar Feedback'}</span>
                    </button>
                </div>
                ) : (
                <div className="bg-background rounded-lg p-4 border">{analysis?.manager_feedback ? <p className="text-text-primary">{analysis.manager_feedback}</p> : <p className="text-text-secondary italic">Nenhum feedback do gestor fornecido ainda.</p>}</div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
}