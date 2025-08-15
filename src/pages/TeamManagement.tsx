// src/pages/TeamManagement.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { baserowService } from '../lib/baserowService';
import { Users, Mail, Plus, Loader2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface TeamMember {
  id: number;
  name: string;
  email: string;
}

export function TeamManagement() {
  const { user } = useAuth();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePassword, setInvitePassword] = useState('');
  const [isInviting, setIsInviting] = useState(false);

  const fetchTeamData = useCallback(async () => {
    if (user?.role === 'administrator') {
      setLoading(true);
      try {
        const sdrs = await baserowService.getAllSDRs(user.id);
        setTeamMembers(sdrs);
      } catch (error) {
        console.error("Erro ao buscar dados da equipe:", error);
        toast.error("Não foi possível carregar os dados da equipe.");
      } finally {
        setLoading(false);
      }
    }
  }, [user]);

  useEffect(() => {
    fetchTeamData();
  }, [fetchTeamData]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail || !inviteName || !invitePassword || !user) return;
    setIsInviting(true);

    try {
      const existingUser = await baserowService.getUserByEmail(inviteEmail);
      if (existingUser) {
        toast.error("Um usuário com este e-mail já existe.");
        setIsInviting(false);
        return;
      }
      
      await baserowService.createUser({
        name: inviteName,
        email: inviteEmail,
        password: invitePassword, // Senha definida pelo admin
        role: 'sdr',
        managerId: user.id,
      });

      toast.success(`${inviteName} foi cadastrado com sucesso!`);
      setInviteName('');
      setInviteEmail('');
      setInvitePassword('');
      fetchTeamData(); 
    
    } catch (error) {
      console.error("Erro ao cadastrar membro:", error);
      toast.error("Falha ao cadastrar novo SDR.");
    } finally {
      setIsInviting(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-center text-gray-500">Carregando equipe...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Gerenciar Equipe</h1>
        <p className="text-gray-600">Cadastre novos SDRs e veja os membros da sua equipe.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Cadastrar Novo SDR</h3>
        <form onSubmit={handleInvite} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="inviteName" className="block text-sm font-medium text-gray-700">Nome</label>
              <input id="inviteName" type="text" value={inviteName} onChange={(e) => setInviteName(e.target.value)} placeholder="Nome do SDR" required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"/>
            </div>
            <div>
              <label htmlFor="inviteEmail" className="block text-sm font-medium text-gray-700">Email</label>
              <input id="inviteEmail" type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="email@empresa.com" required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"/>
            </div>
            <div>
              <label htmlFor="invitePassword" className="block text-sm font-medium text-gray-700">Senha Inicial</label>
              <input id="invitePassword" type="password" value={invitePassword} onChange={(e) => setInvitePassword(e.target.value)} placeholder="Senha para o primeiro acesso" required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"/>
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isInviting || !inviteEmail || !inviteName || !invitePassword}
              className="flex justify-center items-center space-x-2 w-full md:w-auto bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isInviting ? <Loader2 className="w-5 h-5 animate-spin"/> : <Plus className="w-5 h-5" />}
              <span>{isInviting ? 'Cadastrando...' : 'Cadastrar SDR'}</span>
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center">
            <Users className="w-5 h-5 mr-2" />
            Membros da Equipe ({teamMembers.length})
          </h3>
        </div>
        <ul>
          {teamMembers.map((member) => (
            <li key={member.id} className="flex items-center justify-between p-4 border-b last:border-b-0 hover:bg-gray-50">
              <div>
                <p className="font-medium text-gray-900">{member.name}</p>
                <p className="text-sm text-gray-500 flex items-center"><Mail className="w-4 h-4 mr-2" />{member.email}</p>
              </div>
              <button className="text-red-500 hover:text-red-700 p-2 rounded-md hover:bg-red-50">
                <Trash2 className="w-5 h-5" />
              </button>
            </li>
          ))}
        </ul>
        {teamMembers.length === 0 && (
          <p className="text-center py-8 text-gray-500">Você ainda não cadastrou nenhum SDR.</p>
        )}
      </div>
    </div>
  );
}