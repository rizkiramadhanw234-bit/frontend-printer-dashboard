import { create } from "zustand";
import { api } from "../services/api";
import { persist } from "zustand/middleware";

export const useAppStore = create(
  persist(
    (set, get) => ({
      // ========== STATE ==========
      agents: [],
      agentsWithKeys: {},
      printers: [],
      selectedAgentId: null,
      health: null,

      companies: [],
      departments: [],
      selectedCompanyId: null,

      isLoading: false,
      error: null,

      // ========== ACTIONS ==========

      // 1. LOAD ALL AGENTS (pake JWT)
      loadAgents: async () => {
        try {
          set({ isLoading: true, error: null });

          const res = await api.getAllAgents();
          const agents = res.agents || [];

          set({
            agents,
            isLoading: false
          });

          console.log(`✅ Loaded ${agents.length} agents`);
          return agents;

        } catch (error) {
          console.error("Failed to load agents:", error);
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      // 2. GET AGENT API KEY (pake JWT)
      getAgentApiKey: async (agentId) => {
        try {
          console.log(`🔑 Fetching API key for ${agentId}...`);

          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://192.168.18.60:5000"}/api/agents/${agentId}/api-key`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`,
              'Content-Type': 'application/json'
            }
          });

          if (!res.ok) {
            throw new Error(`Failed to fetch API key: ${res.status}`);
          }

          const data = await res.json();

          if (data.success && data.apiKey) {
            set(state => ({
              agentsWithKeys: {
                ...state.agentsWithKeys,
                [agentId]: data.apiKey
              }
            }));

            console.log(`✅ API Key for ${agentId} saved`);
            return data.apiKey;
          }

          throw new Error('No API key in response');

        } catch (error) {
          console.error(`❌ Failed to get API key for ${agentId}:`, error);
          return null;
        }
      },

      // 3. SELECT AGENT & LOAD PRINTERS
      selectAgent: async (agentId) => {
        if (!agentId) return;

        try {
          set({ selectedAgentId: agentId, isLoading: true });

          // =========================================
          // STEP 1: DAPETIN API KEY
          // =========================================
          let agentApiKey = get().agentsWithKeys[agentId];

          if (!agentApiKey) {
            agentApiKey = await get().getAgentApiKey(agentId);
          }

          if (!agentApiKey) {
            throw new Error(`No API key available for agent ${agentId}`);
          }

          // =========================================
          // STEP 2: FETCH AGENT DETAIL PAKE API KEY
          // =========================================
          console.log(`🔄 Fetching agent ${agentId} with API key`);

          // PAKE FETCH LANGSUNG BIAR GAK RIBET
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://192.168.18.60:5000"}/api/agents/${agentId}`, {
            headers: {
              'Authorization': `Bearer ${agentApiKey}`,
              'Content-Type': 'application/json'
            }
          });

          if (!res.ok) {
            throw new Error(`Failed to fetch agent: ${res.status}`);
          }

          const data = await res.json();

          if (data.success) {
            set({
              printers: data.printers || [],
              isLoading: false
            });

            console.log(`✅ Loaded ${data.printers?.length || 0} printers for ${agentId}`);
            return data;
          }

        } catch (error) {
          console.error(`❌ Failed to load agent ${agentId}:`, error);
          set({
            error: error.message,
            isLoading: false,
            printers: []
          });
          throw error;
        }
      },

      // 4. LOAD HEALTH
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

      // 5. LOAD DASHBOARD
      loadDashboard: async () => {
        try {
          set({ isLoading: true });

          await Promise.all([
            get().loadAgents(),
            get().loadHealth()
          ]);

          // Auto-select first agent
          const { agents, selectedAgentId } = get();
          if (agents.length > 0 && !selectedAgentId) {
            await get().selectAgent(agents[0].id);
          }

        } catch (error) {
          console.error("Failed to load dashboard:", error);
        } finally {
          set({ isLoading: false });
        }
      },

      // ========== COMPANY ACTIONS ==========
      loadCompanies: async () => {
        try {
          set({ isLoading: true, error: null });
          const res = await api.getCompanies();
          set({
            companies: res.data || [],
            isLoading: false
          });
          return res.data;
        } catch (error) {
          console.error("Failed to load companies:", error);
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      createCompany: async (companyData) => {
        try {
          set({ isLoading: true, error: null });
          const res = await api.createCompany(companyData);
          await get().loadCompanies();
          set({ isLoading: false });
          return res;
        } catch (error) {
          console.error("Failed to create company:", error);
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      deleteCompany: async (companyId) => {
        try {
          set({ isLoading: true, error: null });
          const res = await api.deleteCompany(companyId);
          await get().loadCompanies();
          set({ isLoading: false });
          return res;
        } catch (error) {
          console.error("Failed to delete company:", error);
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      // ========== ✅ DEPARTMENT ACTIONS ==========
      loadDepartments: async (companyId) => {
        try {
          const res = await api.getDepartments(companyId);
          set({
            departments: res.data || [],
            selectedCompanyId: companyId
          });
          return res.data;
        } catch (error) {
          console.error("Failed to load departments:", error);
          set({ departments: [] });
          throw error;
        }
      },

      createDepartment: async (companyId, name) => {
        try {
          set({ isLoading: true, error: null });
          const res = await api.createDepartment(companyId, name);
          await get().loadDepartments(companyId); // Refresh list
          set({ isLoading: false });
          return res;
        } catch (error) {
          console.error("Failed to create department:", error);
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      // ========== GETTERS ==========

      selectedAgent: () => {
        const { agents, selectedAgentId } = get();
        return agents.find(a => a.id === selectedAgentId) || null;
      },

      getPrinterByName: (name) => {
        return get().printers.find(p =>
          p.name === name || p.displayName === name
        );
      },

      getStats: () => {
        const printers = get().printers;
        return {
          total: printers.length,
          online: printers.filter(p => p.status === "READY" || p.status === "online").length,
          offline: printers.filter(p => p.status !== "READY" && p.status !== "online").length,
          lowInk: printers.filter(p => p.hasLowInk).length,
          criticalInk: printers.filter(p => p.hasCriticalInk).length,
          pagesToday: printers.reduce((sum, p) => sum + (p.pagesToday || 0), 0)
        };
      },

      // ========== UTILS ==========

      refresh: async () => {
        await get().loadDashboard();
        const { selectedAgentId } = get();
        if (selectedAgentId) {
          await get().selectAgent(selectedAgentId);
        }
      },

      reset: () => {
        set({
          agents: [],
          agentsWithKeys: {},
          printers: [],
          selectedAgentId: null,
          health: null,
          companies: [],
          departments: [],
          selectedCompanyId: null,
          error: null,
          isLoading: false
        });
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