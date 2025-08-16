// src/components/Dashboard/charts/TopicsBarChart.tsx
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface TopicData {
  name: string;
  count: number;
}

interface TopicsBarChartProps {
  data: TopicData[];
}

const COLORS = ['#6D55FF', '#A597FF', '#C4BFFF', '#E2DEFF'];

const tooltipFormatter = (value: number, name: string) => {
  if (name === 'count') {
    return [value, 'Total'];
  }
  return [value, name];
};

export function TopicsBarChart({ data }: TopicsBarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
        <XAxis dataKey="name" stroke="#8A87AD" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis stroke="#8A87AD" fontSize={12} tickLine={false} axisLine={false} />
        <Tooltip
          cursor={{ fill: 'rgba(247, 248, 252, 0.5)' }}
          contentStyle={{
            background: '#FFFFFF',
            borderRadius: '12px',
            borderColor: '#E2DEFF',
            color: '#1A1053',
            fontFamily: 'Poppins, sans-serif',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
          }}
          formatter={tooltipFormatter}
        />
        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}