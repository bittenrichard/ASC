import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import { baserowService, BaserowGoal } from '../lib/baserowService';
import { Plus, Target, Calendar, BarChart3, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface GoalForm {
    name: string;
    metric: string;
    targetValue: number;
    startDate: string;
    endDate: string;
    assignedTo: number[];
}

export function Goals() {
    const { user, loading: authLoading } = useAuth();
    const [goals, setGoals] = useState<BaserowGoal[]>([]);
    const [loadingData, setLoadingData] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [teamMembers, setTeamMembers] = useState<any[]>([]);

    const [form, setForm] = useState<GoalForm>({
        name: '',
        metric: 'Número de Chamadas',
        targetValue: 0,
        startDate: '',
        endDate: '',
        assignedTo: [],
    });

    const metricOptions = ['Número de Chamadas', 'Reuniões Agendadas', 'Pontuação Média de Eficiência'];

    const fetchGoalsAndTeam = useCallback(async () => {
        if (!user || !user.organizationId) {
            setLoadingData(false);
            return;
        }
        setLoadingData(true);
        try {
            const fetchedGoals = await baserowService.getGoals(user.organizationId);
            setGoals(fetchedGoals);
            const fetchedTeam = await baserowService.getAllSDRs(user.organizationId);
            setTeamMembers(fetchedTeam);
        } catch (error) {
            console.error('Erro ao buscar metas e equipe:', error);
            toast.error('Não foi possível carregar as metas ou a equipe.');
        } finally {
            setLoadingData(false);
        }
    }, [user]);

    useEffect(() => {
        if (!authLoading) {
            fetchGoalsAndTeam();
        }
    }, [authLoading, fetchGoalsAndTeam]);

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleAssignedToChange = (sdrId: number) => {
        setForm(prev => {
            const isAssigned = prev.assignedTo.includes(sdrId);
            if (isAssigned) {
                return { ...prev, assignedTo: prev.assignedTo.filter(id => id !== sdrId) };
            } else {
                return { ...prev, assignedTo: [...prev.assignedTo, sdrId] };
            }
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !user.organizationId || isSubmitting) return;

        setIsSubmitting(true);
        try {
            await baserowService.createGoal({
                name: form.name,
                metric: form.metric,
                startDate: form.startDate,
                endDate: form.endDate,
                targetValue: form.targetValue,
                assignedTo: form.assignedTo,
                organizationId: user.organizationId,
            });
            toast.success('Meta criada com sucesso!');
            setForm({ name: '', metric: 'Número de Chamadas', targetValue: 0, startDate: '', endDate: '', assignedTo: [] });
            fetchGoalsAndTeam(); // Recarrega a lista de metas
        } catch (error) {
            console.error('Erro ao criar meta:', error);
            toast.error('Falha ao criar meta.');
        } finally {
            setIsSubmitting(false);
        }
    };
    
    if (authLoading || loadingData) {
        return (
            <div className="p-8 text-center text-text-secondary">
                <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                <p className="mt-4">A carregar dados...</p>
            </div>
        );
    }
    
    if (user?.role !== 'administrator') {
        return (
            <div className="p-8 text-center">
                <h2 className="text-2xl font-bold text-text-primary">Acesso Negado</h2>
                <p className="text-text-secondary mt-2">Apenas administradores podem gerenciar metas.</p>
            </div>
        );
    }

    return (
        <div className="p-8 space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-text-primary">Central de Metas</h1>
                    <p className="text-text-secondary mt-1">Defina objetivos personalizados e acompanhe o progresso da sua equipe.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 bg-surface p-8 rounded-2xl shadow-lg border border-gray-100 h-fit">
                    <h3 className="text-xl font-bold text-text-primary mb-6">Criar Nova Meta</h3>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-text-primary mb-1">Nome da Meta</label>
                            <input id="name" type="text" name="name" value={form.name} onChange={handleFormChange} placeholder="Ex: Agendar 20 reuniões em Março" required className="w-full px-4 py-3 bg-background border border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"/>
                        </div>
                        <div>
                            <label htmlFor="metric" className="block text-sm font-medium text-text-primary mb-1">Métrica</label>
                            <select id="metric" name="metric" value={form.metric} onChange={handleFormChange} className="w-full px-4 py-3 bg-background border border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
                                {metricOptions.map(option => <option key={option} value={option}>{option}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="targetValue" className="block text-sm font-medium text-text-primary mb-1">Valor Alvo</label>
                            <input id="targetValue" type="number" name="targetValue" value={form.targetValue} onChange={handleFormChange} required min="0" className="w-full px-4 py-3 bg-background border border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"/>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="startDate" className="block text-sm font-medium text-text-primary mb-1">Data de Início</label>
                                <input id="startDate" type="date" name="startDate" value={form.startDate} onChange={handleFormChange} required className="w-full px-4 py-3 bg-background border border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"/>
                            </div>
                            <div>
                                <label htmlFor="endDate" className="block text-sm font-medium text-text-primary mb-1">Data de Fim</label>
                                <input id="endDate" type="date" name="endDate" value={form.endDate} onChange={handleFormChange} required className="w-full px-4 py-3 bg-background border border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"/>
                            </div>
                        </div>
                        <div>
                            <h4 className="text-sm font-medium text-text-primary mb-2">Atribuído a</h4>
                            <div className="bg-background p-4 rounded-lg space-y-2 max-h-40 overflow-y-auto">
                                <div className="flex items-center">
                                  <input type="checkbox" id="allTeam" checked={form.assignedTo.length === teamMembers.length} onChange={() => setForm(prev => ({ ...prev, assignedTo: prev.assignedTo.length === teamMembers.length ? [] : teamMembers.map(m => m.id) }))} className="w-4 h-4 text-primary bg-background border-gray-300 rounded focus:ring-primary" />
                                  <label htmlFor="allTeam" className="ml-2 text-sm font-semibold text-text-primary">Toda a Equipe</label>
                                </div>
                                {teamMembers.map(member => (
                                    <div key={member.id} className="flex items-center">
                                        <input type="checkbox" id={`sdr-${member.id}`} checked={form.assignedTo.includes(member.id)} onChange={() => handleAssignedToChange(member.id)} className="w-4 h-4 text-primary bg-background border-gray-300 rounded focus:ring-primary" />
                                        <label htmlFor={`sdr-${member.id}`} className="ml-2 text-sm text-text-primary">{member.name}</label>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <button type="submit" disabled={isSubmitting} className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-lg shadow-sm text-base font-semibold text-white bg-primary hover:opacity-90 transition-all duration-300 disabled:opacity-50">
                            {isSubmitting ? <Loader2 className="animate-spin h-5 w-5" /> : <Plus className="h-5 w-5" />}
                            <span>{isSubmitting ? 'A criar meta...' : 'Criar Meta'}</span>
                        </button>
                    </form>
                </div>

                <div className="lg:col-span-2 bg-surface p-8 rounded-2xl shadow-lg border border-gray-100">
                    <h3 className="text-xl font-bold text-text-primary mb-6">Metas Ativas</h3>
                    <div className="space-y-4">
                        {goals.length > 0 ? (
                            goals.map(goal => (
                                <div key={goal.id} className="bg-background p-5 rounded-lg border border-gray-200">
                                    <div className="flex justify-between items-center mb-2">
                                        <h4 className="font-semibold text-text-primary">{goal.Name}</h4>
                                        <div className={`px-3 py-1 text-sm font-bold rounded-full ${new Date(goal.End_Date) < new Date() ? 'bg-gray-200 text-gray-700' : 'bg-green-100 text-green-700'}`}>
                                            {new Date(goal.End_Date) < new Date() ? 'Concluída' : 'Ativa'}
                                        </div>
                                    </div>
                                    <p className="text-text-secondary text-sm mb-3">Métrica: {goal.Metric?.value}</p>
                                    <div className="flex items-center space-x-4 text-text-secondary text-sm mb-3">
                                        <span className="flex items-center gap-1"><Target className="w-4 h-4" /> Alvo: <span className="font-semibold text-text-primary">{goal.Target_Value}</span></span>
                                        <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> Período: <span className="font-semibold text-text-primary">{new Date(goal.Start_Date).toLocaleDateString('pt-BR')} - {new Date(goal.End_Date).toLocaleDateString('pt-BR')}</span></span>
                                    </div>
                                    <p className="text-sm text-text-secondary">Atribuída a: <span className="font-semibold text-text-primary">{goal.Assigned_To.map((s:any) => s.value).join(', ')}</span></p>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-10 text-text-secondary">
                                <Target className="w-10 h-10 mx-auto mb-4" />
                                <p>Nenhuma meta ativa encontrada.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}