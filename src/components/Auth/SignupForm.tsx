// src/components/Auth/SignupForm.tsx

import React, { useState } from 'react';
import { UserPlus, Loader2, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { baserowService } from '../../lib/baserowService';
import toast from 'react-hot-toast';

export function SignupForm() {
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password || !companyName) {
      toast.error("Por favor, preencha todos os campos.");
      return;
    }
    setLoading(true);
    try {
      await baserowService.signUpAdmin({ name, email, password, companyName });
      toast.success("Empresa registada com sucesso! Agora pode fazer o login.");
      navigate('/');
    } catch (err: any) {
      console.error("Erro no registo:", err);
      toast.error(err.message || "Ocorreu um erro ao criar a conta. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-background font-sans">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
            <div className="inline-block bg-primary-light p-3 rounded-2xl mb-4">
                <div className="bg-primary p-3 rounded-xl">
                    <UserPlus className="h-6 w-6 text-white" />
                </div>
            </div>
          <h1 className="text-3xl font-bold text-text-primary">Registe a Sua Empresa</h1>
          <p className="text-text-secondary mt-2">Crie a conta principal para o seu negócio no Copiloto SDR.</p>
        </div>
        <div className="bg-surface p-8 rounded-2xl shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="companyName" className="block text-sm font-medium text-text-primary mb-1">Nome da Empresa</label>
              <input
                id="companyName" type="text" required value={companyName} onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-4 py-3 bg-background border border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="O nome da sua empresa"
              />
            </div>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-text-primary mb-1">Seu Nome Completo</label>
              <input
                id="name" type="text" required value={name} onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-background border border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="O seu nome"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-text-primary mb-1">Seu Email de Trabalho</label>
              <input
                id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-background border border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="seu.email@empresa.com"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-text-primary mb-1">Senha</label>
              <input
                id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-background border border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Crie uma senha segura"
              />
            </div>
            <button
              type="submit" disabled={loading}
              className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-base font-semibold text-white bg-primary hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 transition-all duration-300"
            >
              {loading ? (
                <><Loader2 className="animate-spin h-5 w-5" />A criar conta...</>
              ) : (
                <>Criar Conta<ArrowRight className="h-5 w-5" /></>
              )}
            </button>
          </form>
        </div>
        <p className="text-center text-sm text-text-secondary mt-6">
          Já tem uma conta?{' '}
          <Link to="/" className="font-semibold text-primary hover:underline">
            Faça o login
          </Link>
        </p>
      </div>
    </div>
  );
}