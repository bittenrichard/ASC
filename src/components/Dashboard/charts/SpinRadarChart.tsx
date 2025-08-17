import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';

interface SpinRadarChartProps {
  data: {
    subject: string;
    A: number;
    fullMark: number;
  }[];
}

const customTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white/90 p-3 rounded-lg border border-gray-200 shadow-lg backdrop-blur-sm">
        <p className="font-semibold text-text-primary mb-1">{data.subject}</p>
        <p className="text-sm text-text-secondary">Pontuação: <span className="font-bold">{data.A}</span></p>
      </div>
    );
  }

  return null;
};

export function SpinRadarChart({ data }: SpinRadarChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
        <PolarGrid stroke="#e5e7eb" />
        <PolarAngleAxis dataKey="subject" tick={{ fill: '#8A87AD', fontSize: 12, fontWeight: 600 }} />
        <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
        <Radar name="SPIN Score" dataKey="A" stroke="#6D55FF" fill="#6D55FF" fillOpacity={0.6} />
        <Tooltip content={customTooltip} />
      </RadarChart>
    </ResponsiveContainer>
  );
}