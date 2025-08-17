// src/pages/Goals.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { baserowService, AppUserObject, GoalData, FIELD_IDS } from '../lib/baserowService';
import { Plus, Loader2, Target } from 'lucide-react';
import toast from 'react-hot-toast';
import { GoalCard } from '../components/Dashboard/Goals/GoalCard';
import { GoalModal } from '../components/Goals/GoalModal'; // CAMINHO CORRIGIDO

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
  const [metricOptions, setMetricOptions] = useState<{id: number, value: string}[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'edit' | 'delete'>('edit');
  const [selectedGoal, setSelectedGoal] = useState<GoalData | null>(null);
  
  const fetchGoalsData = useCallback(async () => {
    if (!user?.organizationId) return;
    setLoading(true);
    try {
      const [goalsData, sdrsData, metricsData] = await Promise.all([
        baserowService.getGoals(user.organizationId),
        baserowService.getAllSDRs(user.organizationId),
        baserowService.getMetricOptions(),
      ]);
      setGoals(goalsData);
      setSdrs(sdrsData);
      setMetricOptions(metricsData);
      if (metricsData.length > 0 && !form.metric) {
        setForm(prev => ({...prev, metric: metricsData[0].value}));
      }
    } catch (error) {
      toast.error("Não foi possível carregar os dados de metas.");
    } finally {
      setLoading(false);
    }
  }, [user, form.metric]);

  useEffect(() => {
    fetchGoalsData();
  }, [fetchGoalsData]);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.organizationId || !form.metric) return;
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
      toast.error(error.message || "Não foi possível criar a meta.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (goal: GoalData) => {
    setSelectedGoal(goal);
    setModalMode('delete');
    setIsModalOpen(true);
  };

  const handleEditClick = (goal: GoalData) => {
    setSelectedGoal(goal);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleModalConfirm = async (mode: 'edit' | 'delete', data?: any) => {
    if (!selectedGoal) return;
    setIsSubmitting(true);
    
    try {
        if (mode === 'delete') {
            await baserowService.deleteGoal(selectedGoal.id);
            toast.success(`Meta "${selectedGoal.name}" excluída com sucesso!`);
        } else if (mode === 'edit' && data) {
            const dataToUpdate: any = {
              [FIELD_IDS.goals.name]: data.name,
              [FIELD_IDS.goals.targetValue]: Number(data.targetValue),
              [FIELD_IDS.goals.assignedTo]: data.sdrId === 'team' ? [] : [parseInt(data.sdrId)],
            };
            await baserowService.updateGoal(selectedGoal.id, dataToUpdate);
            toast.success(`Meta "${selectedGoal.name}" atualizada com sucesso!`);
        }
    } catch (error) {
        toast.error(`Não foi possível ${mode === 'delete' ? 'excluir' : 'atualizar'} a meta.`);
    } finally {
        setIsSubmitting(false);
        setIsModalOpen(false);
        setSelectedGoal(null);
        fetchGoalsData();
    }
  };

  if (loading) return <div className="p-8 text-center">A carregar metas...</div>;

  return (
    <>
      <GoalModal 
        isOpen={isModalOpen}
        mode={modalMode}
        goal={selectedGoal}
        sdrs={sdrs}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleModalConfirm}
        isSubmitting={isSubmitting}
      />
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
                          goals.map(goal => (
                              <GoalCard 
                                  key={goal.id} 
                                  goal={goal} 
                                  onEdit={handleEditClick}
                                  onDelete={handleDeleteClick}
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
                    <select
                        id="metric" name="metric" value={form.metric}
                        onChange={handleFormChange} required
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
    </>
  );
}