// Dados mock para demonstração da aplicação

export interface CallRecording {
  call_id: string
  sdr_id: string
  prospect_name: string
  call_date: string
  audio_file_url: string
  call_duration_seconds: number
  status: 'Análise Pendente' | 'Processando' | 'Analisada'
  sdr_name?: string
  efficiency_score?: number
}

export interface CallAnalysis {
  analysis_id: string
  call_id: string
  full_transcript: string
  talk_listen_ratio: string
  sdr_talk_time_seconds: number
  prospect_talk_time_seconds: number
  longest_monologue_seconds: number
  sentiment: 'Positivo' | 'Neutro' | 'Negativo'
  keywords_detected: string[]
  efficiency_score: number
  manager_feedback: string
  spin_analysis?: {
    situation: { score: number; feedback: string; excerpts: string[] }
    problem: { score: number; feedback: string; excerpts: string[] }
    implication: { score: number; feedback: string; excerpts: string[] }
    need_payoff: { score: number; feedback: string; excerpts: string[] }
  }
}

export const mockCallRecordings: CallRecording[] = [
  {
    call_id: '1',
    sdr_id: '1',
    prospect_name: 'Acme Corp - David Miller',
    call_date: '2024-12-15',
    audio_file_url: 'https://example.com/audio1.mp3',
    call_duration_seconds: 1240,
    status: 'Analisada',
    sdr_name: 'João Silva'
  },
  {
    call_id: '2',
    sdr_id: '1',
    prospect_name: 'TechStart - Jennifer Brown',
    call_date: '2024-12-14',
    audio_file_url: 'https://example.com/audio2.mp3',
    call_duration_seconds: 980,
    status: 'Analisada',
    sdr_name: 'João Silva'
  },
  {
    call_id: '3',
    sdr_id: '3',
    prospect_name: 'GlobalTech - Robert Wilson',
    call_date: '2024-12-13',
    audio_file_url: 'https://example.com/audio3.mp3',
    call_duration_seconds: 1450,
    status: 'Processando',
    sdr_name: 'Pedro Oliveira'
  },
  {
    call_id: '4',
    sdr_id: '3',
    prospect_name: 'InnovateCo - Sarah Lee',
    call_date: '2024-12-12',
    audio_file_url: 'https://example.com/audio4.mp3',
    call_duration_seconds: 1120,
    status: 'Analisada',
    sdr_name: 'Pedro Oliveira'
  }
]

export const mockCallAnalyses: CallAnalysis[] = [
  {
    analysis_id: '1',
    call_id: '1',
    full_transcript: 'SDR: Oi David, obrigado por reservar um tempo hoje. Queria discutir como podemos ajudar a otimizar seu processo de vendas...\nProspecto: Claro, tenho cerca de 15 minutos. O que exatamente sua plataforma faz?\nSDR: Ótima pergunta! Nossa plataforma ajuda empresas como a sua a aumentar as taxas de conversão em 40% através de pontuação automatizada de leads...',
    talk_listen_ratio: '45/55',
    sdr_talk_time_seconds: 558,
    prospect_talk_time_seconds: 682,
    longest_monologue_seconds: 45,
    sentiment: 'Positivo',
    keywords_detected: ['script_abertura', 'perguntas_qualificacao', 'proposta_valor_A', 'proximo_passo_demo'],
    efficiency_score: 85,
    manager_feedback: 'Ótimo trabalho com a abertura e perguntas de qualificação. Considere encurtar a explicação da proposta de valor para manter o prospecto mais engajado.',
    spin_analysis: {
      situation: {
        score: 85,
        feedback: 'Boa identificação da situação atual do cliente, mas poderia explorar mais detalhes sobre o contexto organizacional.',
        excerpts: ['Entendo que vocês estão buscando melhorar o engajamento com clientes', 'Qual é o processo atual de vendas da empresa?']
      },
      problem: {
        score: 78,
        feedback: 'Identificou problemas relevantes, mas poderia aprofundar mais nas dores específicas do cliente.',
        excerpts: ['temos enfrentado dificuldades com taxas de retenção', 'O que mais te preocupa nesse processo?']
      },
      implication: {
        score: 72,
        feedback: 'Explorou algumas implicações, mas poderia conectar melhor os problemas aos impactos no negócio.',
        excerpts: ['isso deve estar impactando o crescimento da empresa', 'Como isso afeta seus resultados mensais?']
      },
      need_payoff: {
        score: 88,
        feedback: 'Excelente apresentação dos benefícios e criação de necessidade. Cliente demonstrou interesse claro.',
        excerpts: ['Nossa solução pode aumentar a retenção em até 40%', 'Isso resolveria exatamente nosso problema']
      }
    }
  },
  {
    analysis_id: '2',
    call_id: '2',
    full_transcript: 'SDR: Olá Jennifer, espero que esteja tendo um ótimo dia. Queria entrar em contato sobre sua consulta recente...\nProspecto: Sim, preenchi o formulário, mas não tenho certeza se isso é adequado para nós...',
    talk_listen_ratio: '60/40',
    sdr_talk_time_seconds: 588,
    prospect_talk_time_seconds: 392,
    longest_monologue_seconds: 78,
    sentiment: 'Neutro',
    keywords_detected: ['script_abertura', 'objecao_preco', 'tratamento_objecoes'],
    efficiency_score: 72,
    manager_feedback: 'Bom tratamento de objeções, mas tente fazer mais perguntas de qualificação no início da chamada.',
    spin_analysis: {
      situation: {
        score: 70,
        feedback: 'Situação identificada adequadamente, mas faltou profundidade na exploração do contexto.',
        excerpts: ['preenchi o formulário', 'não tenho certeza se isso é adequado para nós']
      },
      problem: {
        score: 65,
        feedback: 'Problemas identificados, mas poderia ter explorado mais as dores específicas.',
        excerpts: ['não tenho certeza se isso é adequado', 'temos algumas preocupações com o orçamento']
      },
      implication: {
        score: 68,
        feedback: 'Algumas implicações foram exploradas, mas poderia ter conectado melhor aos impactos financeiros.',
        excerpts: ['isso pode afetar nossos resultados', 'precisamos de uma solução mais econômica']
      },
      need_payoff: {
        score: 75,
        feedback: 'Boa apresentação de benefícios, mas poderia ter focado mais no ROI específico.',
        excerpts: ['nossa solução oferece excelente custo-benefício', 'isso pode resolver suas preocupações']
      }
    }
  },
  {
    analysis_id: '4',
    call_id: '4',
    full_transcript: 'SDR: Oi Sarah, obrigado por se conectar comigo hoje. Entendo que vocês estão buscando melhorar o engajamento com clientes...\nProspecto: Exatamente, temos enfrentado dificuldades com taxas de retenção...',
    talk_listen_ratio: '42/58',
    sdr_talk_time_seconds: 470,
    prospect_talk_time_seconds: 650,
    longest_monologue_seconds: 52,
    sentiment: 'Positivo',
    keywords_detected: ['script_abertura', 'perguntas_qualificacao', 'proposta_valor_B', 'proximo_passo_demo', 'fechamento'],
    efficiency_score: 92,
    manager_feedback: 'Chamada excelente! Proporção perfeita de fala/escuta e ótimas perguntas de descoberta. Continue assim!',
    spin_analysis: {
      situation: {
        score: 90,
        feedback: 'Excelente exploração da situação atual. Fez perguntas detalhadas sobre o contexto organizacional.',
        excerpts: ['vocês estão buscando melhorar o engajamento com clientes', 'Como está estruturado o processo atual?']
      },
      problem: {
        score: 88,
        feedback: 'Identificação precisa dos problemas. Explorou bem as dores específicas do cliente.',
        excerpts: ['temos enfrentado dificuldades com taxas de retenção', 'O maior desafio é manter os clientes engajados']
      },
      implication: {
        score: 85,
        feedback: 'Boa exploração das implicações. Conectou os problemas aos impactos no negócio de forma eficaz.',
        excerpts: ['isso está impactando diretamente nossa receita recorrente', 'Como isso afeta o crescimento da empresa?']
      },
      need_payoff: {
        score: 95,
        feedback: 'Apresentação excepcional dos benefícios. Cliente ficou convencido do valor da solução.',
        excerpts: ['Nossa solução pode aumentar a retenção em até 40%', 'Isso resolveria exatamente nosso problema principal']
      }
    }
  }
]

export class MockDataService {
  getAllCalls(): CallRecording[] {
    return mockCallRecordings.map(call => ({
      ...call,
      efficiency_score: this.getCallScoreSync(call.call_id)
    }))
  }

  getCallsBySDR(sdrId: string): CallRecording[] {
    return mockCallRecordings
      .filter(call => call.sdr_id === sdrId)
      .map(call => ({
        ...call,
        efficiency_score: this.getCallScoreSync(call.call_id)
      }))
  }

  getAllSDRs(): { id: string; name: string }[] {
    const uniqueSDRs = new Map()
    mockCallRecordings.forEach(call => {
      if (call.sdr_name && !uniqueSDRs.has(call.sdr_id)) {
        uniqueSDRs.set(call.sdr_id, { id: call.sdr_id, name: call.sdr_name })
      }
    })
    return Array.from(uniqueSDRs.values())
  }

  getCallScoreSync(callId: string): number {
    const analysis = mockCallAnalyses.find(a => a.call_id === callId)
    return analysis ? analysis.efficiency_score : 0
  }

  getCallRecordings(sdrId?: string): Promise<CallRecording[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        let calls = mockCallRecordings
        if (sdrId) {
          calls = calls.filter(call => call.sdr_id === sdrId)
        }
        resolve(calls)
      }, 300)
    })
  }

  getCallAnalysis(callId: string): Promise<CallAnalysis | null> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const analysis = mockCallAnalyses.find(a => a.call_id === callId)
        resolve(analysis || null)
      }, 200)
    })
  }

  getCallRecording(callId: string): Promise<CallRecording | null> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const call = mockCallRecordings.find(c => c.call_id === callId)
        resolve(call || null)
      }, 200)
    })
  }

  updateManagerFeedback(analysisId: string, feedback: string): Promise<boolean> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const analysis = mockCallAnalyses.find(a => a.analysis_id === analysisId)
        if (analysis) {
          analysis.manager_feedback = feedback
          resolve(true)
        } else {
          resolve(false)
        }
      }, 300)
    })
  }

  getTeamMetrics(): Promise<{
    avgScore: number
    avgTalkRatio: string
    totalCalls: number
    analyzedCalls: number
    teamSize: number
    topPerformer: string
  }> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const analyzedCalls = mockCallAnalyses.length
        const avgScore = Math.round(
          mockCallAnalyses.reduce((sum, analysis) => sum + analysis.efficiency_score, 0) / analyzedCalls
        )
        
        resolve({
          avgScore,
          avgTalkRatio: '49/51',
          totalCalls: mockCallRecordings.length,
          analyzedCalls,
          teamSize: 2,
          topPerformer: 'Pedro Oliveira'
        })
      }, 400)
    })
  }

  getSDRMetrics(sdrId: string): Promise<{
    avgScore: number
    avgTalkRatio: string
    totalCalls: number
    analyzedCalls: number
  }> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const sdrCalls = mockCallRecordings.filter(call => call.sdr_id === sdrId)
        const sdrAnalyses = mockCallAnalyses.filter(analysis => 
          sdrCalls.some(call => call.call_id === analysis.call_id)
        )
        
        const avgScore = sdrAnalyses.length > 0
          ? Math.round(sdrAnalyses.reduce((sum, analysis) => sum + analysis.efficiency_score, 0) / sdrAnalyses.length)
          : 0
        
        resolve({
          avgScore,
          avgTalkRatio: sdrAnalyses[0]?.talk_listen_ratio || '0/100',
          totalCalls: sdrCalls.length,
          analyzedCalls: sdrAnalyses.length
        })
      }, 400)
    })
  }
}

export const mockDataService = new MockDataService()