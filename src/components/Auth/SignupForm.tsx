// src/components/Auth/SignupForm.tsx

import React, { useState } from 'react';
import { UserPlus, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { baserowService } from '../../lib/baserowService';
import toast from 'react-hot-toast';

export function SignupForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      toast.error("Por favor, preencha todos os campos.");
      return;
    }
    setLoading(true);

    try {
      const existingUser = await baserowService.getUserByEmail(email);
      if (existingUser) {
        toast.error("Este endereço de e-mail já está em uso.");
        setLoading(false);
        return;
      }
      
      // Toda nova conta criada por este formulário será um 'administrator'
      await baserowService.createUser({
        name,
        email,
        role: 'administrator', // Role fixo
        password,
      });

      toast.success("Conta de Administrador criada com sucesso! Você já pode fazer o login.");
      navigate('/'); 

    } catch (err) {
      console.error("Erro no cadastro:", err);
      toast.error("Ocorreu um erro ao criar a conta. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="mx-auto h-12 w-12 bg-blue-600 rounded-lg flex items-center justify-center mb-4">
              <UserPlus className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900">Criar Conta de Administrador</h2>
            <p className="mt-2 text-gray-600">Junte-se ao Analisador de Chamadas SDR</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">Seu Nome Completo</label>
              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500"
                placeholder="Seu nome"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Seu Email de Trabalho</label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500"
                placeholder="seu.email@empresa.com"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">Senha</label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500"
                placeholder="Crie uma senha segura"
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" /> : 'Criar Conta'}
            </button>

            <p className="text-center text-sm text-gray-600">
              Já tem uma conta?{' '}
              <Link to="/" className="font-medium text-blue-600 hover:text-blue-500">
                Faça o login
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}