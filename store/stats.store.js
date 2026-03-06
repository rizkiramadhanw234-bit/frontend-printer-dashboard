import { create } from "zustand";
import { api } from "../services/api";

export const useStatsStore = create((set, get) => ({
  // ========== STATE ==========
  
  agentStats: null,
  printStats: [],
  
  isLoading: false,
  error: null,
  
  lastUpdated: null,

  // ========== AGENT STATS ==========
  
  fetchAgentStats: async () => {
    try {
      set({ isLoading: true, error: null });
      
      const response = await api.getAgentStats();
      
      set({ 
        agentStats: response.stats,
        lastUpdated: new Date().toISOString(),
        isLoading: false 
      });

      console.log('✅ Loaded agent stats');
      return response.stats;
      
    } catch (error) {
      console.error("Failed to fetch agent stats:", error);
      set({ 
        error: error.message,
        isLoading: false,
        agentStats: null
      });
      throw error;
    }
  },

  // ========== PRINT STATS ==========
  
  fetchPrintStats: async () => {
    try {
      set({ isLoading: true, error: null });
      
      const response = await api.getPrintStats();
      
      set({ 
        printStats: response.stats || [],
        lastUpdated: new Date().toISOString(),
        isLoading: false 
      });

      console.log(`✅ Loaded ${response.count} print stats`);
      return response.stats;
      
    } catch (error) {
      console.error("Failed to fetch print stats:", error);
      set({ 
        error: error.message,
        isLoading: false,
        printStats: []
      });
      throw error;
    }
  },

  // ========== LOAD ALL STATS ==========
  
  fetchAllStats: async () => {
    try {
      set({ isLoading: true, error: null });
      
      await Promise.all([
        get().fetchAgentStats(),
        get().fetchPrintStats()
      ]);
      
      set({ isLoading: false });
      
    } catch (error) {
      console.error("Failed to fetch all stats:", error);
      set({ isLoading: false });
    }
  },

  // ========== GETTERS ==========
  
  getAgentStatsSummary: () => {
    const stats = get().agentStats;
    if (!stats) return null;

    return {
      total: stats.totalAgents || 0,
      online: parseInt(stats.onlineAgents) || 0,
      offline: parseInt(stats.offlineAgents) || 0,
      pending: parseInt(stats.pendingAgents) || 0,
      withPrinters: stats.agentsWithPrinters || 0,
      totalPrinters: stats.totalPrinters || 0,
      activePrinters: stats.activePrinters || 0,
      problemPrinters: stats.problemPrinters || 0
    };
  },

  getPrintStatsChartData: () => {
    const stats = get().printStats;
    if (!stats || stats.length === 0) return [];

    return stats.map(stat => ({
      date: new Date(stat.date).toLocaleDateString(),
      prints: stat.totalPrints || 0,
      pages: parseInt(stat.totalPages) || 0,
      agents: stat.uniqueAgents || 0,
      printers: stat.uniquePrinters || 0
    })).reverse(); // Reverse untuk chronological order
  },

  getTotalPagesAllTime: () => {
    const stats = get().printStats;
    if (!stats || stats.length === 0) return 0;

    return stats.reduce((total, stat) => 
      total + (parseInt(stat.totalPages) || 0), 0
    );
  },

  getTotalPrintsAllTime: () => {
    const stats = get().printStats;
    if (!stats || stats.length === 0) return 0;

    return stats.reduce((total, stat) => 
      total + (stat.totalPrints || 0), 0
    );
  },

  getAveragePagesPerDay: () => {
    const stats = get().printStats;
    if (!stats || stats.length === 0) return 0;

    const totalPages = get().getTotalPagesAllTime();
    return Math.round(totalPages / stats.length);
  },

  getAveragePrintsPerDay: () => {
    const stats = get().printStats;
    if (!stats || stats.length === 0) return 0;

    const totalPrints = get().getTotalPrintsAllTime();
    return Math.round(totalPrints / stats.length);
  },

  // ========== UTILS ==========

  refresh: async () => {
    await get().fetchAllStats();
  },

  reset: () => {
    set({
      agentStats: null,
      printStats: [],
      isLoading: false,
      error: null,
      lastUpdated: null
    });
  }
}));