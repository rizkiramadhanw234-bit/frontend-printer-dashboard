// hooks/useDashboard.js
import { useEffect } from "react";
import { useAppStore } from "@/store/app.store";
import { usePrinterStore } from "@/store/printer.store";
import { useSystemStore } from "@/store/system.store";
import { useStatsStore } from "@/store/stats.store";
import { useReportStore } from "@/store/report.store";
import { useWebSocketStore } from "@/store/ws.store";

export const useDashboard = () => {
  // App store
  const {
    agents,
    companies,
    departments,
    selectedAgentId,
    isLoading: appLoading,
    loadAgents,
    loadCompanies,
    loadDepartments,
    selectAgent,
    selectedAgent,
  } = useAppStore();

  // Printer store
  const {
    allPrinters,
    agentPrinters,
    fetchAllPrinters,
    fetchAgentPrinters,
    getAllPrintersStatistics,
    pausePrinter,
    resumePrinter,
  } = usePrinterStore();

  // System store
  const {
    health,
    systemInfo,
    isLoading: systemLoading,
    fetchHealth,
    fetchSystemInfo,
    startHealthMonitoring,
    settings,
  } = useSystemStore();

  // Stats store
  const {
    agentStats,
    printStats,
    fetchAgentStats,
    fetchPrintStats,
  } = useStatsStore();

  // Report store
  const {
    dailyReport,
    monthlyReport,
    fetchDailyReport,
    fetchMonthlyReport,
  } = useReportStore();

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
    const loadInitialData = async () => {
      await Promise.all([
        loadAgents(),
        loadCompanies(),
        fetchHealth(),
        fetchSystemInfo(),
        fetchAllPrinters(),
        fetchAgentStats(),
        fetchPrintStats()
      ]);
    };

    loadInitialData();

    // Start health monitoring
    const cleanupHealthMonitoring = startHealthMonitoring();

    // Connect to WebSocket if enabled
    if (settings.enableWebSocket) {
      connectWebSocket();
    }

    // Cleanup on unmount
    return () => {
      cleanupHealthMonitoring?.();
      disconnectWebSocket();
    };
  }, []);

  // Auto-refresh data (fallback if WebSocket down)
  useEffect(() => {
    if (!isConnected && settings.autoRefresh) {
      const interval = setInterval(() => {
        fetchHealth();
        fetchAgentStats();
        fetchAllPrinters();
      }, settings.refreshInterval);

      return () => clearInterval(interval);
    }
  }, [isConnected, settings.autoRefresh, settings.refreshInterval]);

  // Combined loading state
  const isLoading = appLoading || systemLoading;

  // Get printer statistics
  const printerStats = getAllPrintersStatistics() || {
    total: 0,
    online: 0,
    offline: 0,
    lowInk: 0,
    criticalInk: 0,
    totalPagesToday: 0
  };

  // Refresh functions
  const refreshAll = async () => {
    await Promise.all([
      loadAgents(),
      loadCompanies(),
      fetchHealth(),
      fetchSystemInfo(),
      fetchAllPrinters(),
      fetchAgentStats(),
      fetchPrintStats()
    ]);
  };

  const refreshPrinters = async (agentId) => {
    if (agentId) {
      await fetchAgentPrinters(agentId);
    } else {
      await fetchAllPrinters();
    }
  };

  return {
    // Data
    agents,
    companies,
    departments,
    allPrinters,
    agentPrinters,
    selectedAgent: selectedAgent(),
    selectedAgentId,
    health,
    systemInfo,
    agentStats,
    printStats,
    dailyReport,
    monthlyReport,
    settings,

    // Loading states
    isLoading,
    appLoading,
    systemLoading,

    // Connection
    isConnected,
    connectionStatus,

    // Actions
    loadAgents,
    loadCompanies,
    loadDepartments,
    selectAgent,
    refreshAll,
    refreshPrinters,
    fetchDailyReport,
    fetchMonthlyReport,

    // Printer control
    pausePrinter,
    resumePrinter,

    // Stats
    printerStats,
    stats: {
      totalAgents: agents.length,
      onlineAgents: agents.filter((a) => a.status === "online").length,
      totalPrinters: printerStats.total,
      onlinePrinters: printerStats.online,
      offlinePrinters: printerStats.offline,
      lowInkPrinters: printerStats.lowInk,
      criticalInkPrinters: printerStats.criticalInk,
      totalPagesToday: printerStats.totalPagesToday,
      systemUptime: health?.uptime || 0,
    },
  };
};