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
  [FIELD_IDS.goals.metric]: { value: string };
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
  sdrId?: number;
  sdrName?: string;
}
export interface SpinAnalysisData {
  situation: { score: number; feedback: string; excerpts: string[] };
  problem: { score: number; feedback: string; excerpts: string[] };
  implication: { score: number; feedback: string; excerpts: string[] };
  need_payoff: { score: number; feedback: string; excerpts: string[] };
}
export interface PlaybookRule {
    id: number;
    rule_type: { id: number, value: string };
    keyword_trigger: string;
    description: string;
}
export interface Playbook {
    id: number;
    name: string;
    rules: PlaybookRule[];
}

// --- Configuração da API ---
const BASE_URL = import.meta.env.VITE_BASEROW_API_URL;
const API_TOKEN = import.meta.env.VITE_BASEROW_API_TOKEN;

const TABLE_IDS = {
  users: import.meta.env.VITE_BASEROW_TABLE_USERS,
  organizations: import.meta.env.VITE_BASEROW_TABLE_ORGANIZATIONS,
  callRecordings: import.meta.env.VITE_BASEROW_TABLE_CALL_RECORDINGS,
  analyses: import.meta.env.VITE_BASEROW_TABLE_ANALYSES,
  goals: import.meta.env.VITE_BASEROW_TABLE_METAS,
  playbooks: '703',
  playbookRules: '704',
};

export const FIELD_IDS = {
  users: { name: 'field_6779', email: 'field_6753', passwordHash: 'field_6754', appRole: 'field_6759', organization: 'field_6760' },
  organizations: { name: 'field_6746', owner: 'field_6761' },
  callRecordings: { prospectName: 'field_6757', sdr: 'field_6758', organization: 'field_6767', audioUrl: 'field_6769', duration: 'field_6781', callDate: 'field_6768' },
  analyses: { callRecording: 'field_6773', organization: 'field_6780', managerFeedback: 'field_6782', efficiencyScore: 'field_6776', spinAnalysis: 'field_6793', playbookAnalysis: 'field_6805', full_transcript: 'field_6806' },
  goals: {
    name: 'field_6783',
    metric: 'field_6784',
    startDate: 'field_6785',
    endDate: 'field_6786',
    targetValue: 'field_6787',
    assignedTo: 'field_6788',
    organization: 'field_6790'
  },
  playbooks: {
    name: 'field_6795',
    organization: 'field_6796',
    rules: 'field_6802',
  },
  playbookRules: {
    playbook: 'field_6799',
    rule_type: 'field_6800',
    keyword_trigger: 'field_6803',
    description: 'field_6804',
  }
};
const ROLE_OPTION_IDS = {
    administrator: 2994,
    sdr: 2995,
};
const headers = { 'Authorization': `Token ${API_TOKEN}`, 'Content-Type': 'application/json' };

async function apiCall(url: string, options: RequestInit) {
    try {
        const response = await fetch(url, options);
        const text = await response.text();
        if (!response.ok) {
            let errorBody;
            try {
                errorBody = JSON.parse(text);
            } catch (e) {
                console.error(`ERRO 500 ou outro erro de servidor. Resposta recebida:`, text);
                throw new Error(`Erro de Servidor: ${response.status} ${response.statusText}. Verifique o console para a resposta completa.`);
            }
            throw new Error(`Falha na API: ${errorBody.detail || errorBody.error || response.statusText}`);
        }
        return text ? JSON.parse(text) : {};
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Erro de comunicação com o servidor.";
        toast.error(errorMessage);
        throw error;
    }
}

async function getRow<T>(tableId: string, rowId: number): Promise<T> {
  return apiCall(`${BASE_URL}/api/database/rows/table/${tableId}/${rowId}/?user_field_names=false`, { method: 'GET', headers });
}
async function createRow<T>(tableId: string, rowData: any): Promise<T> {
  return apiCall(`${BASE_URL}/api/database/rows/table/${tableId}/?user_field_names=false`, { method: 'POST', headers, body: JSON.stringify(rowData) });
}
async function listAllRows<T>(tableId: string): Promise<T[]> {
  const url = new URL(`${BASE_URL}/api/database/rows/table/${tableId}/?user_field_names=false&size=200`);
  const data = await apiCall(url.toString(), { method: 'GET', headers });
  return data.results as T[];
}
async function updateRow(tableId: string, rowId: number, rowData: any): Promise<any> {
  return apiCall(`${BASE_URL}/api/database/rows/table/${tableId}/${rowId}/?user_field_names=false`, { method: 'PATCH', headers, body: JSON.stringify(rowData) });
}
async function deleteRow(tableId: string, rowId: number): Promise<void> {
  await apiCall(`${BASE_URL}/api/database/rows/table/${tableId}/${rowId}/`, { method: 'DELETE', headers });
}

function mapFromBaserow(rawUser: BaserowObject): AppUserObject {
    return { id: rawUser.id, name: rawUser[FIELD_IDS.users.name], email: rawUser[FIELD_IDS.users.email] };
}
function mapGoalFromBaserow(rawGoal: BaserowGoal): GoalData {
    const assignedSdr = rawGoal[FIELD_IDS.goals.assignedTo]?.[0];
    return {
        id: rawGoal.id,
        name: rawGoal[FIELD_IDS.goals.name],
        metric: rawGoal[FIELD_IDS.goals.metric]?.value,
        startDate: rawGoal[FIELD_IDS.goals.startDate],
        endDate: rawGoal[FIELD_IDS.goals.endDate],
        targetValue: rawGoal[FIELD_IDS.goals.targetValue],
        sdrId: assignedSdr ? assignedSdr.id : undefined,
        sdrName: assignedSdr ? assignedSdr.value : 'Equipe Inteira',
        currentValue: 0,
    };
}

export const baserowService = {
  async signIn(email: string, password: string) {
    const allUsers = await listAllRows<BaserowObject>(TABLE_IDS.users);
    const user = allUsers.find(u => u[FIELD_IDS.users.email] === email);
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

  async uploadFile(file: File): Promise<{ name: string }> {
    const formData = new FormData();
    formData.append('file', file);
    const uploadHeaders = { 'Authorization': `Token ${API_TOKEN}` };
    const response = await fetch(`${BASE_URL}/api/user-files/upload-file/`, {
      method: 'POST',
      headers: uploadHeaders,
      body: formData,
    });
    if (!response.ok) {
      const errorBody = await response.json();
      console.error("Erro detalhado do upload:", errorBody);
      throw new Error(errorBody.detail?.error || 'Falha no upload. Verifique a configuração de CORS no servidor Baserow.');
    }
    const result = await response.json();
    return { name: result.name };
  },

  async createCallRecording(data: {
    prospectName: string;
    sdrId: number;
    organizationId: number;
    duration: number;
    fileData: { name: string }[];
  }) {
    const rowData = {
      [FIELD_IDS.callRecordings.prospectName]: data.prospectName,
      [FIELD_IDS.callRecordings.sdr]: [data.sdrId],
      [FIELD_IDS.callRecordings.organization]: [data.organizationId],
      [FIELD_IDS.callRecordings.duration]: data.duration,
      [FIELD_IDS.callRecordings.audioUrl]: data.fileData,
      [FIELD_IDS.callRecordings.callDate]: new Date().toISOString(),
    };
    return createRow(TABLE_IDS.callRecordings, rowData);
  },

  async createSDR(data: { name: string; email: string; password: string; organizationId: number; }) {
    const allUsers = await listAllRows<BaserowObject>(TABLE_IDS.users);
    const existingUser = allUsers.find(u => u[FIELD_IDS.users.email] === data.email);
    if (existingUser) throw new Error(`O email '${data.email}' já está registado no sistema.`);
    const passwordHash = await bcrypt.hash(data.password, 10);
    const newSdrRow = {
        [FIELD_IDS.users.name]: data.name, [FIELD_IDS.users.email]: data.email,
        [FIELD_IDS.users.passwordHash]: passwordHash, [FIELD_IDS.users.appRole]: ROLE_OPTION_IDS.sdr,
        [FIELD_IDS.users.organization]: [data.organizationId],
    };
    await createRow(TABLE_IDS.users, newSdrRow);
  },
  async getAllSDRs(organizationId: number): Promise<AppUserObject[]> {
    const allUsers = await listAllRows<BaserowObject>(TABLE_IDS.users);
    const sdrsForOrg = allUsers.filter(user => {
        const userOrg = (user[FIELD_IDS.users.organization] as any[])?.[0];
        const userRole = (user[FIELD_IDS.users.appRole] as {id: number})?.id;
        return userOrg?.id === organizationId && userRole === ROLE_OPTION_IDS.sdr;
    });
    return sdrsForOrg.map(mapFromBaserow);
  },
  deleteSDR: (sdrId: number) => deleteRow(TABLE_IDS.users, sdrId),
  updateSDR: (sdrId: number, data: { name?: string; email?: string }) => {
    const rowData: { [key: string]: any } = {};
    if (data.name) rowData[FIELD_IDS.users.name] = data.name;
    if (data.email) rowData[FIELD_IDS.users.email] = data.email;
    return updateRow(TABLE_IDS.users, sdrId, rowData);
  },
  getCallRecordings: (organizationId: number, sdrId?: number) => listAllRows<BaserowCallRecording>(TABLE_IDS.callRecordings).then(recordings => {
      const recordingsForOrg = recordings.filter(rec => (rec[FIELD_IDS.callRecordings.organization] as any[])?.[0]?.id === organizationId);
      if (!sdrId) return recordingsForOrg;
      return recordingsForOrg.filter(rec => (rec[FIELD_IDS.callRecordings.sdr] as any[])?.[0]?.id === sdrId);
  }),
  getCallAnalyses: (organizationId: number, sdrId?: number) => listAllRows<BaserowCallAnalysis>(TABLE_IDS.analyses).then(analyses => {
      const analysesForOrg = analyses.filter(analysis => (analysis[FIELD_IDS.analyses.organization] as any[])?.[0]?.id === organizationId);
      if (!sdrId) return analysesForOrg;
      return analysesForOrg.filter(analysis => {
        const callRecording = (analysis[FIELD_IDS.analyses.callRecording] as any[])?.[0];
        return callRecording?.[FIELD_IDS.callRecordings.sdr]?.[0]?.id === sdrId;
      });
  }),
  getCallRecordingById: (recordingId: number) => getRow<BaserowCallRecording>(TABLE_IDS.callRecordings, recordingId),
  getAnalysisByRecordingId: (recordingId: number) => listAllRows<BaserowCallAnalysis>(TABLE_IDS.analyses).then(res => res.find(a => a[FIELD_IDS.analyses.callRecording]?.[0]?.id === recordingId) || null),
  getSDRById: (sdrId: number) => getRow<BaserowUser>(TABLE_IDS.users, sdrId),
  updateManagerFeedback: (analysisId: number, feedback: string) => updateRow(TABLE_IDS.analyses, analysisId, { [FIELD_IDS.analyses.managerFeedback]: feedback }),
  updateAnalysisData: (analysisId: number, data: { spinAnalysis: any, playbookAnalysis: any }) => {
    return updateRow(TABLE_IDS.analyses, analysisId, {
      [FIELD_IDS.analyses.spinAnalysis]: JSON.stringify(data.spinAnalysis),
      [FIELD_IDS.analyses.playbookAnalysis]: JSON.stringify(data.playbookAnalysis),
    });
  },
  async signUpAdmin(data: { name: string; email: string; password: string; companyName: string }) {
    const allUsers = await listAllRows<BaserowObject>(TABLE_IDS.users);
    const existingUser = allUsers.find(u => u[FIELD_IDS.users.email] === data.email);
    if (existingUser) throw new Error("Este endereço de email já está em uso.");
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
  async getMetricOptions(): Promise<{id: number, value: string}[]> {
      const url = `${BASE_URL}/api/database/fields/table/${TABLE_IDS.goals}/`;
      const fields = await apiCall(url, { method: 'GET', headers });
      const metricField = fields.find((f: any) => f.id === parseInt(FIELD_IDS.goals.metric.replace('field_', ''), 10));
      return metricField?.select_options || [];
  },
  async createGoal(data: { name: string; metric: string; startDate: string; endDate: string; targetValue: number; sdrId: string; organizationId: number; }) {
      const metricOptions = await this.getMetricOptions();
      const metricOption = metricOptions.find(opt => opt.value === data.metric);
      if (!metricOption) throw new Error("Métrica selecionada é inválida.");
      const newGoalRow = {
        [FIELD_IDS.goals.name]: data.name,
        [FIELD_IDS.goals.metric]: { id: metricOption.id },
        [FIELD_IDS.goals.startDate]: data.startDate,
        [FIELD_IDS.goals.endDate]: data.endDate,
        [FIELD_IDS.goals.targetValue]: data.targetValue,
        [FIELD_IDS.goals.organization]: [data.organizationId],
        ...(data.sdrId !== 'team' && { [FIELD_IDS.goals.assignedTo]: [Number(data.sdrId)] }),
      };
      return createRow(TABLE_IDS.goals, newGoalRow);
  },
  getGoals: (organizationId: number) => listAllRows<BaserowGoal>(TABLE_IDS.goals).then(goals => goals.filter(goal => (goal[FIELD_IDS.goals.organization] as any[])?.[0]?.id === organizationId).map(mapGoalFromBaserow)),
  updateGoal: (goalId: number, dataToUpdate: object) => updateRow(TABLE_IDS.goals, goalId, dataToUpdate),
  deleteGoal: (goalId: number) => deleteRow(TABLE_IDS.goals, goalId),
  async getLeaderboardData(organizationId: number) {
    const [allSDRs, analyses] = await Promise.all([this.getAllSDRs(organizationId), this.getCallAnalyses(organizationId)]);
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
  getPlaybooksByOrg: (organizationId: number) => listAllRows<Playbook>(TABLE_IDS.playbooks).then(playbooks => playbooks.filter(p => p[FIELD_IDS.playbooks.organization]?.[0]?.id === organizationId)),
  createPlaybook: (name: string, organizationId: number) => createRow<Playbook>(TABLE_IDS.playbooks, {
      [FIELD_IDS.playbooks.name]: name,
      [FIELD_IDS.playbooks.organization]: [organizationId],
  }),
  deletePlaybook: (playbookId: number) => deleteRow(TABLE_IDS.playbooks, playbookId),
  addPlaybookRule: (playbookId: number, rule: any) => createRow(TABLE_IDS.playbookRules, {
      [FIELD_IDS.playbookRules.playbook]: [playbookId],
      [FIELD_IDS.playbookRules.rule_type]: { value: rule.rule_type },
      [FIELD_IDS.playbookRules.keyword_trigger]: rule.keyword_trigger,
      [FIELD_IDS.playbookRules.description]: rule.description,
  }),
  updatePlaybookRule: (ruleId: number, rule: any) => updateRow(TABLE_IDS.playbookRules, ruleId, {
      [FIELD_IDS.playbookRules.rule_type]: { value: rule.rule_type },
      [FIELD_IDS.playbookRules.keyword_trigger]: rule.keyword_trigger,
      [FIELD_IDS.playbookRules.description]: rule.description,
  }),
  deletePlaybookRule: (ruleId: number) => deleteRow(TABLE_IDS.playbookRules, ruleId),
  
  // NOVA FUNÇÃO PARA O LEITOR DE ÁUDIO
  async fetchProtectedFile(fileUrl: string): Promise<Blob> {
    const response = await fetch(fileUrl, {
      headers: { 'Authorization': `Token ${API_TOKEN}` },
    });
    if (!response.ok) {
      throw new Error('Falha ao descarregar o ficheiro protegido.');
    }
    return response.blob();
  },
};