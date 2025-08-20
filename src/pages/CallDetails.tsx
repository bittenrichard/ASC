import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { baserowService, BaserowCallRecording, BaserowCallAnalysis, SpinAnalysisData, FIELD_IDS } from '../lib/baserowService';
import { analyzeCall } from '../lib/api';
import toast from 'react-hot-toast';
import { Loader2, ArrowLeft, PlayCircle, BrainCircuit, User, Calendar, Clock, Edit, Trash2 } from 'lucide-react';
import { SpinAnalysis } from '../components/CallDetails/SpinAnalysis';
import { PlaybookAnalysis } from '../components/CallDetails/PlaybookAnalysis';

export function CallDetails() {
  const { callId } = useParams<{ callId: string }>();
  const navigate = useNavigate();
  const [call, setCall] = useState<BaserowCallRecording | null>(null);
  const [analysis, setAnalysis] = useState<BaserowCallAnalysis | null>(null);
  const [spinData, setSpinData] = useState<SpinAnalysisData | null>(null);
  const [playbookData, setPlaybookData] = useState<any>(null); // Definir tipo se souber
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
          // Parse SPIN data
          const spinRaw = analysisData[FIELD_IDS.analyses.spinAnalysis];
          if (spinRaw) {
            try {
              setSpinData(typeof spinRaw === 'string' ? JSON.parse(spinRaw) : spinRaw);
            } catch (e) {
              console.error("Erro ao parsear análise SPIN:", e);
              toast.error("Análise SPIN corrompida.");
            }
          }
           // Parse Playbook data
           const playbookRaw = analysisData[FIELD_IDS.analyses.playbookAnalysis];
           if (playbookRaw) {
             try {
               setPlaybookData(typeof playbookRaw === 'string' ? JSON.parse(playbookRaw) : playbookRaw);
             } catch (e) {
               console.error("Erro ao parsear análise do Playbook:", e);
               toast.error("Análise do Playbook corrompida.");
             }
           }
        }
        
        // Obter URL do áudio via proxy
        const baserowAudioUrl = callData[FIELD_IDS.callRecordings.audioUrl]?.[0]?.url;
        if (baserowAudioUrl) {
            const audioBlob = await baserowService.getAudioFile(baserowAudioUrl);
            setAudioUrl(URL.createObjectURL(audioBlob));
        }

      } catch (error) {
        toast.error("Falha ao carregar detalhes da chamada.");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
    
    // Limpar a URL do objeto quando o componente for desmontado
    return () => {
        if (audioUrl) {
            URL.revokeObjectURL(audioUrl);
        }
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

  if (loading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin h-8 w-8" /></div>;
  }

  if (!call) {
    return <div className="flex justify-center items-center h-screen">Chamada não encontrada.</div>;
  }

  const sdrName = call[FIELD_IDS.callRecordings.sdr]?.[0]?.value || 'N/A';
  const callDate = new Date(call[FIELD_IDS.callRecordings.callDate]).toLocaleDateString('pt-BR');
  const callDuration = call[FIELD_IDS.callRecordings.duration] || 0;

  return (
    <div className="p-8 space-y-6">
      <header>
        <button onClick={() => navigate('/calls')} className="flex items-center gap-2 text-text-secondary hover:text-text-primary mb-4">
          <ArrowLeft size={20} />
          Voltar para Chamadas
        </button>
        <h1 className="text-3xl font-bold text-text-primary">{call[FIELD_IDS.callRecordings.prospectName]}</h1>
        <div className="flex items-center gap-6 text-sm text-text-secondary mt-2">
          <span className="flex items-center gap-2"><User size={16} />{sdrName}</span>
          <span className="flex items-center gap-2"><Calendar size={16} />{callDate}</span>
          <span className="flex items-center gap-2"><Clock size={16} />{Math.round(callDuration / 60)} min</span>
        </div>
      </header>

      <div className="bg-surface p-6 rounded-2xl shadow-lg border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold flex items-center gap-2"><PlayCircle /> Gravação</h2>
          {!analysis && (
            <button onClick={handleTriggerAnalysis} disabled={isAnalyzing} className="flex items-center gap-2 px-4 py-2 bg-primary text-white font-semibold rounded-lg hover:opacity-90 disabled:opacity-50">
              {isAnalyzing ? <Loader2 className="animate-spin" /> : <BrainCircuit />}
              {isAnalyzing ? "Analisando..." : "Analisar Chamada"}
            </button>
          )}
        </div>
        {audioUrl ? (
            <audio controls src={audioUrl} className="w-full"></audio>
        ) : (
            <p className="text-text-secondary">Áudio não disponível.</p>
        )}
      </div>

      {analysis ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {spinData && <SpinAnalysis spinAnalysis={spinData} />}
          {playbookData && <PlaybookAnalysis analysisData={playbookData} />}
        </div>
      ) : (
        <div className="text-center p-12 bg-surface rounded-2xl border">
          <BrainCircuit className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <h3 className="text-xl font-bold">Análise Pendente</h3>
          <p className="text-text-secondary mt-2">Clique em "Analisar Chamada" para processar a gravação.</p>
        </div>
      )}
    </div>
  );
}