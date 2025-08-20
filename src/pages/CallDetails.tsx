import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
// Alterado para caminho relativo
import { getTableRow, getTableRows } from '../lib/baserowService'; 
// Alterado para caminho relativo
import { analyzeCall } from '../lib/api'; 
// Alterado para caminho relativo
import { Call, Analysis, SpinAnalysisItem, PlaybookAdherenceItem } from '../types';
import { toast } from 'sonner';

// --- ESTA É A CORREÇÃO ---
// Usando caminhos relativos para garantir que o build encontre os arquivos.
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import { Separator } from "../components/ui/separator";
import { 
    PlayCircle, BrainCircuit, BarChart, FileText, CheckCircle, XCircle, 
    Users, Building, Briefcase, Smile, Frown, Meh, ListChecks 
} from 'lucide-react';

// (O resto do arquivo permanece exatamente o mesmo, sem alterações)

// Componentes internos para melhor organização
const AnalysisCard = ({ analysis }: { analysis: Analysis | null }) => {
  if (!analysis) return null;

  const sentimentIcon = {
    'Positivo': <Smile className="text-green-500" />,
    'Negativo': <Frown className="text-red-500" />,
    'Neutro': <Meh className="text-yellow-500" />,
  }[analysis.sentiment];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center"><BarChart className="mr-2" /> Análise da Chamada</CardTitle>
        <CardDescription>Resumo e insights gerados pela IA.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="font-semibold mb-1">Resumo</h4>
          <p className="text-sm text-muted-foreground">{analysis.summary}</p>
        </div>
        <Separator />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <h4 className="font-semibold mb-2">Perfil do Cliente</h4>
                <div className="space-y-2">
                    <p className="flex items-center text-sm"><Users className="mr-2 h-4 w-4" /> {analysis.customer_name || 'Não informado'}</p>
                    <p className="flex items-center text-sm"><Briefcase className="mr-2 h-4 w-4" /> {analysis.customer_position || 'Não informado'}</p>
                    <p className="flex items-center text-sm"><Building className="mr-2 h-4 w-4" /> {analysis.customer_company || 'Não informado'}</p>
                </div>
            </div>
            <div>
                <h4 className="font-semibold mb-2">Sentimento e Eficiência</h4>
                <div className="flex items-center gap-2 mb-2">
                    {sentimentIcon}
                    <Badge variant={analysis.sentiment === 'Positivo' ? 'default' : analysis.sentiment === 'Negativo' ? 'destructive' : 'secondary'}>{analysis.sentiment}</Badge>
                </div>
                <div className="space-y-1">
                    <label className="text-sm font-medium">Score de Eficiência</label>
                    <Progress value={analysis.efficiencyScore} className="w-full" />
                    <p className="text-right text-sm font-bold">{analysis.efficiencyScore}%</p>
                </div>
            </div>
        </div>
      </CardContent>
    </Card>
  );
};

const SpinAnalysisCard = ({ items }: { items: SpinAnalysisItem[] }) => {
    const spinData = useMemo(() => {
        return {
            Situation: items.filter(i => i.type === 'situation').map(i => i.point),
            Problem: items.filter(i => i.type === 'problem').map(i => i.point),
            Implication: items.filter(i => i.type === 'implication').map(i => i.point),
            Need: items.filter(i => i.type === 'need').map(i => i.point),
        };
    }, [items]);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center"><FileText className="mr-2" /> Análise SPIN</CardTitle>
                <CardDescription>Pontos identificados em cada fase da metodologia.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {Object.entries(spinData).map(([key, value]) => (
                    value.length > 0 && (
                        <div key={key}>
                            <h4 className="font-semibold mb-2 text-lg">{key}</h4>
                            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                                {value.map((point, index) => <li key={index} className="text-sm">{point}</li>)}
                            </ul>
                        </div>
                    )
                ))}
            </CardContent>
        </Card>
    );
};


const PlaybookAdherenceCard = ({ items }: { items: PlaybookAdherenceItem[] }) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center"><ListChecks className="mr-2" /> Aderência ao Playbook</CardTitle>
      <CardDescription>Verificação dos pontos-chave que deveriam ser abordados.</CardDescription>
    </CardHeader>
    <CardContent>
      <ul className="space-y-3">
        {items.map(item => (
          <li key={item.id} className="p-3 rounded-md border">
            <div className="flex items-center justify-between mb-1">
              <p className="font-semibold">{item.key_point}</p>
              {item.mentioned ? 
                <CheckCircle className="text-green-500" /> : 
                <XCircle className="text-red-500" />
              }
            </div>
            <p className="text-sm text-muted-foreground">{item.details}</p>
          </li>
        ))}
      </ul>
    </CardContent>
  </Card>
);

const CallDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const [call, setCall] = useState<Call | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [spinItems, setSpinItems] = useState<SpinAnalysisItem[]>([]);
  const [playbookItems, setPlaybookItems] = useState<PlaybookAdherenceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const callTableId = import.meta.env.VITE_BASEROW_TABLE_CALL_RECORDINGS;
  const analysisTableId = import.meta.env.VITE_BASEROW_TABLE_ANALYSES;
  const spinTableId = 705;
  const playbookTableId = 706;

  useEffect(() => {
    const fetchCallDetails = async () => {
      if (!id) return;
      setIsLoading(true);
      try {
        const callData = await getTableRow<Call>(callTableId, id);
        setCall(callData);

        if (callData?.analysis && callData.analysis.length > 0) {
          const analysisId = callData.analysis[0].id;
          const analysisData = await getTableRow<Analysis>(analysisTableId, analysisId);
          setAnalysis(analysisData);
          
          const allSpinItems = await getTableRows<SpinAnalysisItem>(spinTableId);
          const allPlaybookItems = await getTableRows<PlaybookAdherenceItem>(playbookTableId);
          
          setSpinItems(allSpinItems.filter(item => item.analysis_id.some(a => a.id === analysisId)));
          setPlaybookItems(allPlaybookItems.filter(item => item.analysis_id.some(a => a.id === analysisId)));
        }
      } catch (error) {
        toast.error('Falha ao carregar os detalhes da chamada.');
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCallDetails();
  }, [id, callTableId, analysisTableId, spinTableId, playbookTableId]);

  const handleAnalyzeCall = async () => {
    if (!id) return;
    setIsAnalyzing(true);
    toast.info('A análise foi iniciada...', {
      description: 'Isso pode levar alguns minutos.',
    });
    try {
      await analyzeCall(id);
      toast.success('Análise concluída com sucesso!', {
        description: 'A página será atualizada em instantes.',
      });
      setTimeout(() => window.location.reload(), 2000);
    } catch (error) {
      toast.error('Ocorreu um erro ao processar a análise.');
      console.error(error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Carregando detalhes...</div>;
  }

  if (!call) {
    return <div className="flex justify-center items-center h-screen">Chamada não encontrada.</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Detalhes da Chamada</h1>
        <p className="text-muted-foreground">{call.title}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <PlayCircle className="mr-2" />
              <span>Gravação</span>
            </div>
            <Button
              onClick={handleAnalyzeCall}
              disabled={isAnalyzing || call.analysis_status === 'Completed'}
            >
              <BrainCircuit className="mr-2 h-4 w-4" />
              {call.analysis_status === 'Completed' ? 'Análise Concluída' : (isAnalyzing ? 'Analisando...' : 'Analisar Chamada')}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
              <span><strong>SDR:</strong> {call.sdr[0]?.value || 'Não informado'}</span>
              <span><strong>Data:</strong> {new Date(call.call_date).toLocaleDateString()}</span>
          </div>
          <audio controls src={call.recording_url[0]?.url} className="w-full">
            Seu navegador não suporta o elemento de áudio.
          </audio>
        </CardContent>
      </Card>

      {call.analysis_status === 'Completed' && analysis ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
                <AnalysisCard analysis={analysis} />
                <PlaybookAdherenceCard items={playbookItems} />
            </div>
            <div>
                <SpinAnalysisCard items={spinItems} />
            </div>
        </div>
      ) : (
        <Card className="text-center p-8">
            <CardContent>
                <BrainCircuit className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">Análise Pendente</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                    Clique em "Analisar Chamada" para que a IA processe a gravação e gere os insights.
                </p>
            </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CallDetailsPage;