// src/pages/Playbook.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { baserowService, Playbook } from '../lib/baserowService';
import { Book, Plus, Edit, Trash2, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export function PlaybookPage() {
  const { user } = useAuth();
  const [playbooks, setPlaybooks] = useState<Playbook[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlaybook, setSelectedPlaybook] = useState<Playbook | null>(null);

  const fetchPlaybooks = useCallback(async () => {
    if (!user?.organizationId) return;
    setLoading(true);
    try {
      const data = await baserowService.getPlaybooksByOrg(user.organizationId);
      setPlaybooks(data);
      if (data.length > 0) {
        setSelectedPlaybook(data[0]);
      }
    } catch (error) {
      toast.error("Falha ao carregar os playbooks.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPlaybooks();
  }, [fetchPlaybooks]);
  
  const handleCreatePlaybook = async () => {
    const name = prompt("Qual o nome do novo playbook?");
    if (name && user?.organizationId) {
        try {
            await baserowService.createPlaybook(name, user.organizationId);
            toast.success("Playbook criado com sucesso!");
            fetchPlaybooks();
        } catch (error) {
            toast.error("Não foi possível criar o playbook.");
        }
    }
  }

  if (loading) {
    return <div className="p-8 text-center">A carregar playbooks...</div>;
  }

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-text-primary">Playbooks de Vendas</h1>
        <p className="text-text-secondary mt-1">Crie e gira os guias de conversação para sua equipe.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <aside className="md:col-span-1">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-lg">Meus Playbooks</h2>
            <button onClick={handleCreatePlaybook} className="p-2 text-primary hover:bg-primary/10 rounded-full">
                <Plus className="w-5 h-5"/>
            </button>
          </div>
          <nav className="space-y-2">
            {playbooks.map(pb => (
              <button
                key={pb.id}
                onClick={() => setSelectedPlaybook(pb)}
                className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  selectedPlaybook?.id === pb.id
                    ? 'bg-primary text-white shadow-md'
                    : 'text-text-secondary hover:bg-background hover:text-text-primary'
                }`}
              >
                <Book className="h-5 w-5" />
                <span>{pb.name}</span>
              </button>
            ))}
          </nav>
        </aside>

        <main className="md:col-span-3">
          {selectedPlaybook ? (
            <div className="bg-surface p-8 rounded-2xl shadow-lg border border-gray-100">
                <h3 className="text-2xl font-bold mb-6">{selectedPlaybook.name}</h3>
                {/* Aqui virá o gerenciamento de regras */}
                <p>Gerenciamento de regras para {selectedPlaybook.name} (a ser implementado).</p>
            </div>
          ) : (
            <div className="text-center p-12 bg-surface rounded-2xl">
              <p>Selecione um playbook para ver as regras ou crie um novo.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}