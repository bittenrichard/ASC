import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { baserowService, BaserowCallRecording, BaserowCallAnalysis, SpinAnalysisData, FIELD_IDS } from '../lib/baserowService';
import { analyzeCall } from '../lib/api';
import toast from 'react-hot-toast';
import { Loader2, ArrowLeft, PlayCircle, BrainCircuit, User, Calendar, Clock, TrendingUp, BookOpen, MessageSquare, AlertTriangle } from 'lucide-react';
import { SpinAnalysis } from '../components/CallDetails/SpinAnalysis';
import { PlaybookAnalysis } from '../components/CallDetails/PlaybookAnalysis';

export function CallDetails() {
  const { callId } = useParams<{ callId: string }>();
  const navigate = useNavigate();
  const [call, setCall] = useState<BaserowCallRecording | null>(null);
  const [analysis, setAnalysis] = useState<BaserowCallAnalysis | null>(null);
  const [spinData, setSpinData] = useState<SpinAnalysisData | null>(null);
  const [playbookData, setPlaybookData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchDetails = async () => {
      if (!callId) return;
      setLoading(true);
      try {
        const callData = await baserowService.getCallRecordingById(parseInt(callId));
        setCall(callData);

        const analysisData = await baserowService.getAnalysisByRecordingId(parseInt(callId));
        setAnalysis(analysisData);

        if (analysisData) {
          const parseJsonField = (field: any) => {
            if (!field) return null;
            try {
              return typeof field === 'string' ? JSON.parse(field) : field;
            } catch (e) {
              console.error("Erro ao parsear JSON do campo:", e);
              return null;
            }
          };
          setSpinData(parseJsonField(analysisData[FIELD_IDS.analyses.spinAnalysis]));
          setPlaybookData(parseJsonField(analysisData[FIELD_IDS.analyses.playbookAnalysis]));
        }
        
        const baserowAudioUrl = callData[FIELD_IDS.callRecordings.audioUrl]?.[0]?.url;
        if (baserowAudioUrl) {
            const audioBlob = await baserowService.getAudioFile(baserowAudioUrl);
            setAudioUrl(URL.createObjectURL(audioBlob));
        }

      } catch (error) {
        toast.error("Falha ao carregar detalhes da chamada.");
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
    
    return () => {
        if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [callId]);

  const handleTriggerAnalysis = async () => {
    if (!callId) return;
    setIsAnalyzing(true);
    const analysisToast = toast.loading("Análise iniciada... Isso pode levar alguns minutos.");
    try {
      await analyzeCall(callId);
      toast.success("Análise concluída! A página será atualizada.", { id: analysisToast });
      setTimeout(() => window.location.reload(), 2000);
    } catch (error) {
      toast.error("Ocorreu um erro na análise.", { id: analysisToast });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const sdrName = useMemo(() => call?.[FIELD_IDS.callRecordings.sdr]?.[0]?.value || 'N/A', [call]);
  const callDate = useMemo(() => call ? new Date(call[FIELD_IDS.callRecordings.callDate]).toLocaleDateString('pt-BR') : 'N/A', [call]);
  const callDuration = useMemo(() => Math.round((call?.[FIELD_IDS.callRecordings.duration] || 0) / 60), [call]);
  const efficiencyScore = useMemo(() => analysis?.[FIELD_IDS.analyses.efficiencyScore] || 0, [analysis]);

  if (loading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;
  }

  if (!call) {
    return <div className="flex justify-center items-center h-screen text-text-secondary">Chamada não encontrada.</div>;
  }

  return (
    <div className="p-8 space-y-8">
      <header>
        <button onClick={() => navigate('/calls')} className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary mb-4 transition-colors">
          <ArrowLeft size={18} />
          Voltar para Chamadas
        </button>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold text-text-primary">{call[FIELD_IDS.callRecordings.prospectName]}</h1>
            <div className="flex items-center gap-6 text-md text-text-secondary mt-2">
              <span className="flex items-center gap-2"><User size={16} />{sdrName}</span>
              <span className="flex items-center gap-2"><Calendar size={16} />{callDate}</span>
              <span className="flex items-center gap-2"><Clock size={16} />{callDuration} min</span>
            </div>
          </div>
          {analysis && (
             <div className="text-right">
                <p className="text-sm font-semibold text-text-secondary">PONTUAÇÃO GERAL</p>
                <p className="text-5xl font-bold text-primary">{efficiencyScore}</p>
             </div>
          )}
        </div>
      </header>

      <div className="bg-surface p-6 rounded-2xl shadow-lg border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold flex items-center gap-2 text-text-primary"><PlayCircle /> Gravação</h2>
          {!analysis && (
            <button onClick={handleTriggerAnalysis} disabled={isAnalyzing} className="flex items-center gap-2 px-4 py-2 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-all">
              {isAnalyzing ? <Loader2 className="animate-spin w-5 h-5" /> : <BrainCircuit className="w-5 h-5" />}
              <span>{isAnalyzing ? "Analisando..." : "Analisar Chamada"}</span>
            </button>
          )}
        </div>
        {audioUrl ? (
            <audio controls src={audioUrl} className="w-full h-12"></audio>
        ) : (
            <p className="text-center py-4 text-text-secondary">Áudio não disponível ou a carregar.</p>
        )}
      </div>

      {analysis ? (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3 space-y-8">
            {spinData && <SpinAnalysis spinAnalysis={spinData} />}
            {playbookData && <PlaybookAnalysis analysisData={playbookData} />}
          </div>
          <aside className="lg:col-span-2 space-y-6">
             <div className="bg-surface p-6 rounded-2xl shadow-lg border border-gray-100">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><MessageSquare/> Resumo da IA</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{analysis.summary || "Resumo não disponível."}</p>
             </div>
             <div className="bg-surface p-6 rounded-2xl shadow-lg border border-gray-100">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><AlertTriangle/> Feedback do Gestor</h3>
                <textarea 
                    className="w-full p-2 bg-background rounded-md border focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Adicione seu feedback aqui..."
                    defaultValue={analysis[FIELD_IDS.analyses.managerFeedback] || ''}
                    onBlur={(e) => baserowService.updateManagerFeedback(analysis.id, e.target.value)}
                />
             </div>
          </aside>
        </div>
      ) : (
        <div className="text-center p-12 bg-surface rounded-2xl border-2 border-dashed">
          <BrainCircuit className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <h3 className="text-xl font-bold text-text-primary">Análise Pendente</h3>
          <p className="text-text-secondary mt-2 max-w-md mx-auto">Clique no botão "Analisar Chamada" para que a inteligência artificial processe a gravação e gere os insights de performance.</p>
        </div>
      )}
    </div>
  );
}