// store/company.store.js
import { create } from "zustand";
import { api } from "@/services/api";

export const useCompanyStore = create((set, get) => ({
  companies: [],
  loading: false,
  error: null,

  fetchCompanies: async () => {
    try {
      set({ loading: true, error: null });
      const res = await api.getCompanies();
      set({ companies: res.data || [], loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  deleteCompany: async (companyId) => {
    try {
      set({ loading: true, error: null });
      await api.deleteCompany(companyId);
      await get().fetchCompanies();
      return { success: true };
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  }
}));