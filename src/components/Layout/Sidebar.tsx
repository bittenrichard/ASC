// src/components/Layout/Sidebar.tsx
import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { BarChart3, Phone, Users, LogOut, Trophy, Target } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export function Sidebar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = () => {
    signOut();
    navigate('/');
  };

  const adminNavItems = [
    { to: '/dashboard', icon: BarChart3, label: 'Dashboard' },
    { to: '/goals', icon: Target, label: 'Metas' }, // Novo item de navegação
    { to: '/calls', icon: Phone, label: 'Chamadas' },
    { to: '/leaderboard', icon: Trophy, label: 'Ranking' },
    { to: '/team', icon: Users, label: 'Equipe' },
  ];

  const sdrNavItems = [
    { to: '/dashboard', icon: BarChart3, label: 'Dashboard' },
    { to: '/calls', icon: Phone, label: 'Minhas Chamadas' },
  ];

  const navItems = user?.role === 'administrator' ? adminNavItems : sdrNavItems;

  return (
    <aside className="w-64 min-h-screen bg-surface flex flex-col p-4 shadow-lg">
      <div className="flex items-center gap-3 p-4 mb-6">
        <div className="bg-primary p-3 rounded-xl">
          <BarChart3 className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-text-primary">Copiloto SDR</h1>
          <p className="text-xs text-text-secondary">
            {user?.role === 'administrator' ? 'Painel Admin' : 'Painel SDR'}
          </p>
        </div>
      </div>

      <nav className="flex-1 flex flex-col gap-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-200 ${
                isActive
                  ? 'bg-primary text-white shadow-md'
                  : 'text-text-secondary hover:bg-background hover:text-text-primary'
              }`
            }
          >
            <item.icon className="h-5 w-5" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto">
        <div className="p-4 bg-background rounded-lg text-center mb-4">
          <p className="font-semibold text-sm text-text-primary truncate">{user?.name}</p>
          <p className="text-xs text-text-secondary truncate">{user?.email}</p>
        </div>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold bg-surface text-text-secondary hover:bg-red-50 hover:text-red-600 transition-colors duration-200"
        >
          <LogOut className="h-5 w-5" />
          <span>Sair</span>
        </button>
      </div>
    </aside>
  );
}