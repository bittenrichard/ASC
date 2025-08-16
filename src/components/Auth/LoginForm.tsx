// src/components/Auth/LoginForm.tsx

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { LogIn, Loader2, ArrowRight } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.tsx';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error: signInError } = await signIn(email, password);
    if (signInError) {
      setError(signInError.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-background font-sans">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
            <div className="inline-block bg-primary-light p-3 rounded-2xl mb-4">
                <div className="bg-primary p-3 rounded-xl">
                    <LogIn className="h-6 w-6 text-white" />
                </div>
            </div>
          <h1 className="text-3xl font-bold text-text-primary">Bem-vindo de Volta!</h1>
          <p className="text-text-secondary mt-2">Entre na sua conta para continuar.</p>
        </div>
        <div className="bg-surface p-8 rounded-2xl shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-text-primary mb-1">
                Endereço de email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-background border border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="seu.email@empresa.com"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-text-primary mb-1">
                Senha
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-background border border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Digite a sua senha"
              />
            </div>
            {error && (
              <div className="text-red-500 text-sm text-center bg-red-100 p-3 rounded-lg">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-base font-semibold text-white bg-primary hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 transition-all duration-300"
            >
              {loading ? (
                <><Loader2 className="animate-spin h-5 w-5" />A entrar...</>
              ) : (
                <>Entrar<ArrowRight className="h-5 w-5" /></>
              )}
            </button>
          </form>
        </div>
        <p className="text-center text-sm text-text-secondary mt-6">
          Não tem uma conta?{' '}
          <Link to="/signup" className="font-semibold text-primary hover:underline">
            Registe a sua empresa
          </Link>
        </p>
      </div>
    </div>
  );
}