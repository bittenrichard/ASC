// src/pages/Playbook.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { baserowService, Playbook, PlaybookRule } from '../lib/baserowService';
import { Book, Plus, Trash2, Loader2, ChevronsRight, Edit, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { PlaybookModal } from '../components/Playbook/PlaybookModal';
import { PlaybookRuleModal } from '../components/Playbook/PlaybookRuleModal';

export function PlaybookPage() {
  const { user } = useAuth();
  const [playbooks, setPlaybooks] = useState<Playbook[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPlaybook, setSelectedPlaybook] = useState<Playbook | null>(null);
  const [isPlaybookModalOpen, setIsPlaybookModalOpen] = useState(false);
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<PlaybookRule | null>(null);

  const fetchPlaybooks = useCallback(async (selectFirst = false) => {
    if (!user?.organizationId) return;
    setLoading(true);
    try {
      const data = await baserowService.getPlaybooksByOrg(user.organizationId);
      setPlaybooks(data);
      if (selectFirst && data.length > 0) {
        setSelectedPlaybook(data[0]);
      } else if (data.length > 0 && selectedPlaybook) {
        const updatedSelected = data.find(p => p.id === selectedPlaybook.id);
        setSelectedPlaybook(updatedSelected || (data.length > 0 ? data[0] : null));
      } else {
        setSelectedPlaybook(null);
      }
    } catch (error) {
      toast.error("Falha ao carregar os playbooks.");
    } finally {
      setLoading(false);
    }
  }, [user, selectedPlaybook?.id]);

  useEffect(() => {
    fetchPlaybooks(true);
  }, []);
  
  const handleCreatePlaybook = async (name: string) => {
    if (!name || !user?.organizationId) return;
    setIsSubmitting(true);
    try {
      const newPlaybook = await baserowService.createPlaybook(name, user.organizationId);
      toast.success("Playbook criado com sucesso!");
      await fetchPlaybooks();
      setSelectedPlaybook(newPlaybook);
    } catch (error) {
      toast.error("Não foi possível criar o playbook.");
    } finally {
      setIsSubmitting(false);
      setIsPlaybookModalOpen(false);
    }
  }

  const handleDeletePlaybook = async (playbookId: number, playbookName: string) => {
    if(window.confirm(`Tem certeza que deseja excluir o playbook "${playbookName}"?`)) {
        try {
            await baserowService.deletePlaybook(playbookId);
            toast.success("Playbook excluído com sucesso!");
            setSelectedPlaybook(null);
            await fetchPlaybooks(true);
        } catch(error) {
            toast.error("Falha ao excluir o playbook.");
        }
    }
  }

  const handleSaveRule = async (ruleData: { rule_type: string; keyword_trigger: string; description: string; }) => {
    if (!selectedPlaybook) return;
    setIsSubmitting(true);
    try {
        if (editingRule) {
            await baserowService.updatePlaybookRule(editingRule.id, ruleData);
            toast.success("Regra atualizada com sucesso!");
        } else {
            await baserowService.addPlaybookRule(selectedPlaybook.id, ruleData);
            toast.success("Regra adicionada com sucesso!");
        }
        await fetchPlaybooks();
    } catch (error) {
        toast.error("Não foi possível salvar a regra.");
    } finally {
        setIsSubmitting(false);
        setIsRuleModalOpen(false);
        setEditingRule(null);
    }
  };

  const handleDeleteRule = async (ruleId: number) => {
    if(window.confirm("Tem certeza que deseja excluir esta regra?")) {
        try {
            await baserowService.deletePlaybookRule(ruleId);
            toast.success("Regra excluída com sucesso!");
            await fetchPlaybooks();
        } catch(error) {
            toast.error("Falha ao excluir a regra.");
        }
    }
  };

  if (loading) return <div className="p-8 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto"/></div>;

  return (
    <>
      <PlaybookModal
        isOpen={isPlaybookModalOpen}
        onClose={() => setIsPlaybookModalOpen(false)}
        onSave={handleCreatePlaybook}
        isSubmitting={isSubmitting}
      />
      <PlaybookRuleModal
        isOpen={isRuleModalOpen}
        onClose={() => { setIsRuleModalOpen(false); setEditingRule(null); }}
        onSave={handleSaveRule}
        isSubmitting={isSubmitting}
        initialData={editingRule || undefined}
      />
      <div className="p-8 space-y-8 h-full flex flex-col">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Playbooks de Vendas</h1>
          <p className="text-text-secondary mt-1">Crie e gerencie os guias de conversação para sua equipe.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 flex-1">
          <aside className="md:col-span-1 bg-surface p-4 rounded-2xl border">
            <div className="flex justify-between items-center mb-4 px-2">
              <h2 className="font-bold text-lg">Meus Playbooks</h2>
              <button onClick={() => setIsPlaybookModalOpen(true)} className="p-2 text-primary hover:bg-primary/10 rounded-full">
                  <Plus className="w-5 h-5"/>
              </button>
            </div>
            <nav className="space-y-2">
              {playbooks.map(pb => (
                <button
                  key={pb.id}
                  onClick={() => setSelectedPlaybook(pb)}
                  className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all ${
                    selectedPlaybook?.id === pb.id
                      ? 'bg-primary text-white shadow-md'
                      : 'text-text-secondary hover:bg-background hover:text-text-primary'
                  }`}
                >
                  <Book className="h-5 w-5" />
                  <span className="flex-1 truncate">{pb.name}</span>
                  <ChevronsRight className="h-4 w-4 opacity-50"/>
                </button>
              ))}
            </nav>
          </aside>

          <main className="md:col-span-3">
            {selectedPlaybook ? (
              <div className="bg-surface p-8 rounded-2xl shadow-lg border border-gray-100 h-full">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="text-2xl font-bold truncate">{selectedPlaybook.name}</h3>
                      <div>
                          <button onClick={() => setIsRuleModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-primary text-white font-semibold rounded-lg hover:opacity-90 mr-2">
                              <Plus className="w-5 h-5"/>
                              Adicionar Regra
                          </button>
                          <button onClick={() => handleDeletePlaybook(selectedPlaybook.id, selectedPlaybook.name)} className="p-2 text-red-500 hover:bg-red-50 rounded-full">
                              <Trash2 className="w-5 h-5"/>
                          </button>
                      </div>
                  </div>
                  <div className="space-y-4">
                      {selectedPlaybook.rules && selectedPlaybook.rules.length > 0 ? selectedPlaybook.rules.map(rule => (
                          <div key={rule.id} className="bg-background p-4 rounded-lg border flex justify-between items-center">
                            <div>
                                <p className="font-semibold text-text-primary">{rule.rule_type.value}</p>
                                <p className="text-sm text-text-secondary mt-1">{rule.description}</p>
                                <p className="text-xs mt-2 text-primary/80 font-mono">Gatilhos: {rule.keyword_trigger}</p>
                            </div>
                            <div className="flex gap-2 items-center">
                                <button
                                  onClick={() => { setEditingRule(rule); setIsRuleModalOpen(true); }}
                                  className="p-2 text-text-secondary hover:text-primary transition-colors rounded-full"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteRule(rule.id)}
                                  className="p-2 text-text-secondary hover:text-red-500 transition-colors rounded-full"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                          </div>
                      )) : (
                          <div className="text-center text-text-secondary py-12">
                              <p>Nenhuma regra definida para este playbook.</p>
                              <p>Use o botão "Adicionar Regra" para começar.</p>
                          </div>
                      )}
                  </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-12 bg-surface rounded-2xl h-full border">
                <Book className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-xl font-bold">Nenhum playbook encontrado</h3>
                <p className="text-text-secondary mt-2">Clique no botão "+" para criar seu primeiro playbook.</p>
              </div>
            )}
          </main>
        </div>
      </div>
    </>
  );
}