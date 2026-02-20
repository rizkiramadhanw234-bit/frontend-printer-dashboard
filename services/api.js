const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://192.168.18.60:5000";

const getJWTToken = () => {
  const token = localStorage.getItem('jwt_token');
  console.log('🔑 JWT Token:', token ? token.substring(0, 20) + '...' : 'Tidak ada');
  return token;
};

// Helper buat dapetin API Key agent
const getAgentApiKey = (agentId) => {
  try {
    const store = JSON.parse(localStorage.getItem('app-storage') || '{}');
    return store.state?.agentsWithKeys?.[agentId];
  } catch (e) {
    return null;
  }
};

async function fetchAPI(endpoint, options = {}, useAgentKey = false, agentId = null) {
  const url = `${BASE_URL}${endpoint}`;

  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...options.headers
  };

  if (useAgentKey && agentId) {
    const agentKey = getAgentApiKey(agentId);
    if (agentKey) {
      headers['Authorization'] = `Bearer ${agentKey}`;
      console.log(`🔑 Using AGENT API key for ${agentId}`);
    } else {
      console.warn(`⚠️ No agent API key found for ${agentId}`);
    }
  }
  // 2. JWT Token (buat dashboard)
  else {
    const token = getJWTToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      console.log(`🔑 Using JWT token`);
    } else {
      console.warn(`⚠️ No JWT token found!`);
    }
  }

  console.log(`🌐 Fetching: ${url}`);

  const res = await fetch(url, { headers, ...options });

  if (!res.ok) {
    const errorText = await res.text();
    console.error(`❌ API Error ${res.status}:`, errorText);

    // Kalo 401 dan pake JWT, redirect ke login
    if (res.status === 401 && !useAgentKey) {
      console.log('🚫 JWT token invalid, redirecting to login...');
      localStorage.removeItem('jwt_token');
      window.location.href = '/login';
    }

    throw new Error(`API Error ${res.status}: ${errorText}`);
  }

  const data = await res.json();
  console.log(`✅ API Success:`, endpoint, data);
  return data;
}

export const api = {
  // ========== AUTH - PAKE JWT ==========
  login: (email, password) =>
    fetchAPI('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    }),

  logout: () => fetchAPI('/api/auth/logout', { method: 'POST' }),
  checkAuth: () => fetchAPI('/api/auth/check'),

  // ========== DASHBOARD ENDPOINTS - PAKE JWT ==========
  getAllAgents: () => fetchAPI('/api/agents'),
  getHealth: () => fetchAPI('/api/health'),
  getWebsocketStatus: () => fetchAPI('/api/websocket/status'),

  // GELL ALL PRINTERS
  getAllPrinters: () =>
    fetchAPI('/api/printers', {}, false, null),

  // ========== COMPANY & DEPARTEMENT - PAKE JWT ==========
  getCompanies: () => fetchAPI('/api/company'),
  getDepartments: (companyId) => fetchAPI(`/api/departement/${companyId}`),
  createDepartment: (companyId, name) =>
    fetchAPI(`/api/company/${companyId}/departements`, {
      method: 'POST',
      body: JSON.stringify({ name })
    }),

  // ========== AGENT DETAIL - PAKE AGENT API KEY ==========
  getAgent: (agentId) =>
    fetchAPI(`/api/agents/${agentId}`, {}, true, agentId),

  getAgentDailyReports: (agentId) =>
    fetchAPI(`/api/agents/${agentId}/daily-reports`, {}, true, agentId),

  // ========== PRINTER CONTROL - PAKE AGENT API KEY ==========
  pausePrinter: (agentId, printerName) =>
    fetchAPI(`/api/agents/${agentId}/printer/pause`, {
      method: 'POST',
      body: JSON.stringify({ printerName })
    }, true, agentId),

  resumePrinter: (agentId, printerName) =>
    fetchAPI(`/api/agents/${agentId}/printer/resume`, {
      method: 'POST',
      body: JSON.stringify({ printerName })
    }, true, agentId),

  // ========== REPORTS - PAKE JWT ==========
  getMonthlyReport: (year, month) =>
    fetchAPI(`/api/agents/reports/monthly?year=${year}&month=${month}`),

  createCompany: (companyData) =>
    fetchAPI('/api/company', {
      method: 'POST',
      body: JSON.stringify(companyData)
    }),

  deleteCompany: (companyId) =>
    fetchAPI(`/api/company/${companyId}`, {
      method: 'DELETE'
    }),
};
