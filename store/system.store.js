import { create } from "zustand";
import { api } from "../services/api";
import { persist } from "zustand/middleware";

export const useSystemStore = create(
  persist(
    (set, get) => ({
      // ========== STATE ==========
      
      health: {
        status: "unknown",
        server: "Printer Dashboard Backend",
        version: "1.3.0",
        uptime: 0,
        timestamp: null,
        connections: {
          agents: 0,
          dashboards: 0
        },
        database: "unknown",
        environment: "production"
      },

      systemInfo: {
        nodeVersion: null,
        platform: null,
        memoryUsage: {},
        uptime: 0,
        pid: null,
        database: {},
        websocket: {}
      },

      websocketStatus: {
        agentConnections: {
          count: 0,
          connections: []
        },
        dashboardConnections: {
          count: 0
        }
      },

      settings: {
        autoRefresh: process.env.NEXT_PUBLIC_AUTO_REFRESH === "true",
        refreshInterval: parseInt(process.env.NEXT_PUBLIC_REFRESH_INTERVAL) || 30000,
        lowInkThreshold: parseInt(process.env.NEXT_PUBLIC_LOW_INK_THRESHOLD) || 20,
        criticalInkThreshold: parseInt(process.env.NEXT_PUBLIC_CRITICAL_INK_THRESHOLD) || 10,
        enablePrinterControl: process.env.NEXT_PUBLIC_ENABLE_PRINTER_CONTROL === "true",
        enableWebSocket: process.env.NEXT_PUBLIC_ENABLE_WEBSOCKET === "true",
      },

      isLoading: false,
      error: null,
      lastUpdated: null,

      // ========== HEALTH ==========

      fetchHealth: async () => {
        try {
          set({ isLoading: true, error: null });
          
          const data = await api.getHealth();
          
          set({
            health: {
              status: data.status || "unknown",
              server: data.server || "Printer Dashboard Backend",
              version: data.version || "1.3.0",
              uptime: data.uptime || 0,
              timestamp: data.timestamp || new Date().toISOString(),
              connections: data.connections || { agents: 0, dashboards: 0 },
              database: data.database || "unknown",
              environment: data.environment || "production"
            },
            lastUpdated: new Date().toISOString(),
            isLoading: false
          });

          console.log('✅ Health check:', data.status);
          return data;
          
        } catch (error) {
          console.error("Failed to fetch health:", error);
          set({
            health: {
              status: "error",
              server: "Unknown",
              version: "0.0.0",
              uptime: 0,
              timestamp: new Date().toISOString(),
              connections: { agents: 0, dashboards: 0 },
              database: "error",
              environment: "unknown",
              error: error.message
            },
            error: error.message,
            isLoading: false
          });
          throw error;
        }
      },

      // ========== SYSTEM INFO ==========

      fetchSystemInfo: async () => {
        try {
          set({ isLoading: true, error: null });
          
          const data = await api.getSystemInfo();
          
          set({
            systemInfo: {
              nodeVersion: data.system?.nodeVersion || null,
              platform: data.system?.platform || null,
              memoryUsage: data.system?.memoryUsage || {},
              uptime: data.system?.uptime || 0,
              pid: data.system?.pid || null,
              database: data.database || {},
              websocket: data.websocket || {}
            },
            lastUpdated: new Date().toISOString(),
            isLoading: false
          });

          console.log('✅ System info loaded');
          return data;
          
        } catch (error) {
          console.error("Failed to fetch system info:", error);
          set({
            error: error.message,
            isLoading: false
          });
          throw error;
        }
      },

      // ========== WEBSOCKET STATUS ==========

      fetchWebsocketStatus: async () => {
        try {
          const data = await api.getWebsocketStatus();
          
          set({
            websocketStatus: {
              agentConnections: data.agentConnections || { count: 0, connections: [] },
              dashboardConnections: data.dashboardConnections || { count: 0 }
            },
            lastUpdated: new Date().toISOString()
          });

          console.log('✅ WebSocket status loaded');
          return data;
          
        } catch (error) {
          console.error("Failed to fetch websocket status:", error);
          throw error;
        }
      },

      // ========== LOAD ALL SYSTEM DATA ==========

      fetchAllSystemData: async () => {
        try {
          set({ isLoading: true });
          
          await Promise.all([
            get().fetchHealth(),
            get().fetchSystemInfo(),
            get().fetchWebsocketStatus()
          ]);
          
          set({ isLoading: false });
          
        } catch (error) {
          console.error("Failed to fetch all system data:", error);
          set({ isLoading: false });
        }
      },

      // ========== SETTINGS ==========

      updateSettings: (newSettings) => {
        const settings = get().settings;
        set({
          settings: {
            ...settings,
            ...newSettings
          }
        });
        
        // Save to localStorage
        localStorage.setItem(
          "printerDashboardSettings",
          JSON.stringify(get().settings)
        );
        
        console.log('✅ Settings updated:', newSettings);
      },

      loadSettings: () => {
        const savedSettings = localStorage.getItem("printerDashboardSettings");
        if (savedSettings) {
          try {
            const parsedSettings = JSON.parse(savedSettings);
            set({ settings: parsedSettings });
            console.log('✅ Settings loaded from localStorage');
          } catch (error) {
            console.error("Failed to parse saved settings:", error);
          }
        }
      },

      // ========== HEALTH MONITORING ==========

      startHealthMonitoring: () => {
        const interval = setInterval(() => {
          get().fetchHealth();
        }, 30000); // Check every 30 seconds
        
        // Initial fetch
        get().fetchHealth();
        
        console.log('✅ Health monitoring started');
        
        return () => {
          clearInterval(interval);
          console.log('🛑 Health monitoring stopped');
        };
      },

      // ========== GETTERS ==========

      isHealthy: () => {
        const health = get().health;
        return health.status === "ok" && health.database === "connected";
      },

      getUptime: () => {
        const uptime = get().health.uptime;
        const hours = Math.floor(uptime / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        const seconds = Math.floor(uptime % 60);
        return `${hours}h ${minutes}m ${seconds}s`;
      },

      getDatabaseInfo: () => {
        return get().systemInfo.database;
      },

      getMemoryUsage: () => {
        const memory = get().systemInfo.memoryUsage;
        if (!memory.rss) return null;
        
        return {
          rss: (memory.rss / 1024 / 1024).toFixed(2) + ' MB',
          heapTotal: (memory.heapTotal / 1024 / 1024).toFixed(2) + ' MB',
          heapUsed: (memory.heapUsed / 1024 / 1024).toFixed(2) + ' MB',
          external: (memory.external / 1024 / 1024).toFixed(2) + ' MB'
        };
      },

      getConnectionsSummary: () => {
        const health = get().health;
        const ws = get().websocketStatus;
        
        return {
          agents: health.connections?.agents || 0,
          dashboards: health.connections?.dashboards || 0,
          wsAgents: ws.agentConnections?.count || 0,
          wsDashboards: ws.dashboardConnections?.count || 0
        };
      },

      // ========== UTILS ==========

      refresh: async () => {
        await get().fetchAllSystemData();
      },

      reset: () => {
        set({
          health: {
            status: "unknown",
            server: "Printer Dashboard Backend",
            version: "1.3.0",
            uptime: 0,
            timestamp: null,
            connections: { agents: 0, dashboards: 0 },
            database: "unknown",
            environment: "production"
          },
          systemInfo: {
            nodeVersion: null,
            platform: null,
            memoryUsage: {},
            uptime: 0,
            pid: null,
            database: {},
            websocket: {}
          },
          websocketStatus: {
            agentConnections: { count: 0, connections: [] },
            dashboardConnections: { count: 0 }
          },
          isLoading: false,
          error: null,
          lastUpdated: null
        });
      }
    }),
    {
      name: "system-storage",
      getStorage: () => localStorage,
      partialize: (state) => ({
        settings: state.settings
      })
    }
  )
);