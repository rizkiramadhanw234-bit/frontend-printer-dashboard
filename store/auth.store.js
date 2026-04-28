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
        set({ user: null, token: null, isAuthenticated: false, error: null, isInitialized: false });
      },

      checkAuth: async () => {
        const token = localStorage.getItem('jwt_token');

        if (!token) {
          set({ isAuthenticated: false, isInitialized: true });
          return false;
        }

        try {
          const response = await api.checkAuth();

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
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          const token = localStorage.getItem('jwt_token');
          if (!token) {
            state.isAuthenticated = false;
            state.user = null;
            state.token = null;
          } else {
            state.isAuthenticated = false;
          }
        }
      }
    }
  )
);