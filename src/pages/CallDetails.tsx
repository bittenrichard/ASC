import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, 
  Play, 
  Pause, 
  Clock, 
  TrendingUp, 
  MessageCircle,
  User,
  Calendar,
  Save
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { mockDataService } from '../lib/mockData'

export function CallDetails() {
  const { callId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [call, setCall] = useState(null)
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isPlaying, setIsPlaying] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [savingFeedback, setSavingFeedback] = useState(false)

  useEffect(() => {
    fetchCallDetails()
  }, [callId])

  const fetchCallDetails = async () => {
    if (!callId) return

    try {
      const callData = await mockDataService.getCallRecording(callId)
      const analysisData = await mockDataService.getCallAnalysis(callId)

      if (callData) {
        setCall(callData)
        if (analysisData) {
          setAnalysis(analysisData)
          setFeedback(analysisData.manager_feedback || '')
        }
      }
    } catch (error) {
      console.error('Erro ao buscar detalhes da chamada:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveFeedback = async () => {
    if (!analysis?.analysis_id || user?.role !== 'manager') return

    setSavingFeedback(true)
    try {
      const success = await mockDataService.updateManagerFeedback(analysis.analysis_id, feedback)
      if (success) {
        setAnalysis({ ...analysis, manager_feedback: feedback })
      }
    } catch (error) {
      console.error('Erro ao salvar feedback:', error)
    } finally {
      setSavingFeedback(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50 border-green-200'
    if (score >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    return 'text-red-600 bg-red-50 border-red-200'
  }

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'Positivo':
        return 'text-green-600 bg-green-50'
      case 'Negativo':
        return 'text-red-600 bg-red-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const formatTranscript = (transcript: string) => {
    return transcript.split('\n').map((line, index) => {
      const isSDR = line.startsWith('SDR:')
      const isProspect = line.startsWith('Prospecto:')
      
      return (
        <div key={index} className={`mb-3 ${isSDR ? 'ml-4' : isProspect ? 'mr-4' : ''}`}>
          <span className={`inline-block px-3 py-1 rounded-lg text-sm ${
            isSDR 
              ? 'bg-blue-50 text-blue-800 font-medium' 
              : isProspect 
                ? 'bg-gray-50 text-gray-800'
                : 'text-gray-700'
          }`}>
            {line}
          </span>
        </div>
      )
    })
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

  if (!call) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-900">Chamada não encontrada</h2>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 text-blue-600 hover:text-blue-800"
          >
            Voltar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{call.prospect_name}</h1>
            <p className="text-gray-600">Detalhes e Análise da Chamada</p>
          </div>
        </div>

        {analysis && (
          <div className={`px-4 py-2 rounded-lg border-2 ${getScoreColor(analysis.efficiency_score)}`}>
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span className="text-2xl font-bold">{analysis.efficiency_score}</span>
              <span className="text-sm">/100</span>
            </div>
          </div>
        )}
      </div>

      {/* Call Info Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="flex items-center space-x-3">
            <User className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">SDR</p>
              <p className="font-medium">{call.sdr_name || 'N/A'}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Calendar className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">Data</p>
              <p className="font-medium">{new Date(call.call_date).toLocaleDateString('pt-BR')}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Clock className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">Duração</p>
              <p className="font-medium">{formatDuration(call.call_duration_seconds)}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <MessageCircle className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                call.status === 'Analisada' ? 'bg-green-50 text-green-600' : 'bg-yellow-50 text-yellow-600'
              }`}>
                {call.status}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Audio Player */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4">Gravação de Áudio</h3>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex items-center justify-center w-12 h-12 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
          >
            {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-1" />}
          </button>
          <div className="flex-1">
            <div className="bg-gray-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full" style={{ width: '30%' }}></div>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Reprodução de áudio seria implementada com a URL real do arquivo de áudio
            </p>
          </div>
        </div>
      </div>

      {/* Analysis Metrics */}
      {analysis && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Proporção Fala/Escuta</h3>
            <p className="text-2xl font-bold text-gray-900">{analysis.talk_listen_ratio}</p>
            <div className="mt-3 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full" 
                style={{ width: `${parseInt(analysis.talk_listen_ratio.split('/')[0])}%` }}
              ></div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Maior Monólogo</h3>
            <p className="text-2xl font-bold text-gray-900">
              {Math.floor(analysis.longest_monologue_seconds / 60)}:{(analysis.longest_monologue_seconds % 60).toString().padStart(2, '0')}
            </p>
            <p className="text-sm text-gray-500 mt-1">minutos</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Sentimento</h3>
            <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${getSentimentColor(analysis.sentiment)}`}>
              {analysis.sentiment}
            </span>
          </div>
        </div>
      )}

      {/* Keywords */}
      {analysis && analysis.keywords_detected.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4">Palavras-chave Detectadas</h3>
          <div className="flex flex-wrap gap-2">
            {analysis.keywords_detected.map((keyword, index) => (
              <span key={index} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
                {keyword.replace('_', ' ')}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Transcript */}
      {analysis && analysis.full_transcript && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4">Transcrição Completa</h3>
          <div className="max-h-96 overflow-y-auto bg-gray-50 rounded-lg p-4">
            {formatTranscript(analysis.full_transcript)}
          </div>
        </div>
      )}

      {/* Manager Feedback */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4">Feedback do Gerente</h3>
        
        {user?.role === 'manager' ? (
          <div className="space-y-4">
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Adicione seu feedback para esta chamada..."
              rows={4}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={saveFeedback}
              disabled={savingFeedback}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              <span>{savingFeedback ? 'Salvando...' : 'Salvar Feedback'}</span>
            </button>
          </div>
        ) : (
          <div className="bg-gray-50 rounded-lg p-4">
            {analysis?.manager_feedback ? (
              <p className="text-gray-700">{analysis.manager_feedback}</p>
            ) : (
              <p className="text-gray-500 italic">Nenhum feedback fornecido ainda</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}