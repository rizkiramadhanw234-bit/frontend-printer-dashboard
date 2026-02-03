const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const DASHBOARD_WS_URL =
  process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3002";

// Helper function untuk API calls
async function fetchAPI(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;

  const defaultOptions = {
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    ...options,
  };

  try {
    console.log(`🔗 API Request: ${url}`);
    const response = await fetch(url, defaultOptions);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `❌ API Error ${response.status}: ${errorText || response.statusText}`,
      );
      throw new Error(
        `API Error ${response.status}: ${errorText || response.statusText}`,
      );
    }

    const data = await response.json();
    console.log(`✅ API Response ${endpoint}:`, data);
    return data;
  } catch (error) {
    console.error(`❌ API call failed for ${endpoint}:`, error);
    throw error;
  }
}

// Main API exports
export const api = {
  // auth endpoints
  login: (email, password) =>
    fetchAPI("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    }),
  logout: () => fetchAPI("/api/auth/logout"),
  checkAuth: () => fetchAPI("/api/auth/check"),

  // Health endpoints
  getHealth: () => fetchAPI("/api/health"),

  // Agent endpoints
  getConnectedAgents: () => fetchAPI("/api/connected-agents"),
  getAgent: (agentId) => fetchAPI(`/api/agents/${agentId}`),

  // Printer endpoints
  getPrinter: (agentId, printerName) =>
    fetchAPI(
      `/api/agents/${agentId}/printer?name=${encodeURIComponent(printerName)}`,
    ),

  // Printer control
  pausePrinter: (agentId, printerName) =>
    fetchAPI(`/api/agents/${agentId}/printer/pause`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ printerName }),
    }),

  resumePrinter: (agentId, printerName) =>
    fetchAPI(`/api/agents/${agentId}/printer/resume`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ printerName }),
    }),

  // Report endpoints
  getDailyReport: () => fetchAPI("/api/reports/daily"),
  getAgentDailyReport: (agentId) => fetchAPI(`/api/reports/daily/${agentId}`),
  getMonthlyReport: (year, month) =>
    fetchAPI(`/api/reports/monthly?year=${year}&month=${month}`),
};

export default api;
