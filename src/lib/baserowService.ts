// src/lib/baserowService.ts
import bcrypt from 'bcryptjs';
import toast from 'react-hot-toast';

// --- Interfaces ---
export interface BaserowObject { id: number; [key: string]: any; }
export interface AppUserObject { id: number; name: string; email: string; }
export interface BaserowCallRecording extends BaserowObject {}
export interface BaserowCallAnalysis extends BaserowObject {}
export interface BaserowUser extends BaserowObject {}
export interface BaserowOrganization extends BaserowObject {}

// --- Configuração da API ---
const BASE_URL = import.meta.env.VITE_BASEROW_API_URL;
const API_TOKEN = import.meta.env.VITE_BASEROW_API_TOKEN;
const TABLE_IDS = {
  users: import.meta.env.VITE_BASEROW_TABLE_USERS,
  organizations: import.meta.env.VITE_BASEROW_TABLE_ORGANIZATIONS,
  callRecordings: import.meta.env.VITE_BASEROW_TABLE_CALL_RECORDINGS,
  analyses: import.meta.env.VITE_BASEROW_TABLE_ANALYSES,
};
const FIELD_IDS = {
  users: { name: 'field_6779', email: 'field_6753', passwordHash: 'field_6754', appRole: 'field_6759', organization: 'field_6760' },
  organizations: { name: 'field_6746', owner: 'field_6761' },
  callRecordings: { prospectName: 'field_6757', sdr: 'field_6758', organization: 'field_6767', audioUrl: 'field_6769', duration: 'field_6781' },
  analyses: { callRecording: 'field_6773', organization: 'field_6780', managerFeedback: 'field_6782' }
};
const ROLE_OPTION_IDS = {
    administrator: 2994,
    sdr: 2995,
};
const headers = { 'Authorization': `Token ${API_TOKEN}`, 'Content-Type': 'application/json' };

// --- Funções Genéricas da API ---
async function apiCall(url: string, options: RequestInit) {
    try {
        const response = await fetch(url, options);
        if (!response.ok) {
            const errorBody = await response.json();
            console.error(`ERRO DETALHADO NA API [${options.method} ${url}]:`, errorBody);
            throw new Error(`Falha na API: ${response.statusText}`);
        }
        const text = await response.text();
        return text ? JSON.parse(text) : {};
    } catch (error) {
        toast.error("Erro de comunicação com o servidor.");
        throw error;
    }
}
async function getRow<T>(tableId: string, rowId: number): Promise<T> {
  return apiCall(`${BASE_URL}/api/database/rows/table/${tableId}/${rowId}/?user_field_names=false`, { method: 'GET', headers });
}
async function createRow<T>(tableId: string, rowData: any): Promise<T> {
  return apiCall(`${BASE_URL}/api/database/rows/table/${tableId}/?user_field_names=false`, { method: 'POST', headers, body: JSON.stringify(rowData) });
}
async function listRows<T>(tableId: string, filters: { [key: string]: any } = {}): Promise<T[]> {
  const url = new URL(`${BASE_URL}/api/database/rows/table/${tableId}/?user_field_names=false`);
  url.searchParams.append('filter_type', 'AND');
  const linkRowFieldIds = [
    FIELD_IDS.users.organization, FIELD_IDS.organizations.owner, FIELD_IDS.callRecordings.sdr,
    FIELD_IDS.callRecordings.organization, FIELD_IDS.analyses.callRecording, FIELD_IDS.analyses.organization,
  ];
  Object.entries(filters).forEach(([fieldId, value]) => {
      const isLinkField = linkRowFieldIds.includes(fieldId);
      const filterOperator = isLinkField ? 'link_row_has' : 'equal';
      if (value !== null && value !== undefined) {
        url.searchParams.append(`filter__${fieldId}__${filterOperator}`, value.toString());
      }
  });
  const data = await apiCall(url.toString(), { method: 'GET', headers });
  return data.results as T[];
}
async function updateRow(tableId: string, rowId: number, rowData: any): Promise<any> {
  return apiCall(`${BASE_URL}/api/database/rows/table/${tableId}/${rowId}/?user_field_names=false`, { method: 'PATCH', headers, body: JSON.stringify(rowData) });
}

// --- Funções de Mapeamento ---
function mapFromBaserow(rawUser: BaserowObject): AppUserObject {
    return { id: rawUser.id, name: rawUser[FIELD_IDS.users.name], email: rawUser[FIELD_IDS.users.email] };
}

// --- Serviço Principal ---
export const baserowService = {
  async signIn(email: string, password: string) {
    const users = await listRows<BaserowObject>(TABLE_IDS.users, { [FIELD_IDS.users.email]: email });
    const user = users[0];
    if (!user) return { user: null, error: { message: 'Email ou senha incorretos.' } };
    const passwordHash = user[FIELD_IDS.users.passwordHash] as string;
    if (!passwordHash) return { user: null, error: { message: 'Conta corrompida.' } };
    const isPasswordCorrect = await bcrypt.compare(password, passwordHash);
    if (isPasswordCorrect) {
      const org = (user[FIELD_IDS.users.organization] as any[])?.[0];
      const roleObject = user[FIELD_IDS.users.appRole] as { id: number, value: string };
      if (!org || !roleObject) return { user: null, error: { message: 'Configuração de conta incompleta.' } };
      const roleId = roleObject.id;
      const appUser = {
        id: user.id,
        email: user[FIELD_IDS.users.email] as string,
        name: user[FIELD_IDS.users.name] as string,
        role: roleId === ROLE_OPTION_IDS.administrator ? 'administrator' : 'sdr',
        organizationId: org.id as number,
      };
      localStorage.setItem('appUser', JSON.stringify(appUser));
      return { user: appUser, error: null };
    } else {
      return { user: null, error: { message: 'Email ou senha incorretos.' } };
    }
  },

  async createSDR(data: { name: string; email: string; password: string; organizationId: number; }) {
    const existingUsers = await listRows(TABLE_IDS.users, { [FIELD_IDS.users.email]: data.email });
    if (existingUsers.length > 0) throw new Error(`O email '${data.email}' já está registado no sistema.`);
    const passwordHash = await bcrypt.hash(data.password, 10);
    const newSdrRow = {
        [FIELD_IDS.users.name]: data.name, [FIELD_IDS.users.email]: data.email,
        [FIELD_IDS.users.passwordHash]: passwordHash, [FIELD_IDS.users.appRole]: ROLE_OPTION_IDS.sdr,
        [FIELD_IDS.users.organization]: [data.organizationId],
    };
    await createRow(TABLE_IDS.users, newSdrRow);
  },

  async getAllSDRs(organizationId: number): Promise<AppUserObject[]> {
    const rawSDRs = await listRows<BaserowObject>(TABLE_IDS.users, { 
      [FIELD_IDS.users.organization]: organizationId
    });
    const filtered = rawSDRs.filter(u => (u[FIELD_IDS.users.appRole] as {id: number})?.id === ROLE_OPTION_IDS.sdr);
    return filtered.map(mapFromBaserow);
  },

  // RESTAURAÇÃO DAS FUNÇÕES EM FALTA
  getCallRecordings: (organizationId: number) => listRows<BaserowCallRecording>(TABLE_IDS.callRecordings, { [FIELD_IDS.callRecordings.organization]: organizationId }),
  getCallAnalyses: (organizationId: number) => listRows<BaserowCallAnalysis>(TABLE_IDS.analyses, { [FIELD_IDS.analyses.organization]: organizationId }),
  getCallRecordingById: (recordingId: number) => getRow<BaserowCallRecording>(TABLE_IDS.callRecordings, recordingId),
  getAnalysisByRecordingId: (recordingId: number) => listRows<BaserowCallAnalysis>(TABLE_IDS.analyses, { [FIELD_IDS.analyses.callRecording]: recordingId }).then(res => res[0] || null),
  getSDRById: (sdrId: number) => getRow<BaserowUser>(TABLE_IDS.users, sdrId),
  updateManagerFeedback: (analysisId: number, feedback: string) => updateRow(TABLE_IDS.analyses, analysisId, { [FIELD_IDS.analyses.managerFeedback]: feedback }),
  // signUpAdmin não é usado após o login, mas pode ser útil no futuro
  async signUpAdmin(data: { name: string; email: string; password: string; companyName: string }) {
    const existingUsers = await listRows(TABLE_IDS.users, { [FIELD_IDS.users.email]: data.email });
    if (existingUsers.length > 0) throw new Error("Este endereço de email já está em uso.");
    const passwordHash = await bcrypt.hash(data.password, 10);
    const newUserRow = {
        [FIELD_IDS.users.name]: data.name, [FIELD_IDS.users.email]: data.email,
        [FIELD_IDS.users.passwordHash]: passwordHash, [FIELD_IDS.users.appRole]: ROLE_OPTION_IDS.administrator,
    };
    const newUser = await createRow<BaserowObject>(TABLE_IDS.users, newUserRow);
    const newOrgRow = { [FIELD_IDS.organizations.name]: data.companyName, [FIELD_IDS.organizations.owner]: [newUser.id] };
    const newOrg = await createRow<BaserowObject>(TABLE_IDS.organizations, newOrgRow);
    await updateRow(TABLE_IDS.users, newUser.id, { [FIELD_IDS.users.organization]: [newOrg.id] });
  },
};