// src/components/Leaderboard/ComparisonModal.tsx
import React from 'react';
import { X } from 'lucide-react';
import { SpinRadarChart } from '../Dashboard/charts/SpinRadarChart';

// Simplificando a interface para o modal
interface SdrComparisonData {
  name: string;
  avg_score: number;
  total_calls: number;
  // Adicionar dados do SPIN quando disponíveis
}

interface ComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  sdrData: SdrComparisonData[];
}

export function ComparisonModal({ isOpen, onClose, sdrData }: ComparisonModalProps) {
  if (!isOpen) return null;

  // Mock de dados de SPIN para visualização
  const mockSpinData = sdrData.map(sdr => ({
      name: sdr.name,
      data: [
        { subject: 'Situação', A: Math.random() * 20 + 70, fullMark: 100 },
        { subject: 'Problema', A: Math.random() * 20 + 65, fullMark: 100 },
        { subject: 'Implicação', A: Math.random() * 20 + 60, fullMark: 100 },
        { subject: 'Necessidade', A: Math.random() * 20 + 75, fullMark: 100 },
      ]
  }));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-surface rounded-2xl shadow-xl w-full max-w-4xl m-4">
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold text-text-primary">Análise Comparativa</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-background"><X /></button>
        </div>
        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          {mockSpinData.map(sdr => (
            <div key={sdr.name} className="text-center">
              <h3 className="font-bold text-lg">{sdr.name}</h3>
              <div className="h-64">
                <SpinRadarChart data={sdr.data} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}