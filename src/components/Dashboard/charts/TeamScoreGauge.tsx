// src/components/Dashboard/charts/TeamScoreGauge.tsx
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface TeamScoreGaugeProps {
  score: number;
  target: number;
}

const getScoreColor = (score: number, target: number) => {
    const percentage = score / target;
    if (percentage >= 0.9) return '#00D09B'; // accent
    if (percentage >= 0.7) return '#A597FF'; // primary-light
    return '#EF4444'; // red-500
};

export function TeamScoreGauge({ score, target }: TeamScoreGaugeProps) {
    const scoreColor = getScoreColor(score, target);
    const data = [
        { name: 'Score', value: score },
        { name: 'Remaining', value: Math.max(0, target - score) },
    ];

    return (
        <div className="w-full h-full relative flex flex-col items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        startAngle={180}
                        endAngle={-180}
                        innerRadius="70%"
                        outerRadius="100%"
                        fill="#8884d8"
                        dataKey="value"
                        cornerRadius={10}
                    >
                        <Cell fill={scoreColor} stroke={scoreColor} />
                        <Cell fill="#F7F8FC" stroke="#F7F8FC" />
                    </Pie>
                </PieChart>
            </ResponsiveContainer>
            <div className="absolute flex flex-col items-center justify-center">
                <span className="text-5xl font-bold" style={{ color: scoreColor }}>{score}</span>
                <span className="text-text-secondary font-semibold">de {target}</span>
                <span className="text-sm text-text-secondary mt-1">Pontuação Média</span>
            </div>
        </div>
    );
}