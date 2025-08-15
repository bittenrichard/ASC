/*
  # Add SPIN Analysis Column

  1. Changes
    - Add `spin_analysis` column to `call_analyses` table
    - Column type: JSONB for storing structured SPIN analysis data

  2. Structure
    The JSONB will contain:
    - situation: {score: number, feedback: string, excerpts: string[]}
    - problem: {score: number, feedback: string, excerpts: string[]}
    - implication: {score: number, feedback: string, excerpts: string[]}
    - need_payoff: {score: number, feedback: string, excerpts: string[]}
*/

-- Add spin_analysis column to call_analyses table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'call_analyses' AND column_name = 'spin_analysis'
  ) THEN
    ALTER TABLE call_analyses ADD COLUMN spin_analysis JSONB DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Update existing records with sample SPIN analysis data
UPDATE call_analyses 
SET spin_analysis = '{
  "situation": {
    "score": 85,
    "feedback": "Boa identificação da situação atual do cliente, mas poderia explorar mais detalhes sobre o contexto organizacional.",
    "excerpts": ["Entendo que vocês estão buscando melhorar o engajamento com clientes", "Qual é o processo atual de vendas da empresa?"]
  },
  "problem": {
    "score": 78,
    "feedback": "Identificou problemas relevantes, mas poderia aprofundar mais nas dores específicas do cliente.",
    "excerpts": ["temos enfrentado dificuldades com taxas de retenção", "O que mais te preocupa nesse processo?"]
  },
  "implication": {
    "score": 72,
    "feedback": "Explorou algumas implicações, mas poderia conectar melhor os problemas aos impactos no negócio.",
    "excerpts": ["isso deve estar impactando o crescimento da empresa", "Como isso afeta seus resultados mensais?"]
  },
  "need_payoff": {
    "score": 88,
    "feedback": "Excelente apresentação dos benefícios e criação de necessidade. Cliente demonstrou interesse claro.",
    "excerpts": ["Nossa solução pode aumentar a retenção em até 40%", "Isso resolveria exatamente nosso problema"]
  }
}'::jsonb
WHERE analysis_id IN (
  SELECT analysis_id FROM call_analyses LIMIT 3
);