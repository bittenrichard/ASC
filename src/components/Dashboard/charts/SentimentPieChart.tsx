// src/components/Dashboard/charts/SentimentPieChart.tsx
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';

const COLORS = {
  Positivo: '#10B981', // green-500
  Neutro: '#F59E0B',   // amber-500
  Negativo: '#EF4444', // red-500
};

interface SentimentData {
  name: 'Positivo' | 'Neutro' | 'Negativo';
  value: number;
}

interface SentimentPieChartProps {
  data: SentimentData[];
}

export function SentimentPieChart({ data }: SentimentPieChartProps) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
          nameKey="name"
        >
          {data.map((entry) => (
            <Cell key={`cell-${entry.name}`} fill={COLORS[entry.name]} />
          ))}
        </Pie>
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}