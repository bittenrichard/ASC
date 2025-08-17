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

interface CallDetailsData {
  recording: BaserowCallRecording;
  analysis: BaserowCallAnalysis | null;
  sdrName: string;
}
interface PlaybookAnalysisData {
  adherence_score: number;
  feedback: { rule: string; followed: boolean; details: string; }[];
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

  const fetchCallDetails = useCallback(async () => {
    if (!callId) {
      setError("ID da chamada não encontrado.");
      setLoading(false);
      return;
    }
    setLoading(true);
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
      const sdrName = recording.sdr?.[0]?.value || 'N/A';
      setCallDetails({ recording, analysis, sdrName });
      if (analysis) setFeedback(analysis.manager_feedback || '');
    } catch (err) {
      setError('Falha ao carregar os dados da chamada.');
    } finally {
      setLoading(false);
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

  const saveFeedbackHandler = async () => { /* ... (sem alterações) ... */ };
  const formatDuration = (seconds: number) => { /* ... (sem alterações) ... */ };
  const getScoreColor = (score: number) => { /* ... (sem alterações) ... */ };

  const handleRunAnalysis = async () => {
    if (!callDetails || !callDetails.analysis || !user) return;
    setIsAnalyzing(true);
    toast.loading('A iniciar análise da chamada...');
    
    try {
      const transcript = callDetails.analysis.full_transcript;
      if (!transcript) {
        toast.dismiss();
        toast.error("Não há transcrição para analisar.");
        return;
      }

      // Buscar as regras do playbook da organização
      const playbooks = await baserowService.getPlaybooksByOrg(user.organizationId);
      const allRules = playbooks.flatMap(p => p.rules);

      // Chamar a função serverless (agora um serviço de IA puro)
      const analysisResponse = await fetch(import.meta.env.VITE_SUPABASE_FUNCTION_ANALYZE_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transcript, playbookRules: allRules }),
      });

      if (!analysisResponse.ok) throw new Error("A API de análise falhou.");

      const analysisResult = await analysisResponse.json();

      // Salvar os resultados de volta no Baserow
      await baserowService.updateAnalysisData(callDetails.analysis.id, {
          spinAnalysis: analysisResult.spinAnalysis,
          playbookAnalysis: analysisResult.playbookAnalysis,
      });

      toast.dismiss();
      toast.success("Análise concluída com sucesso!");
      fetchCallDetails(); // Recarrega os dados para exibir a análise
    } catch (error) {
      toast.dismiss();
      toast.error("Ocorreu um erro durante a análise.");
      console.error(error);
    } finally {
      setIsAnalyzing(false);
    }
  };


  if (loading) return <div className="p-8 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto" /></div>;
  if (error || !callDetails) return <div className="p-6 text-center py-12"><h2 className="text-xl font-semibold">{error}</h2></div>;

  const { recording, analysis, sdrName } = callDetails;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* ... (cabeçalho e cards de métricas) ... */}
      
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

      {analysis && <SpinAnalysis analysisData={spinData} />}
      {analysis && <PlaybookAnalysis analysisData={playbookData} />}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ... (restante da página, incluindo o CrmSync) */}
      </div>
    </div>
  );
}