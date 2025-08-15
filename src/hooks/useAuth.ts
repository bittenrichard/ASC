// src/hooks/useAuth.ts

import { useState, useEffect } from 'react';
import { baserowService, type BaserowUser } from '../lib/baserowService';

// Re-exportando o tipo para uso em outros componentes
export type { BaserowUser as AuthUser };
export type UserRole = 'sdr' | 'manager' | null;

// Definindo um tipo mais simples para o usuário logado na aplicação
export interface AppUser {
  id: number;
  email: string;
  name: string;
  role: UserRole;
}

// Hook de autenticação refatorado
export function useAuth() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Tenta recuperar o usuário do localStorage ao iniciar a aplicação
    try {
      const savedUser = localStorage.getItem('appUser');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    } catch (error) {
      console.error("Falha ao carregar usuário do localStorage:", error);
      localStorage.removeItem('appUser');
    } finally {
      setLoading(false);
    }
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      // Por enquanto, a senha é fixa. A validação principal é se o email existe.
      if (password !== 'senha123') {
        return { error: { message: 'Senha incorreta.' } };
      }

      const baserowUser = await baserowService.getUserByEmail(email);

      if (baserowUser) {
        const appUser: AppUser = {
          id: baserowUser.id,
          email: baserowUser.email,
          name: baserowUser.name,
          role: baserowUser.role.value,
        };
        
        localStorage.setItem('appUser', JSON.stringify(appUser));
        setUser(appUser);
        return { error: null };
      } else {
        return { error: { message: 'Usuário não encontrado.' } };
      }
    } catch (err) {
      console.error("Erro no processo de signIn:", err);
      return { error: { message: 'Ocorreu um erro inesperado durante o login.' } };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setUser(null);
    localStorage.removeItem('appUser');
    // Não há necessidade de retornar um objeto, a ação é síncrona no lado do cliente
  };

  return {
    user,
    loading,
    signIn,
    signOut,
  };
}