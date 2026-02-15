import { create } from "zustand";
import { api } from "../services/api";

export const usePrinterStore = create((set, get) => ({
  // State sederhana
  agents: [],
  selectedAgent: null,
  printers: [],
  agentDailyReports: {},
  monthlyReports: {},
  
  // Actions yang bener
  fetchAllAgents: async () => {
    const data = await api.getAllAgents(); // ✅ dari /api/agents
    
    const enrichedAgents = data.agents.map(agent => ({
      // === CORE FIELDS ===
      agentId: agent.id, // "AGENT_IBEBQNRH_CB7GYE"
      id: agent.id, // backup field
      name: agent.name, // "XBOOK_B14"
      company: agent.company, // "Kudukuats"
      department: agent.department, // "IT dev"
      departmentId: agent.departmentId, // 5
      
      // === CONNECTION INFO ===
      hostname: agent.hostname, // "XBOOK_B14"
      platform: agent.platform, // "win32"
      ip: agent.ip, // "127.0.0.1"
      status: agent.status, // "online"
      isOnline: agent.isOnline, // true (dari API)
      statusColor: agent.statusColor, // "success"
      
      // === STATISTICS ===
      printerCount: agent.printerCount, // 1
      pagesToday: agent.pagesToday || "0", // "0" (string dari API)
      printingCount: agent.printingCount || 0, // 0
      
      // === TIMESTAMPS ===
      lastSeen: agent.lastSeen, // "2026-02-11T04:52:35.000Z"
      registeredAt: agent.registeredAt, // "2026-02-11T03:55:39.000Z"
      
      // === FOR UI ===
      connected: agent.isOnline || false, // untuk compatibility
      location: "Unknown", // default (gak ada di API)
      customerId: "office-001", // default (gak ada di API)
    }));
    
    set({ agents: enrichedAgents });
    
    // Auto select pertama kalo belum ada
    if (enrichedAgents.length > 0 && !get().selectedAgent) {
      get().setSelectedAgent(enrichedAgents[0].agentId);
    }
    
    return enrichedAgents;
  },
  
  setSelectedAgent: async (agentId) => {
    const data = await api.getAgent(agentId); // ✅ dari /api/agents/{id}
    
    // Data agent detail dari API:
    // data.agent = { id, name, company, department, status, lastSeen, ... }
    // data.printers = array printer objects
    // data.statistics = { printerCount, totalPagesToday, ... }
    // data.system = { heartbeats, connections }
    
    set({
      selectedAgent: {
        // Gabungkan base agent data dengan detail
        ...get().agents.find(a => a.agentId === agentId),
        ...data.agent,
        // Tambah fields spesifik dari detail
        contactPerson: data.agent?.contactPerson,
        macAddress: data.agent?.macAddress,
        agentToken: data.agent?.agentToken,
        apiKey: data.agent?.apiKey,
      },
      printers: data.printers || [],
      statistics: data.statistics || {},
      systemInfo: data.system || {},
    });
  },
  
  // Daily reports untuk agent tertentu
  fetchAgentDailyReports: async (agentId) => {
    const data = await api.getAgentDailyReports(agentId);
    
    set(state => ({
      agentDailyReports: {
        ...state.agentDailyReports,
        [agentId]: data
      }
    }));
    
    return data;
  },
  
  // Monthly report
  fetchMonthlyReport: async (year, month) => {
    const data = await api.getMonthlyReport(year, month);
    
    set({
      monthlyReports: {
        ...get().monthlyReports,
        [`${year}-${month}`]: data
      }
    });
    
    return data;
  },
  
  // Helper untuk get printer berdasarkan nama
  getPrinterByName: (printerName) => {
    return get().printers.find(p => 
      p.name === printerName || 
      p.displayName === printerName
    );
  },
  
  // Total pages today dari semua printers
  getTotalPagesToday: () => {
    return get().printers.reduce(
      (total, printer) => total + (printer.pagesToday || 0),
      0
    );
  },
  
  // Get printers with issues
  getOfflinePrinters: () => {
    return get().printers.filter(p => 
      p.status !== "READY" && 
      p.status !== "ONLINE" &&
      p.status !== "ready" &&
      p.status !== "online"
    );
  },
  
  getPrintersWithLowInk: () => {
    return get().printers.filter(p => p.hasLowInk === true);
  },
  
  getPrintersWithCriticalInk: () => {
    return get().printers.filter(p => p.hasCriticalInk === true);
  },
  
  // Pause/resume printer (jika backend support)
  pausePrinter: async (agentId, printerName) => {
    try {
      const data = await api.pausePrinter(agentId, printerName);
      // Refresh printer list
      if (get().selectedAgent?.id === agentId) {
        setTimeout(() => get().setSelectedAgent(agentId), 1000);
      }
      return data;
    } catch (error) {
      console.error("Failed to pause printer:", error);
      throw error;
    }
  },
  
  resumePrinter: async (agentId, printerName) => {
    try {
      const data = await api.resumePrinter(agentId, printerName);
      // Refresh printer list
      if (get().selectedAgent?.id === agentId) {
        setTimeout(() => get().setSelectedAgent(agentId), 1000);
      }
      return data;
    } catch (error) {
      console.error("Failed to resume printer:", error);
      throw error;
    }
  },
  
  // Reset store
  reset: () => {
    set({
      agents: [],
      selectedAgent: null,
      printers: [],
      agentDailyReports: {},
      monthlyReports: {},
    });
  },
}));