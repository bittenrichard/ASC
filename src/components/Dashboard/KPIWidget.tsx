// src/components/Dashboard/KPIWidget.tsx

import React from 'react';

interface KPIItem {
  label: string;
  value: string;
  target: string;
  progress: number;
}

interface KPIWidgetProps {
  title: string;
  data: KPIItem[];
}

const getProgressColor = (progress: number) => {
  if (progress >= 90) return 'bg-accent';
  if (progress >= 60) return 'bg-primary';
  return 'bg-red-500';
};

export function KPIWidget({ title, data }: KPIWidgetProps) {
  return (
    <div className="bg-surface p-6 rounded-2xl shadow-lg border border-gray-100 h-full">
      <h3 className="text-lg font-bold text-text-primary mb-4">{title}</h3>
      <div className="space-y-4">
        {/* O map para renderizar os itens continua igual, sem alterações */}
        {data.map((item, index) => (
          <div key={index}>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-semibold text-text-primary">{item.label}</span>
              <span className="text-sm font-bold text-primary">{item.value} / <span className="text-text-secondary">{item.target}</span></span>
            </div>
            <div className="w-full bg-background rounded-full h-2.5">
              <div
                className={`${getProgressColor(item.progress)} h-2.5 rounded-full transition-all duration-500`}
                style={{ width: `${item.progress}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}