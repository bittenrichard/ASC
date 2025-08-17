// src/components/Dashboard/Goals/GoalCard.tsx
import React from 'react';
import { GoalData } from '../../lib/baserowService';
import { Target, Calendar, Edit, Trash2 } from 'lucide-react';

interface GoalCardProps {
  goal: GoalData;
  onEdit: (goal: GoalData) => void;
  onDelete: (goalId: number, goalName: string) => void;
}

const getProgressColor = (progress: number) => {
  if (progress >= 100) return 'bg-accent';
  if (progress >= 60) return 'bg-primary';
  return 'bg-red-500';
};

export function GoalCard({ goal, onEdit, onDelete }: GoalCardProps) {
  const progress = goal.targetValue > 0 ? Math.min(Math.round((goal.currentValue / goal.targetValue) * 100), 100) : 0;
  const isCompleted = new Date(goal.endDate) < new Date();

  return (
    <div className="bg-background p-5 rounded-lg border border-gray-200 shadow-sm relative">
      <div className="absolute top-3 right-3 flex items-center gap-1">
          <button onClick={() => onEdit(goal)} className="p-2 text-text-secondary hover:text-primary transition-colors rounded-full hover:bg-gray-100">
              <Edit className="w-4 h-4" />
          </button>
          <button onClick={() => onDelete(goal.id, goal.name)} className="p-2 text-text-secondary hover:text-red-500 transition-colors rounded-full hover:bg-gray-100">
              <Trash2 className="w-4 h-4" />
          </button>
      </div>
      
      <div className="flex justify-between items-start mb-2">
        <div>
          <h4 className="font-semibold text-text-primary pr-16">{goal.name}</h4>
          <p className="text-text-secondary text-sm mt-1">Métrica: <span className="font-medium">{goal.metric}</span></p>
        </div>
        <div className={`px-3 py-1 text-xs font-bold rounded-full ${isCompleted ? 'bg-gray-200 text-gray-700' : 'bg-green-100 text-green-700'}`}>
          {isCompleted ? 'Concluída' : 'Ativa'}
        </div>
      </div>
      
      <div className="flex items-center space-x-4 text-text-secondary text-sm my-4">
        <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> Período: <span className="font-semibold text-text-primary">{new Date(goal.startDate.replace(/-/g, '/')).toLocaleDateString('pt-BR')} - {new Date(goal.endDate.replace(/-/g, '/')).toLocaleDateString('pt-BR')}</span></span>
      </div>

      <div>
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-semibold text-text-primary flex items-center gap-1.5"><Target className="w-4 h-4" /> Progresso</span>
          <span className="text-sm font-bold text-primary">{goal.currentValue} / <span className="text-text-secondary">{goal.targetValue}</span></span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className={`${getProgressColor(progress)} h-2.5 rounded-full transition-all duration-500`}
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      <p className="text-sm text-text-secondary mt-4">Atribuída a: <span className="font-semibold text-text-primary">{goal.sdrName || 'Equipe Inteira'}</span></p>
    </div>
  );
}