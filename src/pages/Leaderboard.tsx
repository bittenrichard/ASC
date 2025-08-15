import React, { useState, useEffect } from 'react'
import { Trophy, TrendingUp, Award, Users } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { mockDataService } from '../lib/mockData'

interface LeaderboardEntry {
  sdr_id: string
  name: string
  email: string
  avg_score: number
  total_calls: number
  analyzed_calls: number
  avg_talk_ratio: string
  rank: number
}

export function Leaderboard() {
  const { user } = useAuth()
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [timeframe, setTimeframe] = useState('all')

  useEffect(() => {
    if (user?.role === 'manager') {
      fetchLeaderboard()
    }
  }, [user, timeframe])

  const fetchLeaderboard = async () => {
    try {
      // Dados mock para o ranking
      const mockLeaderboard: LeaderboardEntry[] = [
        {
          sdr_id: '3',
          name: 'Pedro Oliveira',
          email: 'pedro.oliveira@empresa.com',
          avg_score: 92,
          total_calls: 8,
          analyzed_calls: 6,
          avg_talk_ratio: '42/58',
          rank: 1
        },
        {
          sdr_id: '1',
          name: 'João Silva',
          email: 'joao.silva@empresa.com',
          avg_score: 78,
          total_calls: 12,
          analyzed_calls: 10,
          avg_talk_ratio: '52/48',
          rank: 2
        }
      ]

      setLeaderboard(mockLeaderboard)
    } catch (error) {
      console.error('Erro ao buscar ranking:', error)
    } finally {
      setLoading(false)
    }
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-5 w-5 text-yellow-500" />
      case 2:
        return <Award className="h-5 w-5 text-gray-400" />
      case 3:
        return <Award className="h-5 w-5 text-amber-600" />
      default:
        return <span className="w-5 h-5 flex items-center justify-center text-sm font-medium text-gray-500">#{rank}</span>
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50'
    if (score >= 60) return 'text-yellow-600 bg-yellow-50'
    return 'text-red-600 bg-red-50'
  }

  if (user?.role !== 'manager') {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-900">Acesso Negado</h2>
          <p className="text-gray-600 mt-2">Apenas gerentes podem visualizar o ranking.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ranking da Equipe</h1>
          <p className="text-gray-600">Rankings de desempenho e métricas dos SDRs</p>
        </div>

        <div className="flex items-center space-x-4">
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Todo o Período</option>
            <option value="month">Último Mês</option>
            <option value="week">Última Semana</option>
          </select>
        </div>
      </div>

      {/* Top Performers Cards */}
      {leaderboard.length >= 2 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {leaderboard.slice(0, 2).map((entry, index) => {
            const isFirst = index === 0
            const cardClass = isFirst 
              ? 'bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200' 
              : 'bg-white border-gray-200'

            return (
              <div key={entry.sdr_id} className={`rounded-xl shadow-sm border p-6 ${cardClass}`}>
                <div className="flex items-center justify-between mb-4">
                  {getRankIcon(entry.rank)}
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(entry.avg_score)}`}>
                    {entry.avg_score}/100
                  </span>
                </div>
                
                <div>
                  <h3 className={`font-semibold ${isFirst ? 'text-yellow-900' : 'text-gray-900'}`}>
                    {entry.name}
                  </h3>
                  <p className={`text-sm ${isFirst ? 'text-yellow-700' : 'text-gray-600'}`}>
                    {entry.analyzed_calls} chamadas analisadas
                  </p>
                  <p className={`text-xs mt-1 ${isFirst ? 'text-yellow-600' : 'text-gray-500'}`}>
                    Fala/Escuta: {entry.avg_talk_ratio}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Full Leaderboard Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Rankings da Equipe
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Posição
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SDR
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pontuação Média
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total de Chamadas
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Chamadas Analisadas
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Proporção Fala/Escuta
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {leaderboard.map((entry) => (
                <tr key={entry.sdr_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getRankIcon(entry.rank)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{entry.name}</div>
                      <div className="text-sm text-gray-500">{entry.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getScoreColor(entry.avg_score)}`}>
                      <TrendingUp className="h-3 w-3 mr-1" />
                      {entry.avg_score}/100
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {entry.total_calls}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {entry.analyzed_calls}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {entry.avg_talk_ratio}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {leaderboard.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            Nenhum dado disponível para o período selecionado
          </div>
        )}
      </div>
    </div>
  )
}