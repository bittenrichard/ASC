// src/lib/baserowService.ts
import bcrypt from 'bcryptjs';

// --- Interfaces ---
export interface BaserowUser {
  id: number;
  Name: string;
  Email: string;
  App_Role: { value: 'administrator' | 'sdr' };
  Organization: { id: number, value: string };
  Password_Hash: string;
}

export interface BaserowOrganization {
  id: number;
  Name: string;
  Owner: { id: number, value: string }[];
}

export interface BaserowCallRecording {
    id: number;
    Prospect_Name: string;
    Call_Date: string;
    Audio_File: { url: string, name: string }[];
    Call_Duration_Seconds: number;
    Status: { value: string };
    SDR: { id: number, value: string }[];
    Organization: { id: number, value: string }[];
}

export interface BaserowCallAnalysis {
    id: number;
    Call_Recording: { id: number, value: string }[];
    Efficiency_Score: number;
    Sentiment: { value: string };
}

// --- Configuração da API ---
const BASE_URL = import.meta.env.VITE_BASEROW_API_URL;
const API_TOKEN = import.meta.env.VITE_BASEROW_API_TOKEN;
const TABLE_IDS = {
  users: import.meta.env.VITE_BASEROW_TABLE_USERS,
  organizations: import.meta.env.VITE_BASEROW_TABLE_ORGANIZATIONS,
  leads: import.meta.env.VITE_BASEROW_TABLE_LEADS,
  callRecordings: import.meta.env.VITE_BASEROW_TABLE_CALL_RECORDINGS,
  analyses: import.meta.env.VITE_BASEROW_TABLE_ANALYSES,
};
const headers = {
  'Authorization': `Token ${API_TOKEN}`,
  'Content-Type': 'application/json',
};

// --- Funções Genéricas da API ---
async function createRow<T>(tableId: string, rowData: any): Promise<T> {
  const url = `${BASE_URL}/api/database/rows/table/${tableId}/?user_field_names=true`;
  const response = await fetch(url, { method: 'POST', headers, body: JSON.stringify(rowData) });
   if (!response.ok) {
    const errorBody = await response.json();
    console.error(`ERRO DETALHADO ao criar linha na tabela ${tableId}:`, errorBody);
    throw new Error(`Falha na API ao criar linha. Status: ${response.status}`);
  }
  return await response.json();
}

async function listRows<T>(tableId: string, filters: { [key: string]: any } = {}): Promise<T[]> {
  const url = new URL(`${BASE_URL}/api/database/rows/table/${tableId}/`);
  url.searchParams.append('user_field_names', 'true');
  
  // CORREÇÃO APLICADA AQUI para garantir que o filtro funciona corretamente
  url.searchParams.append('filter_type', 'AND');
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.append(`filter__field_${key}__equal`, value);
    }
  });

  const response = await fetch(url.toString(), { method: 'GET', headers });
  if (!response.ok) {
      console.error(`Erro ao listar linhas da tabela ${tableId}:`, await response.json());
      throw new Error(`HTTP error! status: ${response.status}`);
  }
  const data = await response.json();
  return data.results as T[];
}

async function updateRow(tableId: string, rowId: number, rowData: any) {
    const url = `${BASE_URL}/api/database/rows/table/${tableId}/${rowId}/?user_field_names=true`;
    const response = await fetch(url, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(rowData),
    });
    if (!response.ok) {
      const errorBody = await response.json();
      console.error(`ERRO DETALHADO ao atualizar linha ${rowId} na tabela ${tableId}:`, errorBody);
      throw new Error(`Falha na API ao atualizar linha. Status: ${response.status}`);
    }
}

// --- Serviço Principal ---
export const baserowService = {
  async signUpAdmin(data: { name: string; email: string; password: string; companyName: string }) {
    console.log("Iniciando processo de registo...");
    const existingUsers = await listRows<BaserowUser>(TABLE_IDS.users, { 'Email': data.email });
    if (existingUsers.length > 0) {
      throw new Error("Este endereço de email já está em uso.");
    }
    console.log("Passo 1/5: Email verificado, não existe.");
    const passwordHash = await bcrypt.hash(data.password, 10);
    console.log("Passo 2/5: Senha criptografada.");
    const newUser = await createRow<BaserowUser>(TABLE_IDS.users, {
      'Name': data.name,
      'Email': data.email,
      'Password_Hash': passwordHash,
      'App_Role': 'administrator',
    });
    console.log("Passo 3/5: Utilizador criado com sucesso. ID:", newUser.id);
    const newOrg = await createRow<BaserowOrganization>(TABLE_IDS.organizations, {
      'Name': data.companyName,
      'Owner': [newUser.id],
    });
    console.log("Passo 4/5: Organização criada com sucesso. ID:", newOrg.id);
    await updateRow(TABLE_IDS.users, newUser.id, { 'Organization': [newOrg.id] });
    console.log("Passo 5/5: Utilizador atualizado e ligado à organização. Registo completo!");
  },

  async signIn(email: string, password: string) {
    try {
      const users = await listRows<BaserowUser>(TABLE_IDS.users, { 'Email': email });
      const user = users[0];
      if (!user) {
        return { user: null, error: { message: 'Email ou senha incorretos.' } };
      }
      if (!user.Password_Hash || !user.Password_Hash.startsWith('$2b$')) {
        return { user: null, error: { message: 'Conta corrompida. Por favor, registe-se novamente.' } };
      }
      const isPasswordCorrect = await bcrypt.compare(password, user.Password_Hash);
      if (isPasswordCorrect) {
        if (!user.App_Role || !user.Organization) {
            return { user: null, error: { message: 'A sua conta parece estar com problemas de configuração.' } };
        }
        const appUser = {
          id: user.id,
          email: user.Email,
          name: user.Name,
          role: user.App_Role.value,
          organizationId: user.Organization.id,
        };
        localStorage.setItem('appUser', JSON.stringify(appUser));
        return { user: appUser, error: null };
      } else {
        return { user: null, error: { message: 'Email ou senha incorretos.' } };
      }
    } catch (err) {
      console.error("Ocorreu um erro inesperado durante o signIn:", err);
      return { user: null, error: { message: 'Ocorreu um erro no servidor. Tente novamente.' } };
    }
  },

  async createSDR(data: { name: string; email: string; password: string; organizationId: number; }) {
    const existingUsers = await listRows<BaserowUser>(TABLE_IDS.users, { 'Email': data.email });
    if (existingUsers.length > 0) {
      throw new Error(`O email '${data.email}' já está registado no sistema.`);
    }
    const passwordHash = await bcrypt.hash(data.password, 10);
    await createRow<BaserowUser>(TABLE_IDS.users, {
      'Name': data.name,
      'Email': data.email,
      'Password_Hash': passwordHash,
      'App_Role': 'sdr',
      'Organization': [data.organizationId],
    });
  },
  
  async getCallRecordings(organizationId: number): Promise<BaserowCallRecording[]> {
    return listRows<BaserowCallRecording>(TABLE_IDS.callRecordings, { 'Organization': organizationId });
  },

  async getAllSDRs(organizationId: number): Promise<BaserowUser[]> {
    const allUsers = await listRows<BaserowUser>(TABLE_IDS.users, { 'Organization': organizationId });
    return allUsers.filter(u => u.App_Role && u.App_Role.value === 'sdr');
  },

  async getCallAnalyses(organizationId: number): Promise<BaserowCallAnalysis[]> {
    return listRows<BaserowCallAnalysis>(TABLE_IDS.analyses);
  },
};