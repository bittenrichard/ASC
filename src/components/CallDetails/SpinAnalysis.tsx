import React from 'react'
import { Target, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react'

interface SpinCategory {
  score: number
  feedback: string
  excerpts: string[]
}

interface SpinAnalysisData {
  situation: SpinCategory
  problem: SpinCategory
  implication: SpinCategory
  need_payoff: SpinCategory
}

interface SpinAnalysisProps {
  spinAnalysis: SpinAnalysisData
}

export function SpinAnalysis({ spinAnalysis }: SpinAnalysisProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50 border-green-200'
    if (score >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    return 'text-red-600 bg-red-50 border-red-200'
  }

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <CheckCircle className="h-5 w-5 text-green-600" />
    if (score >= 60) return <AlertCircle className="h-5 w-5 text-yellow-600" />
    return <AlertCircle className="h-5 w-5 text-red-600" />
  }

  const categories = [
    {
      key: 'situation',
      title: 'Situação (S)',
      description: 'Perguntas sobre a situação atual do cliente',
      data: spinAnalysis.situation,
      color: 'blue'
    },
    {
      key: 'problem',
      title: 'Problema (P)',
      description: 'Identificação de problemas e dificuldades',
      data: spinAnalysis.problem,
      color: 'purple'
    },
    {
      key: 'implication',
      title: 'Implicação (I)',
      description: 'Exploração das consequências dos problemas',
      data: spinAnalysis.implication,
      color: 'orange'
    },
    {
      key: 'need_payoff',
      title: 'Necessidade (N)',
      description: 'Benefícios e valor da solução',
      data: spinAnalysis.need_payoff,
      color: 'green'
    }
  ]

  const overallScore = Math.round(
    (spinAnalysis.situation.score + 
     spinAnalysis.problem.score + 
     spinAnalysis.implication.score + 
     spinAnalysis.need_payoff.score) / 4
  )

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Target className="h-6 w-6 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Análise SPIN Selling</h3>
        </div>
        <div className={`px-4 py-2 rounded-lg border-2 ${getScoreColor(overallScore)}`}>
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span className="text-2xl font-bold">{overallScore}</span>
            <span className="text-sm">Score Geral</span>
          </div>
        </div>
      </div>

      {/* SPIN Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {categories.map((category) => (
          <div key={category.key} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="font-semibold text-gray-900">{category.title}</h4>
                <p className="text-sm text-gray-600">{category.description}</p>
              </div>
              <div className="flex items-center space-x-2">
                {getScoreIcon(category.data.score)}
                <span className="text-xl font-bold text-gray-900">
                  {category.data.score}
                </span>
              </div>
            </div>
            
            <div className="mb-3">
              <div className="bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full bg-${category.color}-500`}
                  style={{ width: `${category.data.score}%` }}
                ></div>
              </div>
            </div>

            <p className="text-sm text-gray-700 mb-3">{category.data.feedback}</p>

            {category.data.excerpts.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-500 mb-2">Trechos Identificados:</p>
                <div className="space-y-1">
                  {category.data.excerpts.map((excerpt, index) => (
                    <div key={index} className={`text-xs p-2 rounded bg-${category.color}-50 text-${category.color}-700 border border-${category.color}-200`}>
                      "{excerpt}"
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* SPIN Methodology Info */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-semibold text-gray-900 mb-2">Sobre a Metodologia SPIN</h4>
        <p className="text-sm text-gray-600">
          SPIN Selling é uma metodologia de vendas baseada em quatro tipos de perguntas: 
          <strong> Situação</strong> (entender o contexto), 
          <strong> Problema</strong> (identificar dificuldades), 
          <strong> Implicação</strong> (explorar consequências) e 
          <strong> Necessidade</strong> (criar valor). Esta análise avalia como cada categoria foi executada na chamada.
        </p>
      </div>
    </div>
  )
}