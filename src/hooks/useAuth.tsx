// src/hooks/useAuth.tsx
import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { baserowService } from '../lib/baserowService';

export interface AppUser {
  id: number;
  email: string;
  name: string;
  role: 'sdr' | 'administrator';
  organizationId: number;
}

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: { message: string } | null }>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const isUserValid = (user: any): user is AppUser => {
    return user &&
           typeof user.id === 'number' &&
           typeof user.email === 'string' &&
           typeof user.name === 'string' &&
           (user.role === 'sdr' || user.role === 'administrator') &&
           typeof user.organizationId === 'number';
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const savedUserJSON = localStorage.getItem('appUser');
      if (savedUserJSON) {
        const savedUser = JSON.parse(savedUserJSON);
        if (isUserValid(savedUser)) {
          setUser(savedUser);
        } else {
          localStorage.removeItem('appUser');
        }
      }
    } catch (error) {
      localStorage.removeItem('appUser');
    } finally {
      setLoading(false);
    }
  }, []);

  const signIn = async (email: string, password: string) => {
    const result = await baserowService.signIn(email, password);
    if (result && result.user) {
      setUser(result.user);
    }
    return { error: result?.error || null };
  };

  const signOut = () => {
    setUser(null);
    localStorage.removeItem('appUser');
    window.location.href = '/';
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}