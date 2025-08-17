// src/pages/CoachingHub.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import { baserowService, BaserowCallAnalysis, BaserowCallRecording } from '../lib/baserowService';
import { Award, AlertTriangle, UserCheck, MessageSquareWarning, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface CoachingInsight {
  topCallsForReview: any[];
  frequentObjections: { objection: string, count: number }[];
  sdrsNeedingAttention: any[];
}

export function CoachingHub() {
  const { user } = useAuth();
  const [insights, setInsights] = useState<CoachingInsight | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const generateInsights = async () => {
      if (!user?.organizationId) return;
      setLoading(true);
      try {
        const [recordings, analyses, sdrs] = await Promise.all([
            baserowService.getCallRecordings(user.organizationId),
            baserowService.getCallAnalyses(user.organizationId),
            baserowService.getAllSDRs(user.organizationId)
        ]);
        
        const sdrMap = new Map(sdrs.map(s => [s.id, s.name]));
        const analysesMap = new Map(analyses.map(a => [a.Call_Recording[0]?.id, a]));

        const combinedData = recordings.map(rec => ({
            ...rec,
            analysis: analysesMap.get(rec.id),
            sdrName: sdrMap.get(rec.SDR?.[0]?.id) || 'N/A'
        }));

        // Insight 1: Top 5 Chamadas para Revisão
        const topCallsForReview = [...combinedData]
            .filter(c => c.analysis)
            .sort((a, b) => a.analysis.efficiency_score - b.analysis.efficiency_score)
            .slice(0, 5);

        // Insight 2: Objeções Frequentes
        const objectionKeywords = ['preço', 'caro', 'concorrente', 'tempo', 'agora não'];
        const objectionCounts: { [key: string]: number } = {};
        analyses.forEach(a => {
            const transcript = a.full_transcript?.toLowerCase() || '';
            objectionKeywords.forEach(keyword => {
                if (transcript.includes(keyword)) {
                    objectionCounts[keyword] = (objectionCounts[keyword] || 0) + 1;
                }
            });
        });
        const frequentObjections = Object.entries(objectionCounts)
            .map(([objection, count]) => ({ objection, count }))
            .sort((a, b) => b.count - a.count);

        // Insight 3: SDRs Precisando de Atenção
        const sdrScores: { [id: number]: { totalScore: number, count: number } } = {};
        combinedData.forEach(call => {
            if(call.analysis && call.SDR?.[0]?.id) {
                const sdrId = call.SDR[0].id;
                if(!sdrScores[sdrId]) sdrScores[sdrId] = { totalScore: 0, count: 0 };
                sdrScores[sdrId].totalScore += call.analysis.efficiency_score;
                sdrScores[sdrId].count++;
            }
        });
        const sdrsNeedingAttention = Object.entries(sdrScores)
            .map(([id, data]) => ({
                id: Number(id),
                name: sdrMap.get(Number(id)) || 'Desconhecido',
                avgScore: Math.round(data.totalScore / data.count),
            }))
            .sort((a, b) => a.avgScore - b.avgScore)
            .slice(0, 3);
            
        setInsights({ topCallsForReview, frequentObjections, sdrsNeedingAttention });

      } catch (error) {
        toast.error("Não foi possível gerar os insights de coaching.");
      } finally {
        setLoading(false);
      }
    };
    generateInsights();
  }, [user]);

  if (loading) {
    return <div className="p-8 text-center"><Loader2 className="animate-spin h-8 w-8 mx-auto" /></div>;
  }

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-text-primary">Central de Coaching</h1>
        <p className="text-text-secondary mt-1">Insights acionáveis para treinar sua equipe de vendas.</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Top 5 Chamadas */}
        <div className="lg:col-span-1 bg-surface p-6 rounded-2xl shadow-lg border border-gray-100">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><AlertTriangle className="text-yellow-500" />Top 5 Chamadas para Revisão</h3>
            <div className="space-y-3">
                {insights?.topCallsForReview.map(call => (
                    <div key={call.id} onClick={() => navigate(`/call/${call.id}`)} className="p-3 bg-background rounded-lg cursor-pointer hover:bg-gray-200">
                        <div className="flex justify-between items-center">
                            <span className="font-semibold">{call.Prospect_Name}</span>
                            <span className="font-bold text-red-500">{call.analysis.efficiency_score}</span>
                        </div>
                        <span className="text-xs text-text-secondary">SDR: {call.sdrName}</span>
                    </div>
                ))}
            </div>
        </div>

        {/* Objeções Frequentes */}
        <div className="lg:col-span-1 bg-surface p-6 rounded-2xl shadow-lg border border-gray-100">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><MessageSquareWarning className="text-orange-500" />Objeções Mais Frequentes</h3>
            <div className="space-y-3">
                {insights?.frequentObjections.map(obj => (
                    <div key={obj.objection} className="flex justify-between items-center p-3 bg-background rounded-lg">
                        <span className="font-semibold capitalize">{obj.objection}</span>
                        <span className="font-bold text-text-primary">{obj.count} menções</span>
                    </div>
                ))}
            </div>
        </div>

        {/* SDRs em Atenção */}
        <div className="lg:col-span-1 bg-surface p-6 rounded-2xl shadow-lg border border-gray-100">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><UserCheck className="text-blue-500" />SDRs Precisando de Atenção</h3>
             <div className="space-y-3">
                {insights?.sdrsNeedingAttention.map(sdr => (
                    <div key={sdr.id} className="p-3 bg-background rounded-lg">
                        <div className="flex justify-between items-center">
                            <span className="font-semibold">{sdr.name}</span>
                            <span className="font-bold text-blue-500">{sdr.avgScore}</span>
                        </div>
                        <span className="text-xs text-text-secondary">Pontuação Média</span>
                    </div>
                ))}
            </div>
        </div>

      </div>
    </div>
  );
}