// src/components/Dashboard/charts/TeamScoreGauge.tsx
import React from 'react';

interface TeamScoreGaugeProps {
  score: number;
  target: number;
}

const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-600';
};

export function TeamScoreGauge({ score, target }: TeamScoreGaugeProps) {
    const percentage = Math.min((score / target) * 100, 100);

    return (
        <div className="flex flex-col items-center justify-center h-full">
            <div className={`text-5xl font-bold ${getScoreColor(score)}`}>
                {score}
                <span className="text-2xl text-gray-400">/{target}</span>
            </div>
             <p className="text-sm text-gray-500 mt-2">Média da Equipe vs. Meta</p>
            <div className="w-full bg-gray-200 rounded-full h-2.5 mt-4">
                <div
                    className={`h-2.5 rounded-full ${getScoreColor(score).replace('text-', 'bg-')}`}
                    style={{ width: `${percentage}%` }}
                ></div>
            </div>
        </div>
    );
}