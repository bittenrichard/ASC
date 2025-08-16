// src/components/Dashboard/MetricCard.tsx
import React from 'react';
import { type LucideProps } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ForwardRefExoticComponent<Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>>;
}

export function MetricCard({ title, value, icon: Icon }: MetricCardProps) {
  return (
    <div className="bg-surface p-6 rounded-2xl shadow-lg border border-gray-100 transition-shadow hover:shadow-xl">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">
          {title}
        </h3>
        <div className="bg-primary-light p-2 rounded-lg">
          <Icon className="h-6 w-6 text-primary" />
        </div>
      </div>
      <p className="text-4xl font-bold text-text-primary mt-4">
        {value}
      </p>
    </div>
  );
}