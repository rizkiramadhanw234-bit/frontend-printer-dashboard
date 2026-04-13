import { create } from "zustand";
import { api } from "../services/api";

export const useReportStore = create((set, get) => ({
  // STATE 

  // Daily Reports
  dailyReport: null,
  dailyReportHistory: [],

  // Monthly Reports
  monthlyReport: null,
  monthlyReportHistory: {},

  // Company Reports
  companyReports: {},

  // Printer Lifetime Reports
  printerLifetimeReports: {},

  isLoading: false,
  error: null,

  // Filters
  filters: {
    date: null,
    agentId: null,
    companyId: null,
    startDate: null,
    endDate: null
  },

  // DAILY REPORTS 

  fetchDailyReport: async (params = {}) => {
    try {
      set({ isLoading: true, error: null });

      const response = await api.getDailyReport(params);

      set({
        dailyReport: response,
        filters: { ...get().filters, ...params },
        isLoading: false
      });

      return response;

    } catch (error) {
      console.error("Failed to fetch daily report:", error);
      set({
        error: error.message,
        isLoading: false,
        dailyReport: null
      });
      throw error;
    }
  },

  fetchDailyReportByDate: async (date, agentId = null) => {
    return get().fetchDailyReport({ date, agentId });
  },

  fetchDailyReportToday: async (agentId = null) => {
    const today = new Date().toISOString().split('T')[0];
    return get().fetchDailyReport({ date: today, agentId });
  },

  // MONTHLY REPORTS 

  fetchMonthlyReport: async (year, month, params = {}) => {
    try {
      set({ isLoading: true, error: null });

      const response = await api.getMonthlyReport(year, month, params);

      const reportKey = `${year}-${month}`;

      set(state => ({
        monthlyReport: response,
        monthlyReportHistory: {
          ...state.monthlyReportHistory,
          [reportKey]: response
        },
        filters: { ...state.filters, ...params },
        isLoading: false
      }));

      return response;

    } catch (error) {
      console.error("Failed to fetch monthly report:", error);
      set({
        error: error.message,
        isLoading: false,
        monthlyReport: null
      });
      throw error;
    }
  },

  fetchMonthlyReportCurrent: async (agentId = null) => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    return get().fetchMonthlyReport(year, month, { agentId });
  },

  getMonthlyReportFromHistory: (year, month) => {
    const reportKey = `${year}-${month}`;
    return get().monthlyReportHistory[reportKey];
  },

  // COMPANY REPORTS 

  fetchCompanyReport: async (companyId, params = {}) => {
    try {
      set({ isLoading: true, error: null });

      const response = await api.getCompanyReport(companyId, params);

      set(state => ({
        companyReports: {
          ...state.companyReports,
          [companyId]: response
        },
        isLoading: false
      }));

      return response;

    } catch (error) {
      console.error(`Failed to fetch company report for ${companyId}:`, error);
      set({
        error: error.message,
        isLoading: false
      });
      throw error;
    }
  },

  getCompanyReport: (companyId) => {
    return get().companyReports[companyId];
  },

  // PRINTER LIFETIME REPORTS 

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
      console.error(`Failed to fetch lifetime report for ${printerName}:`, error);
      set({
        error: error.message,
        isLoading: false
      });
      throw error;
    }
  },

  getPrinterLifetimeReport: (printerName) => {
    return get().printerLifetimeReports[printerName];
  },

  // EXPORT 

  exportDailyReport: async (date) => {
    try {
      const response = await api.exportReport('daily', { date });
      return response;
    } catch (error) {
      console.error("Failed to export daily report:", error);
      throw error;
    }
  },

  exportMonthlyReport: async (year, month) => {
    try {
      const response = await api.exportReport('monthly', { year, month });
      return response;
    } catch (error) {
      console.error("Failed to export monthly report:", error);
      throw error;
    }
  },

  exportPrinterReport: async (printerName) => {
    try {
      const response = await api.exportReport('printer', { printerName });
      return response;
    } catch (error) {
      console.error("Failed to export printer report:", error);
      throw error;
    }
  },

  // ANALYSIS HELPERS 

  getDailyReportSummary: () => {
    const report = get().dailyReport;
    if (!report) return null;

    return {
      date: report.date,
      totalPages: report.totalPages,
      agentCount: report.agentCount,
      printerCount: report.printerCount,
      source: report.source,
      topAgent: report.byAgent?.[0] || null,
      topPrinter: report.byPrinter?.[0] || null
    };
  },

  getMonthlyReportSummary: () => {
    const report = get().monthlyReport;
    if (!report) return null;

    return {
      year: report.year,
      month: report.month,
      totalPages: report.summary?.totalPages || 0,
      averageDailyPages: report.summary?.averageDailyPages || 0,
      totalPrintJobs: report.summary?.totalPrintJobs || 0,
      activeAgents: report.summary?.activeAgents || 0,
      activePrinters: report.summary?.activePrinters || 0,
      peakDay: report.summary?.peakDay || null
    };
  },

  // Get chart data from daily report
  getDailyReportChartData: () => {
    const report = get().dailyReport;
    if (!report || !report.byAgent) return [];

    return report.byAgent.map(agent => ({
      name: agent.agentName,
      pages: agent.pages,
      printers: agent.printers?.length || 0
    }));
  },

  // Get chart data from monthly report
  getMonthlyReportChartData: () => {
    const report = get().monthlyReport;
    if (!report || !report.dailyBreakdown) return [];

    return report.dailyBreakdown.map(day => ({
      date: new Date(day.print_date).toLocaleDateString(),
      pages: day.total_pages || 0,
      agents: day.active_agents || 0,
      printers: day.active_printers || 0
    }));
  },

  // FILTERS 

  setFilters: (newFilters) => {
    set(state => ({
      filters: { ...state.filters, ...newFilters }
    }));
  },

  clearFilters: () => {
    set({
      filters: {
        date: null,
        agentId: null,
        companyId: null,
        startDate: null,
        endDate: null
      }
    });
  },

  //  UTILS 

  reset: () => {
    set({
      dailyReport: null,
      dailyReportHistory: [],
      monthlyReport: null,
      monthlyReportHistory: {},
      companyReports: {},
      printerLifetimeReports: {},
      isLoading: false,
      error: null,
      filters: {
        date: null,
        agentId: null,
        companyId: null,
        startDate: null,
        endDate: null
      }
    });
  },

  fetchRecords: async (params = {}) => {
    try {
      set({ isLoading: true, error: null });
      const response = await api.getRecords(params);
      set({ isLoading: false });
      return response;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },


}));