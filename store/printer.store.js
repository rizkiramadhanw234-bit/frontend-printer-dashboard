import { create } from "zustand";
import { api } from "../services/api";

export const usePrinterStore = create((set, get) => ({
  // State
  agents: [],
  selectedAgent: null,
  printers: [],
  dailyReport: {},
  monthlyReport: {},
  alerts: [],
  isLoading: false,
  error: null,
  lastUpdated: null,
  lastFetchTime: 0, 

  // Actions
  fetchConnectedAgents: async () => {
    try {
      const now = Date.now();
      if (now - get().lastFetchTime < 2000 && get().agents.length > 0) {
        console.log("⏸️ Skipping agents fetch - too soon");
        return get().agents;
      }

      console.log("🔄 Fetching connected agents...");
      set({ isLoading: true, error: null });

      const data = await api.getConnectedAgents();

      if (data.success) {
        console.log("✅ Agents fetched:", data.agents?.length);

        // ✅ ENRICH agents
        const enrichedAgents = (data.agents || []).map((agent) => ({
          ...agent,
          agentId: agent.id || agent.agentId,
          location: agent.location || "Jakarta Office",
          company: agent.company || "PT. Kudukuats",
          department: agent.department || "IT Department",
          printerCount: agent.printerCount || 0,
          status: agent.status || "unknown",
          lastSeen: agent.lastSeen || new Date().toISOString(),
        }));

        // Set agent pertama sebagai selected jika ada
        const currentSelected = get().selectedAgent;
        let selected = currentSelected;

        if (!currentSelected && enrichedAgents.length > 0) {
          selected = enrichedAgents[0];
        }

        set({
          agents: enrichedAgents,
          selectedAgent: selected,
          lastUpdated: data.timestamp,
          lastFetchTime: now,
          isLoading: false,
        });

        // Jika ada agent yang dipilih, fetch printers-nya
        if (selected && selected.agentId) {
          console.log(`🔧 Fetching printers for agent: ${selected.agentId}`);
          await get().fetchAgentPrinters(selected.agentId);
        }

        return enrichedAgents;
      }

      throw new Error(data.message || "Failed to fetch agents");
    } catch (error) {
      console.error("❌ Failed to fetch agents:", error);
      set({
        error: error.message,
        isLoading: false,
      });
      throw error;
    }
  },

  fetchAgentPrinters: async (agentId) => {
    try {
      // ⚠️ VALIDASI: agentId harus ada
      if (!agentId) {
        console.error("❌ Agent ID is required");
        throw new Error("Agent ID is required");
      }

      // ⚠️ DEBOUNCE: Jangan fetch terlalu sering untuk agent yang sama
      const now = Date.now();
      const state = get();
      if (now - state.lastFetchTime < 3000 && state.printers.length > 0) {
        console.log("⏸️ Skipping printer fetch - too soon");
        return state.printers;
      }

      console.log(`🔄 Fetching printers for agent ${agentId}...`);
      set({ isLoading: true, error: null });

      const data = await api.getAgent(agentId);

      if (data.success) {
        console.log("✅ Agent data fetched, printers:", data.printers?.length);

        // ✅ Update selectedAgent dengan data detail
        const currentSelected = state.selectedAgent;
        if (currentSelected && currentSelected.agentId === agentId) {
          set({
            selectedAgent: {
              ...currentSelected,
              name: data.agent?.name || currentSelected.name,
              company: data.agent?.company || currentSelected.company,
              location: data.agent?.location || currentSelected.location,
              printerCount: data.printers?.length || 0,
            },
          });
        }

        set({
          printers: data.printers || [],
          isLoading: false,
          lastUpdated: data.timestamp,
          lastFetchTime: now,
          error: null,
        });

        console.log("✅ Printer fetch complete");
        return data.printers;
      }

      throw new Error(data.message || "Failed to fetch agent printers");
    } catch (error) {
      console.error(`❌ Failed to fetch printers for agent ${agentId}:`, error);

      set({
        error: error.message,
        isLoading: false,
        printers: [],
      });

      throw error;
    }
  },

  fetchDailyReport: async () => {
    try {
      console.log("🔄 Fetching daily report...");
      const data = await api.getDailyReport();

      if (data.success) {
        console.log("✅ Daily report fetched");
        set({
          dailyReport: data,
        });
        return data;
      }

      return {};
    } catch (error) {
      console.error("❌ Failed to fetch daily report:", error);
      return {};
    }
  },

  fetchMonthlyReport: async (year, month) => {
    try {
      console.log(`🔄 Fetching monthly report for ${year}-${month}...`);
      const data = await api.getMonthlyReport(year, month);

      if (data.success) {
        console.log("✅ Monthly report fetched");
        set({
          monthlyReport: data,
        });
        return data;
      }

      return {};
    } catch (error) {
      console.error("❌ Failed to fetch monthly report:", error);
      return {};
    }
  },

  pausePrinter: async (agentId, printerName) => {
    try {
      console.log(`🔄 Pausing printer ${printerName} on agent ${agentId}...`);
      const data = await api.pausePrinter(agentId, printerName);

      if (data.success) {
        console.log("✅ Printer paused:", data.message);
        // Refresh printer status dengan delay
        setTimeout(() => {
          get().fetchAgentPrinters(agentId);
        }, 1000);
        return data;
      }

      throw new Error(data.message || "Failed to pause printer");
    } catch (error) {
      console.error("❌ Failed to pause printer:", error);
      throw error;
    }
  },

  resumePrinter: async (agentId, printerName) => {
    try {
      console.log(`🔄 Resuming printer ${printerName} on agent ${agentId}...`);
      const data = await api.resumePrinter(agentId, printerName);

      if (data.success) {
        console.log("✅ Printer resumed:", data.message);
        // Refresh printer status dengan delay
        setTimeout(() => {
          get().fetchAgentPrinters(agentId);
        }, 1000);
        return data;
      }

      throw new Error(data.message || "Failed to resume printer");
    } catch (error) {
      console.error("❌ Failed to resume printer:", error);
      throw error;
    }
  },

  // Helper getters
  getPrinterByName: (name) => {
    return get().printers.find((p) => p.name === name);
  },

  getSelectedAgent: () => {
    return get().selectedAgent;
  },

  getAgentById: (agentId) => {
    return get().agents.find((a) => a.agentId === agentId || a.id === agentId);
  },

  setSelectedAgent: (agentId) => {
    if (!agentId) {
      console.error("❌ Cannot set selected agent: agentId is required");
      return;
    }

    const agent = get().agents.find((a) => a.agentId === agentId);
    if (agent) {
      console.log(`🔧 Setting selected agent to: ${agentId}`);
      set({ selectedAgent: agent });
      // Fetch printers dengan sedikit delay
      setTimeout(() => {
        get().fetchAgentPrinters(agentId);
      }, 300);
    } else {
      console.error(`❌ Agent ${agentId} not found in agents list`);
    }
  },

  getTotalPagesToday: () => {
    const printers = get().printers;
    if (!Array.isArray(printers)) return 0;
    return printers.reduce(
      (total, printer) => total + (printer.pagesToday || 0),
      0,
    );
  },

  getOfflinePrinters: () => {
    const printers = get().printers;
    if (!Array.isArray(printers)) return [];
    return printers.filter(
      (p) =>
        p.status !== "ready" &&
        p.status !== "printing" &&
        p.status !== "online",
    );
  },

  getPrintersWithLowInk: () => {
    const printers = get().printers;
    if (!Array.isArray(printers)) return [];
    return printers.filter((p) => p.hasLowInk === true);
  },

  getPrintersWithCriticalInk: () => {
    const printers = get().printers;
    if (!Array.isArray(printers)) return [];
    return printers.filter((p) => p.hasCriticalInk === true);
  },

  clearAlerts: () => {
    set({ alerts: [] });
  },

  reset: () => {
    set({
      agents: [],
      selectedAgent: null,
      printers: [],
      dailyReport: {},
      monthlyReport: {},
      alerts: [],
      isLoading: false,
      error: null,
      lastUpdated: null,
      lastFetchTime: 0,
    });
  },
}));
