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
export interface BaserowGoal extends BaserowObject {
  [FIELD_IDS.goals.name]: string;
  [FIELD_IDS.goals.metric]: string;
  [FIELD_IDS.goals.startDate]: string;
  [FIELD_IDS.goals.endDate]: string;
  [FIELD_IDS.goals.targetValue]: number;
  [FIELD_IDS.goals.assignedTo]: { id: number, value: string }[];
}
export interface GoalData {
  id: number;
  name: string;
  metric: string;
  targetValue: number;
  currentValue: number;
  startDate: string;
  endDate: string;
  sdrName?: string;
  sdrId?: number;
}
export interface SpinAnalysisData {
  situation: { score: number; feedback: string; excerpts: string[] };
  problem: { score: number; feedback: string; excerpts: string[] };
  implication: { score: number; feedback: string; excerpts: string[] };
  need_payoff: { score: number; feedback: string; excerpts: string[] };
}

// --- Configuração da API ---
const BASE_URL = import.meta.env.VITE_BASEROW_API_URL;
const API_TOKEN = import.meta.env.VITE_BASEROW_API_TOKEN;
const TABLE_IDS = {
  users: '698',
  organizations: '696',
  callRecordings: '700',
  analyses: '701',
  goals: '702',
};
const FIELD_IDS = {
  users: { name: 'field_6779', email: 'field_6753', passwordHash: 'field_6754', appRole: 'field_6759', organization: 'field_6760' },
  organizations: { name: 'field_6746', owner: 'field_6761' },
  callRecordings: { prospectName: 'field_6757', sdr: 'field_6758', organization: 'field_6767', audioUrl: 'field_6769', duration: 'field_6781', callDate: 'field_6768' },
  analyses: { callRecording: 'field_6773', organization: 'field_6780', managerFeedback: 'field_6782', efficiencyScore: 'field_6776', spinAnalysis: 'field_6793' },
  goals: { 
    name: 'field_6783',
    metric: 'field_6784',
    startDate: 'field_6785',
    endDate: 'field_6786',
    targetValue: 'field_6787',
    assignedTo: 'field_6788',
    organization: 'field_6790'
  },
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
    FIELD_IDS.callRecordings.organization, FIELD_IDS.analyses.callRecording, 
    FIELD_IDS.goals.assignedTo, FIELD_IDS.goals.organization
  ];
  Object.entries(filters).forEach(([fieldId, value]) => {
      if (tableId === TABLE_IDS.analyses && fieldId === FIELD_IDS.analyses.organization) return;
      
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
async function deleteRow(tableId: string, rowId: number): Promise<void> {
  await apiCall(`${BASE_URL}/api/database/rows/table/${tableId}/${rowId}/`, { method: 'DELETE', headers });
}

// --- Funções de Mapeamento ---
function mapFromBaserow(rawUser: BaserowObject): AppUserObject {
    return { id: rawUser.id, name: rawUser[FIELD_IDS.users.name], email: rawUser[FIELD_IDS.users.email] };
}
function mapGoalFromBaserow(rawGoal: BaserowGoal): GoalData {
    const assignedSdr = rawGoal[FIELD_IDS.goals.assignedTo]?.[0];
    return {
        id: rawGoal.id,
        name: rawGoal[FIELD_IDS.goals.name],
        metric: rawGoal[FIELD_IDS.goals.metric],
        startDate: rawGoal[FIELD_IDS.goals.startDate],
        endDate: rawGoal[FIELD_IDS.goals.endDate],
        targetValue: rawGoal[FIELD_IDS.goals.targetValue],
        sdrName: assignedSdr ? assignedSdr.value : 'Equipe Inteira',
        sdrId: assignedSdr ? assignedSdr.id : undefined,
        currentValue: 0,
    };
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
    const rawSDRs = await listRows<BaserowObject>(TABLE_IDS.users, { [FIELD_IDS.users.organization]: organizationId });
    const filtered = rawSDRs.filter(u => (u[FIELD_IDS.users.appRole] as {id: number})?.id === ROLE_OPTION_IDS.sdr);
    return filtered.map(mapFromBaserow);
  },
  
  deleteSDR: (sdrId: number) => deleteRow(TABLE_IDS.users, sdrId),

  updateSDR: (sdrId: number, data: { name?: string; email?: string }) => {
    const rowData: { [key: string]: any } = {};
    if (data.name) rowData[FIELD_IDS.users.name] = data.name;
    if (data.email) rowData[FIELD_IDS.users.email] = data.email;
    return updateRow(TABLE_IDS.users, sdrId, rowData);
  },
  
  getCallRecordings: (organizationId: number) => listRows<BaserowCallRecording>(TABLE_IDS.callRecordings, { [FIELD_IDS.callRecordings.organization]: organizationId }),
  
  async getCallAnalyses(organizationId: number): Promise<BaserowCallAnalysis[]> {
    const allAnalyses = await listRows<BaserowCallAnalysis>(TABLE_IDS.analyses);
    return allAnalyses.filter(analysis => {
        const orgLink = (analysis[FIELD_IDS.analyses.organization] as any[])?.[0];
        return orgLink?.id === organizationId;
    });
  },
  
  getCallRecordingById: (recordingId: number) => getRow<BaserowCallRecording>(TABLE_IDS.callRecordings, recordingId),
  getAnalysisByRecordingId: (recordingId: number) => listRows<BaserowCallAnalysis>(TABLE_IDS.analyses, { [FIELD_IDS.analyses.callRecording]: recordingId }).then(res => res[0] || null),
  getSDRById: (sdrId: number) => getRow<BaserowUser>(TABLE_IDS.users, sdrId),
  updateManagerFeedback: (analysisId: number, feedback: string) => updateRow(TABLE_IDS.analyses, analysisId, { [FIELD_IDS.analyses.managerFeedback]: feedback }),
  
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

  createGoal: (data: any) => createRow<BaserowGoal>(TABLE_IDS.goals, {
      [FIELD_IDS.goals.name]: data.name,
      [FIELD_IDS.goals.metric]: data.metric,
      [FIELD_IDS.goals.startDate]: data.startDate,
      [FIELD_IDS.goals.endDate]: data.endDate,
      [FIELD_IDS.goals.targetValue]: data.targetValue,
      [FIELD_IDS.goals.organization]: [data.organizationId],
      ...(data.sdrId !== 'team' && { [FIELD_IDS.goals.assignedTo]: [Number(data.sdrId)] }),
  }),
  
  updateGoal: (goalId: number, data: any) => updateRow(TABLE_IDS.goals, goalId, {
      [FIELD_IDS.goals.name]: data.name,
      [FIELD_IDS.goals.metric]: data.metric,
      [FIELD_IDS.goals.startDate]: data.startDate,
      [FIELD_IDS.goals.endDate]: data.endDate,
      [FIELD_IDS.goals.targetValue]: data.targetValue,
      ...(data.sdrId !== 'team' && { [FIELD_IDS.goals.assignedTo]: [Number(data.sdrId)] }),
      ...(data.sdrId === 'team' && { [FIELD_IDS.goals.assignedTo]: [] }),
  }),
  
  deleteGoal: (goalId: number) => deleteRow(TABLE_IDS.goals, goalId),

  async getGoalsWithProgress(organizationId: number, startDate: string, endDate: string): Promise<GoalData[]> {
    const allGoals = await listRows<BaserowGoal>(TABLE_IDS.goals, { [FIELD_IDS.goals.organization]: organizationId });
    const recordings = await this.getCallRecordings(organizationId);
    
    // Filtra as metas que estão ativas no período selecionado pelo gestor
    const relevantGoals = allGoals.filter(goal => {
      const goalStart = new Date(goal[FIELD_IDS.goals.startDate]);
      const goalEnd = new Date(goal[FIELD_IDS.goals.endDate]);
      const viewStart = new Date(startDate);
      const viewEnd = new Date(endDate);
      return goalStart <= viewEnd && goalEnd >= viewStart;
    });

    const goalsWithProgress = relevantGoals.map(rawGoal => {
      const goal = mapGoalFromBaserow(rawGoal);
      
      // Filtra as gravações que correspondem ao período e ao SDR da meta
      const relevantRecordings = recordings.filter(rec => {
        const callDate = new Date(rec[FIELD_IDS.callRecordings.callDate]);
        const sdrId = (rec[FIELD_IDS.callRecordings.sdr] as any[])?.[0]?.id;
        
        const isDateInRange = callDate >= new Date(goal.startDate) && callDate <= new Date(goal.endDate);
        const isSdrMatch = !goal.sdrId || goal.sdrId === sdrId;
        
        return isDateInRange && isSdrMatch;
      });

      // Lógica de cálculo (pode ser expandida)
      if (goal.metric.toLowerCase().includes('chamadas')) {
        goal.currentValue = relevantRecordings.length;
      }
      
      return goal;
    });

    return goalsWithProgress;
  },
  
  async getLeaderboardData(organizationId: number) {
    const [allSDRs, analyses] = await Promise.all([ this.getAllSDRs(organizationId), this.getCallAnalyses(organizationId) ]);
    const sdrScores: { [sdrId: number]: { totalScore: number; callCount: number } } = {};
    analyses.forEach(analysis => {
        const callRecordingInfo = (analysis[FIELD_IDS.analyses.callRecording] as any[])?.[0];
        if (callRecordingInfo) {
            const sdrId = (callRecordingInfo[FIELD_IDS.callRecordings.sdr] as any[])?.[0]?.id;
            if (sdrId) {
                if (!sdrScores[sdrId]) sdrScores[sdrId] = { totalScore: 0, callCount: 0 };
                sdrScores[sdrId].totalScore += analysis[FIELD_IDS.analyses.efficiencyScore] || 0;
                sdrScores[sdrId].callCount += 1;
            }
        }
    });
    const leaderboard = allSDRs.map(sdr => ({
      sdr_id: sdr.id, name: sdr.name, email: sdr.email,
      total_calls: sdrScores[sdr.id]?.callCount || 0,
      avg_score: sdrScores[sdr.id] && sdrScores[sdr.id].callCount > 0 ? Math.round(sdrScores[sdr.id].totalScore / sdrScores[sdr.id].callCount) : 0,
    }));
    return leaderboard.sort((a, b) => b.avg_score - a.avg_score).map((sdr, index) => ({ ...sdr, rank: index + 1 }));
  },
};