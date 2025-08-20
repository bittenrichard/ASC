// src/components/CallDetails/SpinAnalysis.tsx
import React from 'react';
import { Lightbulb, Search, Bomb, Sparkles } from 'lucide-react';
import type { SpinAnalysisData } from '../../lib/baserowService';
import { SpinRadarChart } from '../Dashboard/charts/SpinRadarChart';

interface SpinAnalysisProps {
  analysisData: SpinAnalysisData | null;
}

const getScoreColor = (score: number) => {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-yellow-600';
  return 'text-red-500';
};

const spinCategories = [
  { key: 'situation', title: 'Situação', icon: Search, color: 'text-blue-500' },
  { key: 'problem', title: 'Problema', icon: Lightbulb, color: 'text-yellow-500' },
  { key: 'implication', title: 'Implicação', icon: Bomb, color: 'text-red-500' },
  { key: 'need_payoff', title: 'Necessidade', icon: Sparkles, color: 'text-green-500' },
] as const;


export function SpinAnalysis({ analysisData }: SpinAnalysisProps) {
  // Verificação de segurança robusta para evitar a tela branca
  if (!analysisData || !analysisData.situation) {
    return (
      <div className="bg-surface p-6 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-text-primary mb-2">Análise SPIN Selling</h3>
        <p className="text-text-secondary">Os dados da análise SPIN para esta chamada não estão disponíveis ou estão a ser processados.</p>
      </div>
    );
  }

  const chartData = [
      { subject: 'Situação', A: analysisData.situation.score, fullMark: 100 },
      { subject: 'Problema', A: analysisData.problem.score, fullMark: 100 },
      { subject: 'Implicação', A: analysisData.implication.score, fullMark: 100 },
      { subject: 'Necessidade', A: analysisData.need_payoff.score, fullMark: 100 },
  ];

  const overallScore = Math.round(
    (analysisData.situation.score + 
     analysisData.problem.score + 
     analysisData.implication.score + 
     analysisData.need_payoff.score) / 4
  );

  return (
    <div className="bg-surface p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-start mb-4">
            <div>
                <h3 className="text-lg font-bold text-text-primary">Análise SPIN Selling</h3>
                <p className="text-sm text-text-secondary">Desempenho da chamada em cada etapa da metodologia.</p>
            </div>
            <div className={`text-right p-3 rounded-lg bg-background border`}>
                <p className={`font-bold text-2xl ${getScoreColor(overallScore)}`}>{overallScore}<span className="text-lg text-text-secondary">/100</span></p>
                <p className="text-xs font-semibold text-text-secondary">PONTUAÇÃO GERAL</p>
            </div>
        </div>
      
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 h-64">
                <SpinRadarChart data={chartData} />
            </div>
            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                 {spinCategories.map(({ key, title, icon: Icon, color }) => {
                    const data = analysisData[key];
                    return (
                        <div key={key} className="bg-background rounded-lg p-4 border flex flex-col">
                            <div className="flex items-center space-x-2 mb-2">
                                <Icon className={`w-5 h-5 ${color}`} />
                                <h4 className="font-bold text-text-primary">{title}</h4>
                                <span className={`ml-auto font-bold text-lg ${getScoreColor(data.score)}`}>{data.score}</span>
                            </div>
                             <p className="text-xs text-text-secondary flex-grow">{data.feedback}</p>
                        </div>
                    );
                })}
            </div>
        </div>
    </div>
  );
}