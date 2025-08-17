// src/components/CallDetails/PlaybookAnalysis.tsx
import React from 'react';
import { BookCheck, XCircle, CheckCircle } from 'lucide-react';

interface PlaybookFeedback {
    rule: string;
    followed: boolean;
    details: string;
}

interface PlaybookAnalysisData {
  adherence_score: number;
  feedback: PlaybookFeedback[];
}

interface PlaybookAnalysisProps {
  analysisData: PlaybookAnalysisData | null;
}

export function PlaybookAnalysis({ analysisData }: PlaybookAnalysisProps) {
  if (!analysisData) {
    return (
      <div className="bg-surface p-6 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-text-primary mb-2">Análise de Playbook</h3>
        <p className="text-text-secondary">A análise de aderência ao playbook não está disponível.</p>
      </div>
    );
  }

  const { adherence_score, feedback } = analysisData;

  return (
    <div className="bg-surface p-6 rounded-2xl shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-text-primary">Aderência ao Playbook</h3>
        <div className="text-right">
            <p className="text-3xl font-bold text-primary">{adherence_score}<span className="text-lg text-text-secondary">/100</span></p>
            <p className="text-xs font-semibold text-text-secondary">PONTUAÇÃO</p>
        </div>
      </div>
      
      <div className="space-y-3">
        {feedback.map((item, index) => (
          <div key={index} className="flex items-start gap-4 p-3 bg-background rounded-lg">
            <div>
              {item.followed ? (
                <CheckCircle className="w-5 h-5 text-accent-dark mt-0.5" />
              ) : (
                <XCircle className="w-5 h-5 text-red-500 mt-0.5" />
              )}
            </div>
            <div>
              <p className="font-semibold text-text-primary">{item.rule}</p>
              <p className="text-xs text-text-secondary">{item.details}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}