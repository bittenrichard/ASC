// src/lib/baserowService.ts

// =================================================================================
// Tipos de Dados (Estrutura do Baserow)
// =================================================================================

// Mapeia a estrutura da tabela 'users'
export interface BaserowUser {
  id: number;
  order: string;
  name: string;
  email: string;
  role: {
    id: number;
    value: 'sdr' | 'manager';
    color: string;
  }[]; // Baserow retorna single select como um array
  user_id: string;
  manager: { id: number; value: string }[];
}

// Mapeia a estrutura da tabela 'call_recordings'
export interface BaserowCallRecording {
  id: number;
  order: string;
  prospect_name: string;
  call_date: string; // Formato YYYY-MM-DD
  audio_file_url: string;
  call_duration_seconds: number;
  status: {
    id: number;
    value: 'Análise Pendente' | 'Processando' | 'Analisada';
    color: string;
  }[];
  sdr: { id: number; value: string }[];
}

// Mapeia a estrutura da tabela 'call_analyses'
export interface BaserowCallAnalysis {
  id: number;
  order: string;
  call_recording: { id: number; value: string }[];
  full_transcript: string;
  talk_listen_ratio: string;
  sdr_talk_time_seconds: number;
  prospect_talk_time_seconds: number;
  longest_monologue_seconds: number;
  sentiment: {
    id: number;
    value: 'Positivo' | 'Neutro' | 'Negativo';
    color: string;
  }[];
  efficiency_score: number;
  manager_feedback: string;
  spin_analysis: string; // Campo de texto longo para o JSON
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

/**
 * Função genérica para buscar todas as linhas de uma tabela.
 * @param tableId O ID da tabela no Baserow.
 */
async function listRows<T>(tableId: string, options: { filter?: string, filter_type?: string } = {}): Promise<T[]> {
  if (!tableId) {
    console.error("ID da tabela não foi fornecido ou é inválido.");
    return [];
  }
  
  const url = new URL(`${BASE_URL}/api/database/rows/table/${tableId}/`);
  url.searchParams.set('user_field_names', 'true');

  if (options.filter && options.filter_type) {
      url.searchParams.set(options.filter, options.filter_type)
  }

  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error(`Erro ao buscar dados da tabela ${tableId}:`, errorData);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.results as T[];
  } catch (error) {
    console.error("Falha na requisição para o Baserow:", error);
    return [];
  }
}

/**
 * Função genérica para criar uma nova linha em uma tabela.
 * @param tableId O ID da tabela no Baserow.
 * @param rowData Os dados da nova linha.
 */
async function createRow<T>(tableId: string, rowData: Partial<T>): Promise<T> {
  const url = `${BASE_URL}/api/database/rows/table/${tableId}/?user_field_names=true`;
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(rowData),
  });
  if (!response.ok) {
    const errorData = await response.json();
    console.error(`Erro ao criar linha na tabela ${tableId}:`, errorData);
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return await response.json();
}

/**
 * Função genérica para atualizar uma linha existente.
 * @param tableId O ID da tabela no Baserow.
 * @param rowId O ID da linha a ser atualizada.
 * @param rowData Os dados a serem atualizados.
 */
async function updateRow<T>(tableId: string, rowId: number, rowData: Partial<T>): Promise<T> {
  const url = `${BASE_URL}/api/database/rows/table/${tableId}/${rowId}/?user_field_names=true`;
  const response = await fetch(url, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(rowData),
  });
  if (!response.ok) {
    const errorData = await response.json();
    console.error(`Erro ao atualizar linha ${rowId} na tabela ${tableId}:`, errorData);
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
    try {
      const users = await listRows<BaserowUser>(TABLE_IDS.users);
      const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      return user || null;
    } catch (error) {
      console.error("Erro ao buscar usuário por email:", error);
      return null;
    }
  },

  async getAllSDRs(): Promise<{ id: number; name: string }[]> {
      const users = await listRows<BaserowUser>(TABLE_IDS.users);
      return users
        .filter(u => u.role[0]?.value === 'sdr')
        .map(u => ({ id: u.id, name: u.name }));
  },

  // --- CHAMADAS E ANÁLISES ---
  async getCallRecordings(): Promise<BaserowCallRecording[]> {
      return listRows<BaserowCallRecording>(TABLE_IDS.recordings);
  },

  async getCallAnalyses(): Promise<BaserowCallAnalysis[]> {
      return listRows<BaserowCallAnalysis>(TABLE_IDS.analyses);
  },

  async updateManagerFeedback(analysisId: number, feedback: string): Promise<BaserowCallAnalysis> {
      return updateRow(TABLE_IDS.analyses, analysisId, { manager_feedback: feedback });
  },

  async createCallRecording(data: {
      prospect_name: string;
      sdr_id: number;
      call_duration_seconds: number;
      audio_file_url: string;
  }): Promise<BaserowCallRecording> {
      const newRecording = {
          prospect_name: data.prospect_name,
          sdr: [data.sdr_id],
          call_duration_seconds: data.call_duration_seconds,
          audio_file_url: data.audio_file_url,
          status: 'Análise Pendente', // Status inicial
          call_date: new Date().toISOString().split('T')[0], // Data de hoje
      };
      return createRow(TABLE_IDS.recordings, newRecording);
  },
};