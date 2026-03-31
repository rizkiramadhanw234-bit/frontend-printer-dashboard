import { create } from "zustand";
import { api } from "../services/api";
import { persist } from "zustand/middleware";

export const useAppStore = create(
  persist(
    (set, get) => ({
      agents: [],
      selectedAgentId: null,
      health: null,
      systemInfo: null,

      companies: [],
      departments: [],
      selectedCompanyId: null,

      isLoading: false,
      error: null,

      loadAgents: async () => {
        try {
          set({ isLoading: true, error: null });

          const res = await api.getAllAgents();
          const agents = res.agents || [];

          set({
            agents,
            isLoading: false
          });

          return agents;

        } catch (error) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      selectAgent: async (agentId) => {
        if (!agentId) return;

        try {
          set({ selectedAgentId: agentId, isLoading: true });

          const data = await api.getAgent(agentId);

          if (data.success) {
            set({ isLoading: false });
            return data;
          }

        } catch (error) {
          set({
            error: error.message,
            isLoading: false
          });
          throw error;
        }
      },

      loadHealth: async () => {
        try {
          const res = await api.getHealth();
          set({ health: res });
          return res;
        } catch (error) {
          throw error;
        }
      },

      loadSystemInfo: async () => {
        try {
          const res = await api.getSystemInfo();
          set({ systemInfo: res });
          return res;
        } catch (error) {
          throw error;
        }
      },

      loadDashboard: async () => {
        try {
          set({ isLoading: true });

          await Promise.all([
            get().loadAgents(),
            get().loadHealth(),
            get().loadSystemInfo()
          ]);

          const { agents, selectedAgentId } = get();
          if (agents.length > 0 && !selectedAgentId) {
            await get().selectAgent(agents[0].id);
          }

        } catch (error) {
          // Error handled silently
        } finally {
          set({ isLoading: false });
        }
      },

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
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      verifyCompanyLicense: async (licenseKey) => {
        try {
          set({ isLoading: true, error: null });
          const res = await api.verifyCompanyLicense(licenseKey);
          set({ isLoading: false });
          return res;
        } catch (error) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      loadDepartments: async (companyId) => {
        try {
          const res = await api.getDepartments(companyId);
          set({
            departments: res.data || [],
            selectedCompanyId: companyId
          });
          return res.data;
        } catch (error) {
          set({ departments: [] });
          throw error;
        }
      },

      createDepartment: async (companyId, name) => {
        try {
          set({ isLoading: true, error: null });
          const res = await api.createDepartment(companyId, name);
          await get().loadDepartments(companyId);
          set({ isLoading: false });
          return res;
        } catch (error) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      selectedAgent: () => {
        const { agents, selectedAgentId } = get();
        return agents.find(a => a.id === selectedAgentId) || null;
      },

      getAgentById: (agentId) => {
        return get().agents.find(a => a.id === agentId);
      },

      getCompanyById: (companyId) => {
        return get().companies.find(c => c.id === companyId);
      },

      getDepartmentById: (departmentId) => {
        return get().departments.find(d => d.id === departmentId);
      },

      refresh: async () => {
        await get().loadDashboard();
      },

      reset: () => {
        set({
          agents: [],
          selectedAgentId: null,
          health: null,
          systemInfo: null,
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
        companies: state.companies,
        departments: state.departments
      })
    }
  )
);