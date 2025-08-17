// src/pages/TeamManagement.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { baserowService, AppUserObject } from '../lib/baserowService';
import { Mail, Plus, Loader2, Edit, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export function TeamManagement() {
  const { user, loading: authLoading } = useAuth();
  const [teamMembers, setTeamMembers] = useState<AppUserObject[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePassword, setInvitePassword] = useState('');
  const [isInviting, setIsInviting] = useState(false);

  const fetchTeamData = useCallback(async () => {
    if (!user || !user.organizationId) {
        setLoadingData(false);
        return;
    };
    setLoadingData(true);
    try {
      const sdrs = await baserowService.getAllSDRs(user.organizationId);
      setTeamMembers(sdrs);
    } catch (error) {
      console.error("Erro ao buscar dados da equipe:", error);
      toast.error("Não foi possível carregar os dados da equipe.");
    } finally {
      setLoadingData(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading) {
        fetchTeamData();
    }
  }, [authLoading, fetchTeamData]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail || !inviteName || !invitePassword || !user) return;
    setIsInviting(true);
    try {
      await baserowService.createSDR({
        name: inviteName,
        email: inviteEmail,
        password: invitePassword,
        organizationId: user.organizationId,
      });
      toast.success(`${inviteName} foi cadastrado com sucesso!`);
      setInviteName('');
      setInviteEmail('');
      setInvitePassword('');
      fetchTeamData();
    } catch (error: any) {
      console.error("Erro ao cadastrar membro:", error);
      toast.error(error.message || "Falha ao cadastrar novo SDR.");
    } finally {
      setIsInviting(false);
    }
  };

  const handleDelete = async (memberId: number, memberName: string) => {
    if (window.confirm(`Tem a certeza que deseja excluir ${memberName}? Esta ação não pode ser desfeita.`)) {
      try {
        await baserowService.deleteSDR(memberId);
        toast.success(`${memberName} foi excluído com sucesso.`);
        fetchTeamData();
      } catch (error) {
        console.error("Erro ao excluir membro:", error);
        toast.error("Não foi possível excluir o membro.");
      }
    }
  };

  const handleEdit = (member: AppUserObject) => {
    const newName = prompt("Digite o novo nome para:", member.name);
    if (newName && newName.trim() !== '' && newName !== member.name) {
      toast.promise(
        baserowService.updateSDR(member.id, { name: newName }).then(() => {
          fetchTeamData();
        }),
        {
          loading: 'A atualizar...',
          success: 'Nome atualizado com sucesso!',
          error: 'Não foi possível atualizar o nome.',
        }
      );
    }
  };

  if (authLoading || loadingData) {
    return <div className="p-8 text-center text-text-secondary">A carregar equipe...</div>;
  }
  
  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-text-primary">Gerir Equipe</h1>
        <p className="text-text-secondary mt-1">Cadastre novos SDRs e veja os membros da sua equipe.</p>
      </div>
      <div className="bg-surface p-8 rounded-2xl shadow-lg border border-gray-100">
        <h3 className="text-xl font-bold text-text-primary mb-6">Cadastrar Novo SDR</h3>
        <form onSubmit={handleInvite} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label htmlFor="inviteName" className="block text-sm font-medium text-text-primary mb-1">Nome do SDR</label>
              <input id="inviteName" type="text" value={inviteName} onChange={(e) => setInviteName(e.target.value)} placeholder="Nome completo" required className="w-full px-4 py-3 bg-background border border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"/>
            </div>
            <div>
              <label htmlFor="inviteEmail" className="block text-sm font-medium text-text-primary mb-1">Email</label>
              <input id="inviteEmail" type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="email@empresa.com" required className="w-full px-4 py-3 bg-background border border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"/>
            </div>
            <div>
              <label htmlFor="invitePassword" className="block text-sm font-medium text-text-primary mb-1">Senha Inicial</label>
              <input id="invitePassword" type="password" value={invitePassword} onChange={(e) => setInvitePassword(e.target.value)} placeholder="Senha para o primeiro acesso" required className="w-full px-4 py-3 bg-background border border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"/>
            </div>
          </div>
          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={isInviting || !inviteEmail || !inviteName || !invitePassword}
              className="flex justify-center items-center gap-2 py-3 px-6 border border-transparent rounded-lg shadow-sm text-base font-semibold text-white bg-primary hover:opacity-90 focus:outline-none disabled:opacity-50"
            >
              {isInviting ? <Loader2 className="w-5 h-5 animate-spin"/> : <Plus className="w-5 h-5" />}
              <span>{isInviting ? 'A cadastrar...' : 'Cadastrar SDR'}</span>
            </button>
          </div>
        </form>
      </div>
      <div className="bg-surface p-8 rounded-2xl shadow-lg border border-gray-100">
        <h3 className="text-xl font-bold text-text-primary mb-6">Membros da Equipe ({teamMembers.length})</h3>
        <div className="space-y-4">
          {teamMembers.length > 0 ? (
            teamMembers.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-4 bg-background rounded-lg">
                <div>
                  <p className="font-semibold text-text-primary">{member.name}</p>
                  <p className="text-sm text-text-secondary flex items-center gap-2"><Mail className="w-4 h-4" />{member.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleEdit(member)} className="p-2 text-text-secondary hover:text-primary transition-colors">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(member.id, member.name)} className="p-2 text-text-secondary hover:text-red-500 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center py-8 text-text-secondary">Você ainda não cadastrou nenhum SDR.</p>
          )}
        </div>
      </div>
    </div>
  );
}