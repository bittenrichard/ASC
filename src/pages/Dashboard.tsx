import React, { useState, useEffect } from 'react'
import { 
  TrendingUp, 
  Phone, 
  Clock, 
  Target,
  Users,
  Award
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { mockDataService } from '../lib/mockData'
import { MetricCard } from '../components/Dashboard/MetricCard'
import { CallsTable } from '../components/Dashboard/CallsTable'

export function Dashboard() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState({
    avgScore: 0,
    avgTalkRatio: '0/100',
    totalCalls: 0,
    analyzedCalls: 0,
    teamSize: 0,
    topPerformer: ''
  })
  const [recentCalls, setRecentCalls] = useState([])

  useEffect(() => {
    fetchDashboardData()
  }, [user])

  const fetchDashboardData = async () => {
    if (!user) return

    try {
      if (user.role === 'manager') {
        const teamMetrics = await mockDataService.getTeamMetrics()
        setMetrics(teamMetrics)
        
        const allCalls = await mockDataService.getCallRecordings()
        const formattedCalls = allCalls.slice(0, 10).map(call => ({
          call_id: call.call_id,
          prospect_name: call.prospect_name,
          call_date: call.call_date,
          efficiency_score: getCallScore(call.call_id),
          status: call.status,
          sdr_name: call.sdr_name,
          call_duration_seconds: call.call_duration_seconds
        }))
        setRecentCalls(formattedCalls)
      } else {
        const sdrMetrics = await mockDataService.getSDRMetrics(user.id)
        setMetrics({
          ...sdrMetrics,
          teamSize: 0,
          topPerformer: ''
        })
        
        const sdrCalls = await mockDataService.getCallRecordings(user.id)
        const formattedCalls = sdrCalls.slice(0, 10).map(call => ({
          call_id: call.call_id,
          prospect_name: call.prospect_name,
          call_date: call.call_date,
          efficiency_score: getCallScore(call.call_id),
          status: call.status,
          call_duration_seconds: call.call_duration_seconds
        }))
        setRecentCalls(formattedCalls)
      }
    } catch (error) {
      console.error('Erro ao buscar dados do dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const getCallScore = (callId: string) => {
    return mockDataService.getCallScoreSync(callId)
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {user?.role === 'manager' ? 'Dashboard da Equipe' : 'Meu Dashboard'}
        </h1>
        <p className="text-gray-600">
          {user?.role === 'manager' 
            ? 'Visão geral do desempenho da sua equipe e métricas de chamadas'
            : 'Visão geral do seu desempenho e análises de chamadas'
          }
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Pontuação Média"
          value={metrics.avgScore}
          change={metrics.avgScore >= 75 ? '+5%' : '-2%'}
          changeType={metrics.avgScore >= 75 ? 'positive' : 'negative'}
          icon={TrendingUp}
          iconColor="text-blue-600"
        />
        
        <MetricCard
          title="Proporção Fala/Escuta"
          value={metrics.avgTalkRatio}
          icon={Clock}
          iconColor="text-green-600"
        />
        
        <MetricCard
          title="Total de Chamadas"
          value={metrics.totalCalls}
          change="+12%"
          changeType="positive"
          icon={Phone}
          iconColor="text-purple-600"
        />

        {user?.role === 'manager' ? (
          <MetricCard
            title="Tamanho da Equipe"
            value={metrics.teamSize}
            icon={Users}
            iconColor="text-orange-600"
          />
        ) : (
          <MetricCard
            title="Chamadas Analisadas"
            value={metrics.analyzedCalls}
            icon={Target}
            iconColor="text-red-600"
          />
        )}
      </div>

      {/* Top Performer Card (Manager only) */}
      {user?.role === 'manager' && metrics.topPerformer && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
          <div className="flex items-center space-x-3">
            <Award className="h-6 w-6 text-blue-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Melhor Desempenho</h3>
              <p className="text-blue-600 font-medium">{metrics.topPerformer}</p>
            </div>
          </div>
        </div>
      )}

      {/* Recent Calls Table */}
      <CallsTable calls={recentCalls} showSDRColumn={user?.role === 'manager'} />
    </div>
  )
}