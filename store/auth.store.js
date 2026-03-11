import { create } from "zustand";
import { api } from "../services/api";
import { persist, createJSONStorage } from "zustand/middleware"; 

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      error: null,
      isAuthenticated: false,
      isInitialized: false,

      login: async (email, password) => {
        try {
          set({ isLoading: true, error: null });
          const response = await api.login(email, password);
          console.log("Login response:", response);

          const token = response.token || response.data?.token;
          const user = response.user || response.data?.user;

          if (token) {
            localStorage.setItem('jwt_token', token);
            set({
              user,
              token,
              isAuthenticated: true,
              isLoading: false,
              error: null
            });
            return { success: true };
          } else {
            throw new Error(response.message || "No token received");
          }
        } catch (error) {
          console.error("Login error:", error);
          set({ error: error.message, isLoading: false, isAuthenticated: false });
          return { success: false, error: error.message };
        }
      },

      logout: () => {
        localStorage.removeItem('jwt_token');
        localStorage.removeItem('auth-storage');
        set({ user: null, token: null, isAuthenticated: false, error: null });
      },

      checkAuth: async () => {
        const token = localStorage.getItem('jwt_token');
        console.log('checkAuth called, token:', token ? 'ada' : 'TIDAK ADA');

        if (!token) {
          set({ isAuthenticated: false, isInitialized: true });
          return false;
        }

        try {
          const response = await api.checkAuth();
          console.log('checkAuth response:', response);

          if (response.success) {
            set({ isAuthenticated: true, token, user: response.user || response.data?.user, isInitialized: true });
            return true;
          }

          set({ isAuthenticated: false, isInitialized: true });
          return false;

        } catch (error) {
          console.error("Auth check failed:", error);
          localStorage.removeItem('jwt_token');
          set({ isAuthenticated: false, isInitialized: true });
          return false;
        }
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.token) {
          localStorage.setItem('jwt_token', state.token);
        }
      }
    }
  )
);