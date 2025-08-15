// src/components/Calls/SpinAnalysis.tsx

import React from 'react';
import { Lightbulb, Search, Bomb, Sparkles } from 'lucide-react';
import type { SpinAnalysisData } from '../../lib/baserowService';

interface SpinAnalysisProps {
  analysisData: SpinAnalysisData | null;
}

const getScoreColor = (score: number) => {
  if (score >= 80) return 'bg-green-500';
  if (score >= 60) return 'bg-yellow-500';
  return 'bg-red-500';
};

const spinCategories = [
  { key: 'situation', title: 'Situação', icon: Search, color: 'text-blue-500' },
  { key: 'problem', title: 'Problema', icon: Lightbulb, color: 'text-yellow-500' },
  { key: 'implication', title: 'Implicação', icon: Bomb, color: 'text-red-500' },
  { key: 'need_payoff', title: 'Necessidade', icon: Sparkles, color: 'text-green-500' },
] as const;


export function SpinAnalysis({ analysisData }: SpinAnalysisProps) {
  if (!analysisData) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-2">Análise SPIN Selling</h3>
        <p className="text-gray-500">A análise SPIN para esta chamada ainda não está disponível.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold mb-4">Análise SPIN Selling</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {spinCategories.map(({ key, title, icon: Icon, color }) => {
          const data = analysisData[key];
          if (!data) return null;

          return (
            <div key={key} className="bg-gray-50 rounded-lg p-4 border">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Icon className={`w-6 h-6 ${color}`} />
                  <h4 className="font-bold text-gray-800">{title}</h4>
                </div>
                <div className="text-right">
                  <p className="font-bold text-xl text-gray-900">{data.score}<span className="text-sm font-normal text-gray-500">/100</span></p>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                  <div 
                    className={`h-2 rounded-full ${getScoreColor(data.score)}`}
                    style={{ width: `${data.score}%` }}
                  ></div>
              </div>
              <p className="text-sm text-gray-600">{data.feedback}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}