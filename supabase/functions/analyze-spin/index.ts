// supabase/functions/analyze-spin/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { OpenAI } from 'https://deno.land/x/openai/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Inicializa o cliente da OpenAI com a chave do ambiente Supabase
const openai = new OpenAI(Deno.env.get('VITE_OPENAI_API_KEY') || '');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { audioUrl, playbookRules } = await req.json();

    if (!audioUrl) {
      throw new Error('A URL do áudio (audioUrl) é obrigatória.');
    }

    // 1. Transcrição com Whisper API
    console.log(`Iniciando transcrição para: ${audioUrl}`);
    const transcription = await openai.createTranscription({
      model: 'whisper-1',
      file: audioUrl, // O SDK da OpenAI para Deno pode aceitar uma URL diretamente
    });
    const transcript = transcription.text;
    console.log(`Transcrição concluída: "${transcript.substring(0, 100)}..."`);

    // 2. Análise com GPT-4o-mini
    const analysisPrompt = `
      Você é um analista de vendas sênior. Analise a seguinte transcrição de uma chamada de vendas e retorne um objeto JSON.
      A transcrição é: "${transcript}"

      Siga estritamente as seguintes regras para a análise:
      
      a) Análise SPIN: Avalie cada uma das 4 fases (Situação, Problema, Implicação, Necessidade) em uma escala de 0 a 100. Forneça um feedback curto e objetivo para cada fase.
      
      b) Análise de Playbook: Verifique se as seguintes regras do playbook foram seguidas na transcrição. As regras são: ${JSON.stringify(playbookRules)}
      Para cada regra, indique se foi seguida (followed: true/false) e forneça um detalhe curto.
      Calcule uma pontuação de aderência (adherence_score) de 0 a 100 com base na porcentagem de regras seguidas.

      O objeto JSON de saída DEVE ter EXATAMENTE a seguinte estrutura:
      {
        "spinAnalysis": {
          "situation": { "score": number, "feedback": string, "excerpts": string[] },
          "problem": { "score": number, "feedback": string, "excerpts": string[] },
          "implication": { "score": number, "feedback": string, "excerpts": string[] },
          "need_payoff": { "score": number, "feedback": string, "excerpts": string[] }
        },
        "playbookAnalysis": {
          "adherence_score": number,
          "feedback": { "rule": string, "followed": boolean, "details": string }[]
        }
      }
    `;

    console.log('Iniciando análise com GPT-4o-mini...');
    const chatCompletion = await openai.createChatCompletion({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: analysisPrompt }],
      response_format: { type: 'json_object' },
    });

    const analysisResult = JSON.parse(chatCompletion.choices[0].message.content || '{}');
    console.log('Análise concluída.');

    // Adiciona a transcrição completa ao resultado final para ser salva
    analysisResult.full_transcript = transcript;

    return new Response(JSON.stringify(analysisResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Erro na função analyze-spin:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});