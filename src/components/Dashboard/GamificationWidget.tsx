// src/components/Dashboard/GamificationWidget.tsx
import React from 'react';
import { Trophy, Star, ShieldCheck } from 'lucide-react';

interface Achievement {
    icon: React.ElementType;
    title: string;
    description: string;
}

interface GamificationWidgetProps {
    topPerformer: { name: string, score: number };
    recentAchievements: Achievement[];
}

export function GamificationWidget({ topPerformer, recentAchievements }: GamificationWidgetProps) {
  return (
    <div className="bg-surface p-6 rounded-2xl shadow-lg border border-gray-100 h-full">
        <h3 className="text-lg font-bold text-text-primary mb-4">Incentivos da Equipe</h3> {/* CORRIGIDO */}
        <div className="bg-gradient-to-r from-primary to-primary-light p-4 rounded-xl text-white mb-6 shadow-lg">
            <div className="flex items-center gap-4">
                <Trophy className="h-10 w-10" />
                <div>
                    <p className="text-sm font-semibold opacity-80">Top Performer da Semana</p>
                    <p className="text-xl font-bold">{topPerformer.name}</p>
                </div>
                <div className="ml-auto text-right">
                     <p className="text-2xl font-bold">{topPerformer.score}</p>
                     <p className="text-xs opacity-80">pontos</p>
                </div>
            </div>
        </div>
        <div>
            <h4 className="font-semibold text-text-primary mb-2">Conquistas Recentes</h4>
            <div className="space-y-3">
                {recentAchievements.map((ach, index) => (
                    <div key={index} className="flex items-center gap-3">
                        <div className="bg-accent/10 p-2 rounded-full">
                            <ach.icon className="h-5 w-5 text-accent" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-text-primary">{ach.title}</p>
                            <p className="text-xs text-text-secondary">{ach.description}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </div>
  );
}