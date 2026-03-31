import { create } from "zustand";
import wsService from "../services/ws";

export const useWebSocketStore = create((set, get) => ({
  // State
  isConnected: false,
  connectionStatus: "disconnected",
  lastMessage: null,
  messageHistory: [],
  error: null,
  lastConnectionTime: null,
  reconnectCount: 0,
  lastUpdateTime: 0,
  messageCount: 0,

  // Actions
  connect: () => {
    try {
      const now = Date.now();
      const state = get();

      if (now - state.lastUpdateTime < 5000) {
        return () => { };
      }

      set({
        connectionStatus: "connecting",
        error: null,
        lastUpdateTime: now
      });

      // Setup listeners
      const unsubscribeConnection = wsService.subscribeToConnection((data) => {

        switch (data.type) {
          case "connected":
            set({
              isConnected: true,
              connectionStatus: "connected",
              lastConnectionTime: new Date().toISOString(),
              error: null,
              lastUpdateTime: Date.now(),
              reconnectCount: 0,
            });
            break;

          case "disconnected":
            set((state) => ({
              isConnected: false,
              connectionStatus: "disconnected",
              reconnectCount: state.reconnectCount + 1,
              lastUpdateTime: Date.now(),
            }));
            break;

          case "error":
            set({
              isConnected: false,
              connectionStatus: "error",
              error: data.error || "Connection error",
              lastUpdateTime: Date.now(),
            });
            break;
        }
      });

      // Setup message listeners dengan DEBOUNCE
      const handleMessage = (data, channel) => {
        const state = get();
        const now = Date.now();

        if (now - state.lastUpdateTime < 2000) {
          return;
        }

        set((state) => ({
          lastMessage: { ...data, channel, receivedAt: new Date().toISOString() },
          messageHistory: [...state.messageHistory.slice(-9), {
            ...data,
            channel,
            receivedAt: new Date().toISOString(),
          }],
          lastUpdateTime: now,
          messageCount: state.messageCount + 1,
        }));
      };

      const unsubscribeAgents = wsService.subscribeToAgents((data) =>
        handleMessage(data, "agents")
      );

      const unsubscribePrinters = wsService.subscribeToPrinters((data) =>
        handleMessage(data, "printers")
      );

      const unsubscribeBroadcast = wsService.subscribeToBroadcast((data) =>
        handleMessage(data, "broadcast")
      );

      // Return cleanup function
      return () => {
        unsubscribeConnection?.();
        unsubscribeAgents?.();
        unsubscribePrinters?.();
        unsubscribeBroadcast?.();
      };
    } catch (error) {
      console.error("Failed to setup WebSocket:", error);
      set({
        connectionStatus: "error",
        error: error.message,
        lastUpdateTime: Date.now(),
      });

      return () => { };
    }
  },

  disconnect: () => {
    wsService.disconnect();
    set({
      isConnected: false,
      connectionStatus: "disconnected",
      lastUpdateTime: Date.now(),
    });
  },

  reconnect: () => {
    const state = get();
    const now = Date.now();

    // Debounce reconnect
    if (now - state.lastUpdateTime < 5000) {
      return;
    }

    get().disconnect();

    // Delay sebelum reconnect
    setTimeout(() => {
      const cleanup = get().connect();
      setTimeout(() => {
        cleanup?.();
      }, 5000);
    }, 1000);
  },

  sendMessage: (data) => {
    return wsService.send(data);
  },

  subscribeToChannel: (channel, callback) => {
    return wsService.subscribe(channel, callback);
  },

  sendPrinterCommand: (command, printerName, data = {}) => {
    const state = get();
    const now = Date.now();

    // Rate limiting untuk commands
    if (now - state.lastUpdateTime < 1000) {
      return false;
    }

    set({ lastUpdateTime: now });
    return wsService.send({
      type: "printer_command",
      command,
      printer: printerName,
      timestamp: new Date().toISOString(),
      ...data,
    });
  },

  clearMessageHistory: () => {
    set({ messageHistory: [], messageCount: 0 });
  },

  // Helper
  getConnectionInfo: () => {
    const state = get();
    return {
      isConnected: state.isConnected,
      connectionStatus: state.connectionStatus,
      lastMessageTime: state.lastMessage?.timestamp,
      messageCount: state.messageCount,
      lastConnectionTime: state.lastConnectionTime,
      reconnectCount: state.reconnectCount,
      lastUpdateTime: state.lastUpdateTime,
      storeMessages: state.messageHistory.length,
    };
  },

  checkServerAvailability: async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/health`,
        { signal: AbortSignal.timeout(3000) }
      );
      return response.ok;
    } catch {
      return false;
    }
  },

  // Reset store
  reset: () => {
    set({
      isConnected: false,
      connectionStatus: "disconnected",
      lastMessage: null,
      messageHistory: [],
      error: null,
      reconnectCount: 0,
      lastUpdateTime: 0,
      messageCount: 0,
    });
  },
}));