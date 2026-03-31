import { useAppStore } from '@/store/app.store';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:15000";

const getJWTToken = () => {
  try {
    const authStorage = localStorage.getItem('auth-storage');
    if (authStorage) {
      const parsed = JSON.parse(authStorage);
      const token = parsed?.state?.token;
      if (token) return token;
    }

    const legacyToken = localStorage.getItem('jwt_token');
    if (legacyToken) return legacyToken;

  } catch (e) {
    console.error('Error getting token:', e);
  }
  return null;
};

async function fetchAPI(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;

  const authType = options.authType || 'jwt';
  const agentId = options.agentId;

  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...options.headers
  };

  if (authType === 'jwt') {
    const token = getJWTToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  } else if (authType === 'apikey' && agentId) {
    const appState = useAppStore.getState();
    const apiKey = appState.agentsWithKeys?.[agentId];

    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
      console.log(`🔑 Using API key for agent ${agentId}`);
    } else {
      console.error(`❌ No API key found for agent ${agentId}`);
    }
  }

  console.log(`🌐 Fetching: ${url} with auth: ${authType}`);

  try {
    const res = await fetch(url, { headers, ...options });

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`❌ API Error ${res.status}:`, errorText);

      if (res.status === 401) {
        console.log('JWT token invalid');
        localStorage.removeItem('jwt_token');
      }

      throw new Error(`API Error ${res.status}: ${errorText}`);
    }

    const data = await res.json();
    console.log(`✅ API Success:`, endpoint.substring(0, 50), data);
    return data;

  } catch (error) {
    console.error(`❌ Network error for ${url}:`, error);
    throw error;
  }
}

export const api = {
  // ========== AUTH ==========
  login: (email, password) =>
    fetchAPI('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    }),

  logout: () => fetchAPI('/api/auth/logout', { method: 'POST' }),

  checkAuth: () => fetchAPI('/api/auth/check'),

  // ========== HEALTH & SYSTEM ==========
  getHealth: () => fetchAPI('/api/health'),
  getSystemInfo: () => fetchAPI('/api/system/info'),
  getWebsocketStatus: () => fetchAPI('/api/websocket/status'),

  // ========== AGENTS ==========
  getAllAgents: () => fetchAPI('/api/agents'),
  getAgent: (agentId) => fetchAPI(`/api/agents/${agentId}`),
  deleteAgent: (agentId) => fetchAPI(`/api/agents/${agentId}`, { method: 'DELETE' }),

  getAgentProfile: (agentToken) =>
    fetchAPI('/api/agents/agent/profile', {
      headers: { 'Authorization': `Bearer ${agentToken}` }
    }),

  getAgentApiKey: (agentId) =>
    fetchAPI(`/api/agents/${agentId}/api-key`),

  updateAgent: (id, data) =>
    fetchAPI(`/api/agents/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  // ========== PRINTERS ==========
  getAllPrinters: () => fetchAPI('/api/printers'),

  getAgentPrinters: (agentId) =>
    fetchAPI(`/api/agents/${agentId}/printers`, {
      authType: 'apikey',
      agentId
    }),

  getAgentPrinter: (agentId, printerName) =>
    fetchAPI(`/api/agents/${agentId}/printer?name=${encodeURIComponent(printerName)}`, {
      authType: 'apikey',
      agentId
    }),

  pausePrinter: (agentId, printerName) =>
    fetchAPI(`/api/agents/${agentId}/printer/pause`, {
      method: 'POST',
      authType: 'apikey',
      agentId,
      body: JSON.stringify({ printerName })
    }),

  resumePrinter: (agentId, printerName) =>
    fetchAPI(`/api/agents/${agentId}/printer/resume`, {
      method: 'POST',
      authType: 'apikey',
      agentId,
      body: JSON.stringify({ printerName })
    }),

  // ========== STATS ==========
  getAgentStats: () => fetchAPI('/api/stats/agents'),
  getPrintStats: () => fetchAPI('/api/stats/prints'),

  // ========== REPORTS ==========
  getDailyReport: (params = {}) => {
    const query = new URLSearchParams();
    if (params.date) query.append('date', params.date);
    if (params.agentId) query.append('agentId', params.agentId);
    if (params.companyId) query.append('companyId', params.companyId);
    return fetchAPI(`/api/reports/daily${query.toString() ? `?${query}` : ''}`);
  },

  getMonthlyReport: (year, month, params = {}) => {
    const query = new URLSearchParams({ year, month });
    if (params.agentId) query.append('agentId', params.agentId);
    if (params.companyId) query.append('companyId', params.companyId);
    return fetchAPI(`/api/reports/monthly?${query.toString()}`);
  },

  getPrinterLifetimeReport: (printerName) =>
    fetchAPI(`/api/reports/printer/${encodeURIComponent(printerName)}/lifetime`),

  getCompanyReport: (companyId, params = {}) => {
    const query = new URLSearchParams();
    if (params.startDate) query.append('startDate', params.startDate);
    if (params.endDate) query.append('endDate', params.endDate);
    return fetchAPI(`/api/reports/company/${companyId}${query.toString() ? `?${query}` : ''}`);
  },

  exportReport: (type, params = {}) => {
    const query = new URLSearchParams({ type });
    if (params.date) query.append('date', params.date);
    if (params.year) query.append('year', params.year);
    if (params.month) query.append('month', params.month);
    if (params.printerName) query.append('printerName', params.printerName);
    return fetchAPI(`/api/reports/export?${query.toString()}`);
  },

  // ========== COMPANY ==========
  getCompanies: () => fetchAPI('/api/company'),

  createCompany: (companyData) =>
    fetchAPI('/api/company', {
      method: 'POST',
      body: JSON.stringify(companyData)
    }),

  deleteCompany: (companyId) =>
    fetchAPI(`/api/company/${companyId}`, { method: 'DELETE' }),

  verifyCompanyLicense: (licenseKey) =>
    fetchAPI('/api/company/verify', {
      method: 'POST',
      body: JSON.stringify({ licenseKey })
    }),

  // ========== DEPARTMENT ==========
  getDepartments: (companyId) =>
    fetchAPI(`/api/departement/${companyId}`),

  createDepartment: (companyId, name) =>
    fetchAPI(`/api/company/${companyId}/departements`, {
      method: 'POST',
      body: JSON.stringify({ name })
    }),
};