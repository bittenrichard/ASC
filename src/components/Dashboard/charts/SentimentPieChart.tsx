// src/components/Dashboard/charts/SentimentPieChart.tsx
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';

const COLORS = {
  Positivo: '#00D09B', // accent
  Neutro: '#A597FF',   // primary-light
  Negativo: '#EF4444', // red-500
};

interface SentimentData {
  name: 'Positivo' | 'Neutro' | 'Negativo';
  value: number;
}

interface SentimentPieChartProps {
  data: SentimentData[];
}

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  if (percent === 0) return null;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontWeight="bold">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export function SentimentPieChart({ data }: SentimentPieChartProps) {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={renderCustomizedLabel}
          outerRadius={100}
          innerRadius={60}
          fill="#8884d8"
          dataKey="value"
          nameKey="name"
          paddingAngle={5}
          cornerRadius={8}
        >
          {data.map((entry) => (
            <Cell key={`cell-${entry.name}`} fill={COLORS[entry.name]} stroke={COLORS[entry.name]} />
          ))}
        </Pie>
        <Legend iconType="circle" />
      </PieChart>
    </ResponsiveContainer>
  );
}