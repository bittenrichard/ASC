// src/hooks/useAuth.ts
import { useState, useEffect } from 'react';
import { baserowService, type BaserowUser } from '../lib/baserowService';
import bcrypt from 'bcryptjs';

export type { BaserowUser as AuthUser };
export type UserRole = 'sdr' | 'administrator' | null;

export interface AppUser {
  id: number;
  email: string;
  name: string;
  role: UserRole;
}

export function useAuth() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
      const baserowUser = await baserowService.getUserByEmail(email);
      if (!baserowUser || !baserowUser.password_hash) {
        return { error: { message: 'Email ou senha incorretos.' } };
      }
      const isPasswordCorrect = await bcrypt.compare(password, baserowUser.password_hash);
      if (isPasswordCorrect) {
        const userRole = (baserowUser.role && baserowUser.role.length > 0)
          ? (baserowUser.role[0].value as UserRole)
          : null;

        const appUser: AppUser = {
          id: baserowUser.id,
          email: baserowUser.email,
          name: baserowUser.name,
          role: userRole,
        };

        localStorage.setItem('appUser', JSON.stringify(appUser));
        setUser(appUser); // <-- Esta linha atualiza o estado
        return { error: null };
      } else {
        return { error: { message: 'Email ou senha incorretos.' } };
      }
    } catch (err) {
      console.error("Erro no processo de signIn:", err);
      return { error: { message: 'Ocorreu um erro inesperado.' } };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setUser(null);
    localStorage.removeItem('appUser');
    window.location.reload(); // Garante a limpeza total
  };

  return { user, loading, signIn, signOut };
}