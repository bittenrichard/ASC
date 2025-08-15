import React from 'react'
import { NavLink } from 'react-router-dom'
import { 
  BarChart3, 
  Phone, 
  Users, 
  TrendingUp, 
  LogOut,
  Trophy
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

export function Sidebar() {
  const { user, signOut } = useAuth()

  const sdrNavItems = [
    { to: '/dashboard', icon: BarChart3, label: 'Dashboard' },
    { to: '/calls', icon: Phone, label: 'Minhas Chamadas' },
  ]

  const managerNavItems = [
    { to: '/dashboard', icon: BarChart3, label: 'Dashboard da Equipe' },
    { to: '/calls', icon: Phone, label: 'Todas as Chamadas' },
    { to: '/leaderboard', icon: Trophy, label: 'Ranking' },
    { to: '/team', icon: Users, label: 'Gerenciar Equipe' },
  ]

  const navItems = user?.role === 'manager' ? managerNavItems : sdrNavItems

  return (
    <div className="bg-gray-900 text-white w-64 min-h-screen flex flex-col">
      <div className="p-6">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-600 rounded-lg p-2">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold">Analisador de Chamadas</h1>
            <p className="text-gray-400 text-sm">
              {user?.role === 'manager' ? 'Gerente de Vendas' : 'Dashboard SDR'}
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`
            }
          >
            <item.icon className="h-5 w-5" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-700">
        <div className="text-sm text-gray-400 mb-3">
          <p className="font-medium text-white">{user?.name}</p>
          <p>{user?.email}</p>
        </div>
        <button
          onClick={() => signOut()}
          className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
        >
          <LogOut className="h-4 w-4" />
          <span>Sair</span>
        </button>
      </div>
    </div>
  )
}