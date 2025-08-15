// src/components/Dashboard/charts/TopicsBarChart.tsx
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface TopicData {
  name: string;
  count: number;
}

interface TopicsBarChartProps {
  data: TopicData[];
}

export function TopicsBarChart({ data }: TopicsBarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <XAxis type="number" hide />
        <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 12 }} />
        <Tooltip cursor={{ fill: '#f3f4f6' }} />
        <Bar dataKey="count" fill="#3B82F6" barSize={20} />
      </BarChart>
    </ResponsiveContainer>
  );
}