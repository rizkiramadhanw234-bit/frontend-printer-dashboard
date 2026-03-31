import { create } from "zustand";
import { api } from "../services/api";
import { useAppStore } from "./app.store";

export const usePrinterStore = create((set, get) => ({
    allPrinters: [],
    agentPrinters: {},
    selectedPrinter: null,

    printerLifetimeReports: {},

    isLoading: false,
    error: null,

    fetchAllPrinters: async () => {
        try {
            set({ isLoading: true, error: null });

            const response = await api.getAllPrinters();

            set({
                allPrinters: response.printers || [],
                isLoading: false
            });

            return response;

        } catch (error) {
            set({
                error: error.message,
                isLoading: false,
                allPrinters: []
            });
            throw error;
        }
    },

    fetchAgentPrinters: async (agentId) => {
        try {
            set({ isLoading: true, error: null });

            const appState = useAppStore.getState();
            let apiKey = appState.agentsWithKeys?.[agentId];

            if (!apiKey) {
                const keyRes = await api.getAgentApiKey(agentId);
                apiKey = keyRes.apiKey;

                useAppStore.setState(state => ({
                    agentsWithKeys: {
                        ...(state.agentsWithKeys || {}),
                        [agentId]: apiKey
                    }
                }));
            }

            const response = await api.getAgentPrinters(agentId, apiKey);

            set(state => ({
                agentPrinters: {
                    ...state.agentPrinters,
                    [agentId]: response.printers || []
                },
                isLoading: false
            }));

            return response;

        } catch (error) {
            set({
                error: error.message,
                isLoading: false
            });
            throw error;
        }
    },

    fetchAgentPrinter: async (agentId, printerName) => {
        try {
            set({ isLoading: true, error: null });

            const appState = useAppStore.getState();
            let apiKey = appState.agentsWithKeys?.[agentId];

            if (!apiKey) {
                const keyRes = await api.getAgentApiKey(agentId);
                apiKey = keyRes.apiKey;

                useAppStore.setState(state => ({
                    agentsWithKeys: {
                        ...(state.agentsWithKeys || {}),
                        [agentId]: apiKey
                    }
                }));
            }

            const response = await api.getAgentPrinter(agentId, printerName, apiKey);

            set({
                selectedPrinter: response.printer,
                isLoading: false
            });

            return response;

        } catch (error) {
            set({
                error: error.message,
                isLoading: false,
                selectedPrinter: null
            });
            throw error;
        }
    },

    fetchPrinterLifetimeReport: async (printerName) => {
        try {
            set({ isLoading: true, error: null });

            const response = await api.getPrinterLifetimeReport(printerName);

            set(state => ({
                printerLifetimeReports: {
                    ...state.printerLifetimeReports,
                    [printerName]: response
                },
                isLoading: false
            }));

            return response;

        } catch (error) {
            set({
                error: error.message,
                isLoading: false
            });
            throw error;
        }
    },

    pausePrinter: async (agentId, printerName) => {
        const appState = useAppStore.getState();
        let apiKey = appState.agentsWithKeys?.[agentId];

        if (!apiKey) {
            const keyRes = await api.getAgentApiKey(agentId);
            apiKey = keyRes.apiKey;
            useAppStore.setState(state => ({
                agentsWithKeys: {
                    ...(state.agentsWithKeys || {}),
                    [agentId]: apiKey
                }
            }));
        }

        const response = await api.pausePrinter(agentId, printerName, apiKey);
        await get().fetchAllPrinters();
        return response;
    },

    resumePrinter: async (agentId, printerName) => {
        try {
            const appState = useAppStore.getState();
            const apiKey = appState.agentsWithKeys?.[agentId];

            if (!apiKey) throw new Error('API key not found');

            const response = await api.resumePrinter(agentId, printerName, apiKey);

            await get().fetchAgentPrinter(agentId, printerName);

            return response;

        } catch (error) {
            throw error;
        }
    },

    getPrintersWithLowInk: () => {
        return get().allPrinters.filter(p => {
            if (p.lowInkColors && p.lowInkColors.length > 0) return true;

            if (!p.ink_levels) return false;

            const levels = typeof p.ink_levels === 'string'
                ? JSON.parse(p.ink_levels)
                : p.ink_levels;

            return Object.values(levels).some(level => {
                const lvl = parseInt(level);
                return lvl > 0 && lvl <= 20;
            });
        });
    },

    getPrintersWithCriticalInk: () => {
        return get().allPrinters.filter(p => {
            if (p.printer_status_detail === 'no_ink') return true;

            if (!p.ink_levels) return false;

            const levels = typeof p.ink_levels === 'string'
                ? JSON.parse(p.ink_levels)
                : p.ink_levels;

            return Object.values(levels).some(level => {
                const lvl = parseInt(level);
                return lvl > 0 && lvl <= 10;
            });
        });
    },

    getAllPrintersStatistics: () => {
        const printers = get().allPrinters;

        const total = printers.length;
        const online = printers.filter(p =>
            p.status === "READY" || p.status === "ONLINE" || p.status === "PRINTING"
        ).length;

        const offline = printers.filter(p =>
            p.status === "OFFLINE" || p.status === "DISCONNECTED"
        ).length;

        const error = printers.filter(p =>
            p.status === "OTHER" || p.status === "ERROR" || p.printer_status_detail === 'error_other'
        ).length;

        const printing = printers.filter(p =>
            p.status === "PRINTING" || p.printer_status_detail === 'printing'
        ).length;

        const lowInk = printers.filter(p => {
            if (p.printer_status_detail === 'low_ink') return true;
            if (p.lowInkColors && p.lowInkColors.length > 0) {
                const inkLevels = typeof p.ink_levels === 'string'
                    ? JSON.parse(p.ink_levels)
                    : p.ink_levels || {};
                const hasZero = p.lowInkColors.some(color => inkLevels[color] === 0);
                if (!hasZero) return true;
            }
            return false;
        }).length;

        const criticalInk = printers.filter(p => {
            if (p.printer_status_detail === 'no_ink') return true;

            const inkLevels = typeof p.ink_levels === 'string'
                ? JSON.parse(p.ink_levels)
                : p.ink_levels || {};

            if (Object.values(inkLevels).some(v => v === 0)) return true;

            if (p.lowInkColors && p.lowInkColors.length > 0) {
                const hasZero = p.lowInkColors.some(color => inkLevels[color] === 0);
                if (hasZero) return true;
            }

            return false;
        }).length;

        const paperJam = printers.filter(p => p.printerStatusDetail === 'paper_jam').length;
        const outOfPaper = printers.filter(p => p.printerStatusDetail === 'out_of_paper').length;
        const doorOpen = printers.filter(p => p.printerStatusDetail === 'door_open').length;

        const byVendor = printers.reduce((acc, p) => {
            const vendor = p.vendor || "Unknown";
            acc[vendor] = (acc[vendor] || 0) + 1;
            return acc;
        }, {});

        const totalPagesToday = printers.reduce((sum, p) =>
            sum + (p.pages_today || 0), 0
        );

        const colorPagesToday = printers.reduce((sum, p) =>
            sum + (p.color_pages_today || 0), 0
        );

        const bwPagesToday = printers.reduce((sum, p) =>
            sum + (p.bw_pages_today || 0), 0
        );

        return {
            total,
            online,
            offline,
            error,
            printing,
            paperJam,
            outOfPaper,
            doorOpen,
            byVendor,
            totalPagesToday,
            colorPagesToday,
            bwPagesToday,
            lowInk,
            criticalInk
        };
    },

    setupWebSocketSync: () => {
        const wsService = require('../services/ws').default;

        const unsubPrinters = wsService.subscribeToPrinters(async (data) => {
            if (data.type === 'printer_update') {
                await get().fetchAllPrinters();
            }
        });

        const unsubAgents = wsService.subscribeToAgents(async (data) => {
            if (data.type === 'agent_disconnected') {
                await get().fetchAllPrinters();
            }
        });

        return () => {
            unsubPrinters?.();
            unsubAgents?.();
        };
    },

    refresh: async () => {
        await get().fetchAllPrinters();

        const { selectedAgentId } = useAppStore.getState();
        if (selectedAgentId) {
            await get().fetchAgentPrinters(selectedAgentId);
        }
    },

    reset: () => {
        set({
            allPrinters: [],
            agentPrinters: {},
            selectedPrinter: null,
            printerLifetimeReports: {},
            isLoading: false,
            error: null
        });
    }
}));