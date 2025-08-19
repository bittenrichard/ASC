// src/pages/CallDetails.tsx

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, User, Calendar, Save, Loader2, Sparkles, TrendingUp } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { baserowService, BaserowCallRecording, BaserowCallAnalysis, SpinAnalysisData, FIELD_IDS } from '../lib/baserowService';
import { SpinAnalysis } from '../components/CallDetails/SpinAnalysis';
import { PlaybookAnalysis } from '../components/CallDetails/PlaybookAnalysis';
import { CrmSync } from '../components/CallDetails/CrmSync';
import toast from 'react-hot-toast';
import { backendService } from '../lib/api'; // Importação do serviço de backend

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
  const [feedback, setFeedback] = useState('');
  const [savingFeedback, setSavingFeedback] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const [loadingAudio, setLoadingAudio] = useState(true);

  const fetchCallDetails = useCallback(async () => {
    if (!callId) {
      setError("ID da chamada não encontrado.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadingAudio(true);
    try {
      const recordingId = parseInt(callId, 10);
      const [recording, analysis] = await Promise.all([
        baserowService.getCallRecordingById(recordingId),
        baserowService.getAnalysisByRecordingId(recordingId)
      ]);

      if (!recording) {
        setError("Gravação não encontrada.");
        return;
      }
      
      const sdrName = recording[FIELD_IDS.callRecordings.sdr]?.[0]?.value || 'N/A';
      setCallDetails({ recording, analysis, sdrName });
      
      if (analysis) {
        setFeedback(analysis[FIELD_IDS.analyses.managerFeedback] || '');
      }

      const audioFileUrl = recording[FIELD_IDS.callRecordings.audioUrl]?.[0]?.url;
      if (audioFileUrl) {
          const proxiedAudioUrl = await backendService.getAudioFile(audioFileUrl);
          setAudioSrc(proxiedAudioUrl);
      } else {
          setAudioSrc(null);
      }
    } catch (err) {
      setError('Falha ao carregar os dados da chamada ou o áudio.');
      console.error(err);
    } finally {
      setLoading(false);
      setLoadingAudio(false);
    }
  }, [callId]);

  useEffect(() => {
    fetchCallDetails();
  }, [callId, fetchCallDetails]);
  
  const spinData = useMemo(() => {
    const spinField = callDetails?.analysis?.[FIELD_IDS.analyses.spinAnalysis];
    if (spinField) {
      try {
        return typeof spinField === 'string' ? JSON.parse(spinField) : spinField;
      } catch (e) { return null; }
    }
    return null;
  }, [callDetails?.analysis]);

  const playbookData = useMemo(() => {
    const playbookField = callDetails?.analysis?.[FIELD_IDS.analyses.playbookAnalysis];
    if (playbookField) {
      try {
        return typeof playbookField === 'string' ? JSON.parse(playbookField) : playbookField;
      } catch (e) { return null; }
    }
    return null;
  }, [callDetails?.analysis]);

  const saveFeedbackHandler = async () => {
    if (!feedback.trim() || !callDetails?.analysis) return;
    setSavingFeedback(true);
    try {
      await baserowService.updateManagerFeedback(callDetails.analysis.id, feedback);
      toast.success("Feedback guardado com sucesso!");
    } catch (err) {
      toast.error("Falha ao guardar o feedback.");
    } finally {
      setSavingFeedback(false);
    }
  };

  const handleRunAnalysis = async () => {
    if (!callDetails || !callDetails.recording || !user) return;
    
    setIsAnalyzing(true);
    toast.loading('A iniciar análise da chamada...');
    
    try {
      const recordingId = callDetails.recording.id;
      await baserowService.triggerAnalysis(recordingId);
      toast.dismiss();
      toast.success("Análise concluída com sucesso!");
      fetchCallDetails();
    } catch (error: any) {
      toast.dismiss();
      toast.error(error.message || "Ocorreu um erro durante a análise.");
      console.error(error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const formatDuration = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return '00:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-accent-dark';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  if (loading) return <div className="p-8 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto" /></div>;
  if (error || !callDetails) return <div className="p-6 text-center py-12"><h2 className="text-xl font-semibold">{error || "Não foi possível carregar os detalhes da chamada."}</h2></div>;

  const { recording, analysis, sdrName } = callDetails;
  
  const efficiencyScore = analysis?.[FIELD_IDS.analyses.efficiencyScore] ?? 0;
  const prospectName = recording[FIELD_IDS.callRecordings.prospectName] ?? 'N/A';
  const callDate = recording[FIELD_IDS.callRecordings.callDate] ?? '';
  const duration = recording[FIELD_IDS.callRecordings.duration] ?? 0;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <header>
        <button onClick={() => navigate('/calls')} className="flex items-center gap-2 text-sm font-semibold text-text-secondary hover:text-text-primary mb-4">
          <ArrowLeft className="w-4 h-4" />
          Voltar para Chamadas
        </button>
        <h1 className="text-3xl font-bold text-text-primary">
          Chamada com {prospectName}
        </h1>
      </header>
      
      {/* Leitor de Áudio */}
      <div className="bg-surface p-4 rounded-xl border">
        {loadingAudio ? (
          <p className="text-text-secondary text-sm">A carregar áudio...</p>
        ) : audioSrc ? (
          <audio controls className="w-full" src={audioSrc}>
            O seu navegador não suporta o elemento de áudio.
          </audio>
        ) : (
          <p className="text-text-secondary text-sm">Nenhum áudio encontrado para esta chamada.</p>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-surface p-4 rounded-xl border"><User className="w-5 h-5 text-primary mb-2" /><p className="text-sm text-text-secondary">SDR</p><p className="font-bold">{sdrName}</p></div>
        <div className="bg-surface p-4 rounded-xl border"><Calendar className="w-5 h-5 text-primary mb-2" /><p className="text-sm text-text-secondary">Data</p><p className="font-bold">{new Date(callDate).toLocaleDateString()}</p></div>
        <div className="bg-surface p-4 rounded-xl border"><Clock className="w-5 h-5 text-primary mb-2" /><p className="text-sm text-text-secondary">Duração</p><p className="font-bold">{formatDuration(duration)}</p></div>
        <div className="bg-surface p-4 rounded-xl border"><TrendingUp className="w-5 h-5 text-primary mb-2" /><p className="text-sm text-text-secondary">Eficiência</p><p className={`font-bold text-lg ${getScoreColor(efficiencyScore)}`}>{efficiencyScore} / 100</p></div>
      </div>

      {!analysis && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 text-center">
            <p className="font-bold text-yellow-800">Esta chamada ainda não foi analisada.</p>
            <button 
                onClick={handleRunAnalysis}
                disabled={isAnalyzing}
                className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white font-semibold rounded-lg hover:bg-yellow-600 disabled:opacity-50">
                {isAnalyzing ? <Loader2 className="w-5 h-5 animate-spin"/> : <Sparkles className="w-5 h-5" />}
                {isAnalyzing ? 'A analisar...' : 'Executar Análise Agora'}
            </button>
        </div>
      )}

      {analysis && <SpinAnalysis spinAnalysis={spinData} />}
      {analysis && <PlaybookAnalysis analysisData={playbookData} />}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-surface p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-text-primary mb-2">Feedback do Gestor</h3>
            <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Adicione o seu feedback aqui..."
                className="w-full p-3 bg-background border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                rows={5}
                disabled={!analysis}
            />
            <button 
                onClick={saveFeedbackHandler}
                disabled={savingFeedback || !analysis}
                className="mt-4 flex items-center gap-2 px-4 py-2 bg-primary text-white font-semibold rounded-lg hover:opacity-90 disabled:opacity-50">
                {savingFeedback ? <Loader2 className="w-5 h-5 animate-spin"/> : <Save className="w-5 h-5"/>}
                Guardar Feedback
            </button>
        </div>
        <div className="lg:col-span-1">
            <CrmSync callId={parseInt(callId || '0')} />
        </div>
      </div>
    </div>
  );
}