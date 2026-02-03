
import { useEffect } from "react";
import { usePrinterStore } from "../store/printer.store";
import { useSystemStore } from "../store/system.store";
import { useWebSocketStore } from "../store/ws.store";

export const usePrinterDashboard = () => {
  // Printer store
  const {
    agents,
    printers,
    selectedAgent,
    dailyReport,
    loading: printersLoading,
    error: printersError,
    fetchConnectedAgents,
    fetchAgentPrinters,
    fetchDailyReport,
    pausePrinter,
    resumePrinter,
    setSelectedAgent,
    getPrinterByName,
    getAgentById,
    getTotalPagesToday,
    getOfflinePrinters,
    getPrintersWithLowInk,
    getPrintersWithCriticalInk,
  } = usePrinterStore();

  // System store
  const {
    health,
    loading: systemLoading,
    fetchHealth,
    startHealthMonitoring,
    settings,
  } = useSystemStore();

  // WebSocket store
  const {
    isConnected,
    connectionStatus,
    connect: connectWebSocket,
    disconnect: disconnectWebSocket,
  } = useWebSocketStore();

  // Initialize on component mount
  useEffect(() => {
    // Fetch initial data
    fetchHealth();
    fetchConnectedAgents();
    fetchDailyReport();

    // Start health monitoring
    const cleanupHealthMonitoring = startHealthMonitoring();

    // Connect to WebSocket server jika enabled
    if (settings.enableWebSocket) {
      connectWebSocket();
    }

    // Cleanup on unmount
    return () => {
      cleanupHealthMonitoring?.();
      disconnectWebSocket();
    };
  }, []);

  // Auto-refresh data (fallback jika WebSocket mati)
  useEffect(() => {
    if (!isConnected && settings.autoRefresh) {
      const interval = setInterval(() => {
        fetchHealth();
        fetchConnectedAgents();
      }, settings.refreshInterval);

      return () => clearInterval(interval);
    }
  }, [isConnected, settings.autoRefresh, settings.refreshInterval]);

  // Combined loading state
  const isLoading = printersLoading || systemLoading;
  const hasError = printersError || health.status === "error";

  // Handler untuk WebSocket events
  useEffect(() => {
    if (!isConnected) return;

    const handleAgentUpdate = (data) => {
      // Refresh agents list ketika ada update
      fetchConnectedAgents();
    };

    const handlePrinterUpdate = (data) => {
      // Refresh printers untuk agent yang sedang dipilih
      if (selectedAgent) {
        fetchAgentPrinters(selectedAgent.agentId);
      }
    };

    // Subscribe to WebSocket events
    const unsubscribeAgents = useWebSocketStore
      .getState()
      .subscribeToChannel("agents", handleAgentUpdate);
    const unsubscribePrinters = useWebSocketStore
      .getState()
      .subscribeToChannel("printers", handlePrinterUpdate);

    return () => {
      unsubscribeAgents?.();
      unsubscribePrinters?.();
    };
  }, [isConnected, selectedAgent]);

  return {
    // Data
    agents,
    printers,
    selectedAgent,
    dailyReport,
    health,
    settings,

    // Loading states
    isLoading,
    printersLoading,
    systemLoading,

    // Errors
    hasError,
    printersError,
    systemError: health.error,

    // Connection
    isConnected,
    connectionStatus,

    // Actions
    refreshAgents: fetchConnectedAgents,
    refreshPrinters: () =>
      selectedAgent && fetchAgentPrinters(selectedAgent.agentId),
    refreshDailyReport: fetchDailyReport,
    refreshHealth: fetchHealth,
    selectAgent: setSelectedAgent,

    // Printer control
    pausePrinter: (printerName) => {
      if (!selectedAgent) throw new Error("No agent selected");
      return pausePrinter(selectedAgent.agentId, printerName);
    },
    resumePrinter: (printerName) => {
      if (!selectedAgent) throw new Error("No agent selected");
      return resumePrinter(selectedAgent.agentId, printerName);
    },

    // Getters
    getPrinterByName,
    getAgentById,
    getTotalPagesToday,
    getOfflinePrinters,
    getPrintersWithLowInk,
    getPrintersWithCriticalInk,

    // Stats
    stats: {
      totalAgents: agents.length,
      connectedAgents: agents.filter((a) => a.status === "online").length,
      totalPrinters: printers.length,
      offlinePrinters: getOfflinePrinters().length,
      printersWithLowInk: getPrintersWithLowInk().length,
      printersWithCriticalInk: getPrintersWithCriticalInk().length,
      totalPagesToday: getTotalPagesToday(),
      systemUptime: health.uptime,
    },
  };
};
