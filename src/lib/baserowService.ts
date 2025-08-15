// src/lib/baserowService.ts
import bcrypt from 'bcryptjs';

// =================================================================================
// Tipos de Dados (Estrutura do Baserow)
// =================================================================================

export interface BaserowUser {
  id: number;
  order: string;
  name: string;
  email: string;
  role: { id: number; value: 'sdr' | 'administrator'; color: string; }[];
  user_id: string;
  administrator_link: { id: number; value: string }[]; // Ligação SDR -> Admin
  password_hash: string;
}

export interface BaserowCallRecording {
  id: number;
  order: string;
  prospect_name: string;
  call_date: string;
  audio_file_url: string;
  call_duration_seconds: number;
  status: { id: number; value: 'Análise Pendente' | 'Processando' | 'Analisada'; color: string; }[];
  sdr: { id: number; value: string }[];
}

export interface BaserowCallAnalysis {
  id: number;
  order: string;
  call_recording: { id: number; value: string }[];
  full_transcript: string;
  talk_listen_ratio: string;
  sdr_talk_time_seconds: number;
  prospect_talk_time_seconds: number;
  longest_monologue_seconds: number;
  sentiment: { id: number; value: 'Positivo' | 'Neutro' | 'Negativo'; color: string; }[];
  efficiency_score: number;
  manager_feedback: string;
  spin_analysis: string;
}

export interface SpinAnalysisData {
    situation: { score: number; feedback: string; excerpts: string[] };
    problem: { score: number; feedback: string; excerpts: string[] };
    implication: { score: number; feedback: string; excerpts: string[] };
    need_payoff: { score: number; feedback: string; excerpts: string[] };
}

// =================================================================================
// Configuração da API
// =================================================================================
const BASE_URL = import.meta.env.VITE_BASEROW_API_URL;
const API_TOKEN = import.meta.env.VITE_BASEROW_API_TOKEN;
const TABLE_IDS = {
  users: import.meta.env.VITE_BASEROW_TABLE_USERS,
  recordings: import.meta.env.VITE_BASEROW_TABLE_CALL_RECORDINGS,
  analyses: import.meta.env.VITE_BASEROW_TABLE_CALL_ANALYSES,
};
const headers = {
  'Authorization': `Token ${API_TOKEN}`,
  'Content-Type': 'application/json',
};

// =================================================================================
// Funções Genéricas de Acesso à API
// =================================================================================
async function listRows<T>(tableId: string): Promise<T[]> {
  const url = `${BASE_URL}/api/database/rows/table/${tableId}/?user_field_names=true`;
  const response = await fetch(url, { method: 'GET', headers });
  if (!response.ok) {
    console.error("Erro na resposta do Baserow (listRows):", await response.json());
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const data = await response.json();
  return data.results as T[];
}
async function createRow<T>(tableId: string, rowData: any): Promise<T> {
  const url = `${BASE_URL}/api/database/rows/table/${tableId}/?user_field_names=true`;
  const response = await fetch(url, { method: 'POST', headers, body: JSON.stringify(rowData) });
   if (!response.ok) {
    console.error("Erro na resposta do Baserow ao criar linha:", await response.json());
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return await response.json();
}
async function updateRow<T>(tableId: string, rowId: number, rowData: any): Promise<T> {
    const url = `${BASE_URL}/api/database/rows/table/${tableId}/${rowId}/?user_field_names=true`;
    const response = await fetch(url, { method: 'PATCH', headers, body: JSON.stringify(rowData) });
    if (!response.ok) {
      console.error("Erro na resposta do Baserow ao atualizar linha:", await response.json());
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
}

// =================================================================================
// Export do Serviço com Funções Específicas
// =================================================================================
export const baserowService = {
  // --- USUÁRIOS ---
  async getUserByEmail(email: string): Promise<BaserowUser | null> {
    const users = await listRows<BaserowUser>(TABLE_IDS.users);
    return users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
  },

  async createUser(data: { name: string; email: string; role: 'sdr' | 'administrator'; password?: string; managerId?: number }): Promise<BaserowUser> {
    const passwordHash = data.password ? await bcrypt.hash(data.password, 10) : '';

    const roleId = data.role === 'administrator' ? 428 : 429;

    const newUserRow: any = {
      name: data.name,
      email: data.email,
      role: roleId,
      password_hash: passwordHash,
    };

    if (data.managerId) {
      newUserRow.administrator_link = [data.managerId];
    }

    return createRow<BaserowUser>(TABLE_IDS.users, newUserRow);
  },

  async getAllSDRs(managerId?: number): Promise<{ id: number; name: string; email: string; }[]> {
    const users = await listRows<BaserowUser>(TABLE_IDS.users);
    let sdrs = users.filter(u => u.role && u.role.length > 0 && u.role[0].value === 'sdr');
    if (managerId) {
      sdrs = sdrs.filter(sdr => sdr.administrator_link && sdr.administrator_link.some(m => m.id === managerId));
    }
    return sdrs.map(u => ({ id: u.id, name: u.name, email: u.email }));
  },

  // --- CHAMADAS E ANÁLISES ---
  async getCallRecordings(): Promise<BaserowCallRecording[]> { return listRows<BaserowCallRecording>(TABLE_IDS.recordings); },
  async getCallAnalyses(): Promise<BaserowCallAnalysis[]> { return listRows<BaserowCallAnalysis>(TABLE_IDS.analyses); },
  async updateManagerFeedback(analysisId: number, feedback: string): Promise<BaserowCallAnalysis> { return updateRow(TABLE_IDS.analyses, analysisId, { manager_feedback: feedback }); },
  async createCallRecording(data: { prospect_name: string; sdr_id: number; call_duration_seconds: number; audio_file_url: string; }): Promise<BaserowCallRecording> {
    const newRecording = { prospect_name: data.prospect_name, sdr: [data.sdr_id], call_duration_seconds: data.call_duration_seconds, audio_file_url: data.audio_file_url, status: 'Análise Pendente', call_date: new Date().toISOString().split('T')[0], };
    return createRow(TABLE_IDS.recordings, newRecording);
  },
  async runSpinAnalysis(transcript: string): Promise<SpinAnalysisData> {
    await new Promise(resolve => setTimeout(resolve, 1500)); 
    return {
      situation: { score: 85, feedback: "Boas perguntas de situação.", excerpts: ["SDR: Oi David."] },
      problem: { score: 70, feedback: "Identificou o problema principal.", excerpts: ["Prospecto: O que sua plataforma faz?"] },
      implication: { score: 92, feedback: "Excelente trabalho em verbalizar consequências.", excerpts: ["Nossa plataforma ajuda a aumentar as taxas de conversão."] },
      need_payoff: { score: 88, feedback: "Conectou bem a solução com o ganho.", excerpts: ["através de pontuação automatizada de leads..."] }
    };
  },
  async updateSpinAnalysis(analysisId: number, spinData: SpinAnalysisData): Promise<BaserowCallAnalysis> {
    const spinJsonString = JSON.stringify(spinData, null, 2);
    return updateRow(TABLE_IDS.analyses, analysisId, { spin_analysis: spinJsonString });
  },
};