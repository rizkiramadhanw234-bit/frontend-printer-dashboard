import { create } from "zustand";
import api from "../services/api";

export const useAuthStore = create((set) => ({
    token: null,
    user: null,
    isLoggedIn: false,
    loading: true,

    // Client-side init
    init: () => {
        if (typeof window !== "undefined") {
            const storedToken = localStorage.getItem("token");
            if (storedToken) {
                set({
                    token: storedToken,
                    user: { email: "admin@newton.com", role: "admin" },
                    isLoggedIn: true,
                    loading: false,
                });
            } else {
                set({ loading: false });
            }
        }
    },

    login: async (email, password) => {
        try {
            const res = await api.login(email, password);
            if (res.success && res.token) {
                if (typeof window !== "undefined") localStorage.setItem("token", res.token);
                set({
                    token: res.token,
                    user: { email, role: "admin" },
                    isLoggedIn: true,
                    loading: false,
                });
            }
            return res;
        } catch (err) {
            console.error("Login failed:", err);
            throw err;
        }
    },

    logout: () => {
        if (typeof window !== "undefined") {
            localStorage.removeItem("token");
        }
        set({
            token: null,
            user: null,
            isLoggedIn: false,
        });
    },
}));
