// src/pages/Goals.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { baserowService, AppUserObject, GoalData } from '../lib/baserowService';
import { Plus, Loader2, Target, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import { GoalCard } from '../components/Dashboard/Goals/GoalCard'; // Importamos o GoalCard

const initialFormState = {
  name: '',
  metric: '',
  targetValue: '',
  startDate: '',
  endDate: '',
  sdrId: 'team',
};

export function Goals() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<GoalData[]>([]);
  const [sdrs, setSdrs] = useState<AppUserObject[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [metricOptions, setMetricOptions] = useState<{id: number, value: string}[]>([]); // Estado para as opções de métrica

  const fetchGoalsData = useCallback(async () => {
    if (!user?.organizationId) return;
    setLoading(true);
    try {
      const [goalsData, sdrsData, metricsData] = await Promise.all([
        baserowService.getGoals(user.organizationId),
        baserowService.getAllSDRs(user.organizationId),
        baserowService.getMetricOptions(), // Buscamos as opções de métrica
      ]);
      setGoals(goalsData);
      setSdrs(sdrsData);
      setMetricOptions(metricsData);
      if (metricsData.length > 0) {
        setForm(prev => ({...prev, metric: metricsData[0].value})); // Pré-seleciona a primeira métrica
      }
    } catch (error) {
      console.error("Erro ao buscar dados de metas:", error);
      toast.error("Não foi possível carregar os dados de metas.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchGoalsData();
  }, [fetchGoalsData]);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.organizationId || !form.metric) {
        toast.error("Por favor, selecione uma métrica válida.");
        return;
    };
    setIsSubmitting(true);
    try {
      await baserowService.createGoal({
        ...form,
        targetValue: Number(form.targetValue),
        organizationId: user.organizationId,
      });
      toast.success("Meta criada com sucesso!");
      setForm(initialFormState);
      fetchGoalsData();
    } catch (error: any) {
      console.error("Erro ao criar meta:", error);
      toast.error(error.message || "Não foi possível criar a meta.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // NOVA FUNÇÃO PARA EXCLUIR
  const handleDeleteGoal = async (goalId: number, goalName: string) => {
    if (window.confirm(`Tem certeza que deseja excluir a meta "${goalName}"?`)) {
      try {
        await baserowService.deleteGoal(goalId);
        toast.success(`Meta "${goalName}" excluída com sucesso!`);
        fetchGoalsData(); // Atualiza a lista
      } catch (error) {
        toast.error("Não foi possível excluir a meta.");
      }
    }
  };

  // NOVA FUNÇÃO PARA EDITAR (usando prompt para simplicidade)
  const handleEditGoal = async (goal: GoalData) => {
    const newTargetValue = prompt(`Editar valor alvo para a meta "${goal.name}":`, goal.targetValue.toString());
    if (newTargetValue && !isNaN(Number(newTargetValue))) {
      try {
        await baserowService.updateGoal(goal.id, {
          // O nome do campo no Baserow é field_xxxxx
          [FIELD_IDS.goals.targetValue]: Number(newTargetValue),
        });
        toast.success(`Meta "${goal.name}" atualizada com sucesso!`);
        fetchGoalsData();
      } catch (error) {
        toast.error("Não foi possível atualizar a meta.");
      }
    }
  };


  if (loading) {
    return <div className="p-8 text-center text-text-secondary">A carregar metas...</div>;
  }

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-text-primary">Central de Metas</h1>
        <p className="text-text-secondary mt-1">Defina e acompanhe os objetivos da sua equipe e individuais.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
            <div className="bg-surface p-8 rounded-2xl shadow-lg border border-gray-100">
                <h3 className="text-xl font-bold text-text-primary mb-6">Metas Ativas</h3>
                <div className="space-y-4">
                    {goals.length > 0 ? (
                        // RENDERIZAÇÃO ATUALIZADA USANDO GoalCard
                        goals.map(goal => (
                            <GoalCard 
                                key={goal.id} 
                                goal={goal} 
                                onEdit={handleEditGoal}
                                onDelete={handleDeleteGoal}
                            />
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

        <div className="lg:col-span-1 bg-surface p-8 rounded-2xl shadow-lg border border-gray-100 h-fit">
            <h3 className="text-xl font-bold text-text-primary mb-6">Criar Nova Meta</h3>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-text-primary mb-1">Nome da Meta</label>
                    <input id="name" name="name" type="text" value={form.name} onChange={handleFormChange} placeholder="Ex: Agendamentos de Agosto" required className="w-full px-4 py-3 bg-background border border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"/>
                </div>
                <div>
                    <label htmlFor="metric" className="block text-sm font-medium text-text-primary mb-1">Métrica</label>
                    {/* CAMPO DE MÉTRICA ATUALIZADO PARA DROPDOWN */}
                    <select
                        id="metric"
                        name="metric"
                        value={form.metric}
                        onChange={handleFormChange}
                        required
                        className="w-full px-4 py-3 bg-background border border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                        <option value="" disabled>Selecione uma métrica</option>
                        {metricOptions.map(option => <option key={option.id} value={option.value}>{option.value}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="targetValue" className="block text-sm font-medium text-text-primary mb-1">Valor Alvo</label>
                    <input id="targetValue" name="targetValue" type="number" value={form.targetValue} onChange={handleFormChange} placeholder="Ex: 50" required className="w-full px-4 py-3 bg-background border border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"/>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="startDate" className="block text-sm font-medium text-text-primary mb-1">Data de Início</label>
                        <input id="startDate" name="startDate" type="date" value={form.startDate} onChange={handleFormChange} required className="w-full px-4 py-3 bg-background border border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"/>
                    </div>
                    <div>
                        <label htmlFor="endDate" className="block text-sm font-medium text-text-primary mb-1">Data de Fim</label>
                        <input id="endDate" name="endDate" type="date" value={form.endDate} onChange={handleFormChange} required className="w-full px-4 py-3 bg-background border border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"/>
                    </div>
                </div>
                <div>
                    <label htmlFor="sdrId" className="block text-sm font-medium text-text-primary mb-1">Atribuir a</label>
                    <select id="sdrId" name="sdrId" value={form.sdrId} onChange={handleFormChange} className="w-full px-4 py-3 bg-background border border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
                        <option value="team">Equipe Inteira</option>
                        {sdrs.map(sdr => <option key={sdr.id} value={sdr.id}>{sdr.name}</option>)}
                    </select>
                </div>
                <button type="submit" disabled={isSubmitting} className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-base font-semibold text-white bg-primary hover:opacity-90 focus:outline-none disabled:opacity-50">
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                    <span>{isSubmitting ? 'A criar...' : 'Criar Meta'}</span>
                </button>
            </form>
        </div>
      </div>
    </div>
  );
}