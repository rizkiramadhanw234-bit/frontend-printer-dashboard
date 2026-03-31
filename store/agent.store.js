import { create } from "zustand";
import { api } from "../services/api";
import { persist } from "zustand/middleware";

export const useAppStore = create(
  persist(
    (set, get) => ({
      // State
      agents: [],
      agentsWithKeys: {},
      printers: [],
      selectedAgentId: null,
      health: null,
      companies: [],
      departments: [],
      monthlyReport: null,
      isLoading: false,
      error: null,

      // ========== AGENTS ==========
      loadAgents: async () => {
        try {
          set({ isLoading: true, error: null });

          const res = await api.getAllAgents();
          const agents = res.agents || [];

          // Simpan API key per agent
          const agentsWithKeys = {};
          agents.forEach(agent => {
            // API Key ada di endpoint detail, belum di list
            // Nanti akan diisi pas load agent detail
            agentsWithKeys[agent.id] = null;
          });

          set({
            agents,
            agentsWithKeys,
            isLoading: false
          });

          return agents;

        } catch (error) {
          console.error("Failed to load agents:", error);
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      selectAgent: async (agentId) => {
        try {
          set({ selectedAgentId: agentId, isLoading: true });

          const res = await api.getAgent(agentId);

          if (res.success) {
            const agentApiKey = res.agent?.apiKey;

            set(state => ({
              printers: res.printers || [],
              agentsWithKeys: {
                ...state.agentsWithKeys,
                [agentId]: agentApiKey
              },
              isLoading: false
            }));

          }
        } catch (error) {
          console.error(`Failed to load agent ${agentId}:`, error);
          set({ error: error.message, isLoading: false, printers: [] });
          throw error;
        }
      },

      // ========== COMPANY & DEPARTEMENT ==========
      loadCompanies: async () => {
        try {
          const res = await api.getCompanies();
          set({ companies: res.data || [] });
          return res.data;
        } catch (error) {
          console.error("Failed to load companies:", error);
          throw error;
        }
      },

      createCompany: async (companyData) => {
        try {
          const res = await api.createCompany(companyData);
          await get().loadCompanies();
          return res;
        } catch (error) {
          console.error("Failed to create company:", error);
          throw error;
        }
      },
      deleteCompany: async (companyId) => {
        try {
          const res = await api.deleteCompany(companyId);
          await get().loadCompanies();
          return res;
        } catch (error) {
          console.error("Failed to delete company:", error);
          throw error;
        }
      },

      loadDepartments: async (companyId) => {
        try {
          const res = await api.getDepartments(companyId);
          set({ departments: res.data || [] });
          return res.data;
        } catch (error) {
          console.error("Failed to load departments:", error);
          throw error;
        }
      },

      createDepartment: async (companyId, name) => {
        try {
          const res = await api.createDepartment(companyId, name);
          // Refresh departments
          await get().loadDepartments(companyId);
          return res;
        } catch (error) {
          console.error("Failed to create department:", error);
          throw error;
        }
      },

      // ========== REPORTS ==========
      loadMonthlyReport: async (year, month) => {
        try {
          const res = await api.getMonthlyReport(year, month);
          set({ monthlyReport: res });
          return res;
        } catch (error) {
          console.error("Failed to load monthly report:", error);
          throw error;
        }
      },

      loadDailyReports: async (agentId) => {
        try {
          const res = await api.getAgentDailyReports(agentId);
          return res;
        } catch (error) {
          console.error("Failed to load daily reports:", error);
          throw error;
        }
      },

      // ========== SYSTEM ==========
      loadHealth: async () => {
        try {
          const res = await api.getHealth();
          set({ health: res });
          return res;
        } catch (error) {
          console.error("Failed to load health:", error);
          throw error;
        }
      },

      // ========== DASHBOARD ==========
      loadDashboard: async () => {
        await Promise.all([
          get().loadAgents(),
          get().loadHealth()
        ]);
      },

      // ========== GETTERS ==========
      selectedAgent: () => {
        const { agents, selectedAgentId } = get();
        return agents.find(a => a.id === selectedAgentId) || null;
      },

      getAgentApiKey: (agentId) => {
        return get().agentsWithKeys[agentId];
      },

      getStats: () => {
        const printers = get().printers;
        return {
          total: printers.length,
          online: printers.filter(p =>
            p.status === "READY" || p.status === "online" || p.status === "printing"
          ).length,
          offline: printers.filter(p =>
            p.status !== "READY" &&
            p.status !== "online" &&
            p.status !== "printing"
          ).length,
          lowInk: printers.filter(p => p.hasLowInk).length,
          criticalInk: printers.filter(p => p.hasCriticalInk).length,
          pagesToday: printers.reduce((sum, p) => sum + (p.pagesToday || 0), 0)
        };
      },

      refresh: async () => {
        await get().loadDashboard();
        const { selectedAgentId } = get();
        if (selectedAgentId) {
          await get().selectAgent(selectedAgentId);
        }
      }
    }),
    {
      name: "app-storage",
      getStorage: () => localStorage,
      partialize: (state) => ({
        agents: state.agents,
        agentsWithKeys: state.agentsWithKeys,
        companies: state.companies,
        departments: state.departments
      })
    }
  )
);