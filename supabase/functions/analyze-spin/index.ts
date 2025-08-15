import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SpinAnalysis {
  situation: {
    score: number
    feedback: string
    excerpts: string[]
  }
  problem: {
    score: number
    feedback: string
    excerpts: string[]
  }
  implication: {
    score: number
    feedback: string
    excerpts: string[]
  }
  need_payoff: {
    score: number
    feedback: string
    excerpts: string[]
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { callId, transcript } = await req.json()

    if (!callId || !transcript) {
      return new Response(
        JSON.stringify({ error: 'callId and transcript are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // SPIN Selling analysis prompt
    const prompt = `Você é um coach de vendas sênior, especialista na metodologia SPIN Selling. Sua tarefa é analisar a transcrição de uma chamada de vendas e avaliar a performance do SDR. Identifique os trechos exatos da transcrição que correspondem a cada uma das quatro categorias do SPIN: Situação, Problema, Implicação e Necessidade. Para cada categoria, forneça uma nota de 0 a 100 sobre a qualidade da execução pelo SDR e um feedback construtivo. Retorne sua análise estritamente no seguinte formato JSON: {"situation": {"score": number, "feedback": string, "excerpts": string[]}, "problem": {"score": number, "feedback": string, "excerpts": string[]}, "implication": {"score": number, "feedback": string, "excerpts": string[]}, "need_payoff": {"score": number, "feedback": string, "excerpts": string[]}}

Transcrição da chamada:
${transcript}`

    // For demo purposes, we'll use a mock analysis
    // In production, you would call OpenAI API here
    const mockSpinAnalysis: SpinAnalysis = {
      situation: {
        score: Math.floor(Math.random() * 30) + 70, // 70-100
        feedback: "Boa identificação da situação atual do cliente. Continue explorando o contexto organizacional para entender melhor o cenário completo.",
        excerpts: [
          "Entendo que vocês estão buscando melhorar o processo de vendas",
          "Qual é a estrutura atual da equipe comercial?"
        ]
      },
      problem: {
        score: Math.floor(Math.random() * 40) + 60, // 60-100
        feedback: "Identificou problemas relevantes, mas poderia aprofundar mais nas dores específicas e quantificar o impacto.",
        excerpts: [
          "temos enfrentado dificuldades com taxas de conversão",
          "O processo atual é muito manual e demorado"
        ]
      },
      implication: {
        score: Math.floor(Math.random() * 50) + 50, // 50-100
        feedback: "Explorou algumas implicações, mas poderia conectar melhor os problemas aos impactos financeiros e estratégicos do negócio.",
        excerpts: [
          "isso deve estar impactando o crescimento da empresa",
          "Como isso afeta a produtividade da equipe?"
        ]
      },
      need_payoff: {
        score: Math.floor(Math.random() * 35) + 65, // 65-100
        feedback: "Boa apresentação dos benefícios. Continue focando em como a solução resolve especificamente os problemas identificados.",
        excerpts: [
          "Nossa solução pode aumentar a conversão em até 40%",
          "Isso resolveria exatamente o problema que vocês têm"
        ]
      }
    }

    // Save SPIN analysis to database
    const { error: updateError } = await supabaseClient
      .from('call_analyses')
      .update({ spin_analysis: mockSpinAnalysis })
      .eq('call_id', callId)

    if (updateError) {
      throw updateError
    }

    return new Response(
      JSON.stringify({ success: true, spinAnalysis: mockSpinAnalysis }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in analyze-spin function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})