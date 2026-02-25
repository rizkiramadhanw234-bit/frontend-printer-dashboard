import { create } from "zustand";
import { api } from "../services/api";

export const useDailyReportStore = create((set, get) => ({
    // State
    reports: [],                    
    currentReport: null,             
    summary: {
        totalPages: 0,
        averagePages: 0,
        daysWithData: 0,
        maxPages: 0,
        minPages: 0,
        totalPrinters: 0,
        averagePrinters: 0
    },
    pagination: {
        page: 1,
        totalPages: 1,
        total: 0,
        limit: 30
    },
    isLoading: false,
    error: null,
    filters: {
        startDate: null,
        endDate: null,
        agentId: null
    },

    // Helper untuk generate key berdasarkan filter
    getCacheKey: (agentId, page, limit, startDate, endDate) => {
        return `${agentId}-${page}-${limit}-${startDate || 'none'}-${endDate || 'none'}`;
    },

    // Fetch daily reports untuk satu agent
    fetchAgentReports: async (agentId, options = {}) => {
        const { page = 1, limit = 30, startDate, endDate } = options;
        
        set({ 
            isLoading: true, 
            error: null,
            filters: { startDate, endDate, agentId }
        });
        
        try {
            const response = await api.getAgentDailyReports(agentId, {
                page,
                limit,
                startDate,
                endDate
            });

            set({ 
                reports: response.reports || [], 
                summary: response.summary || get().calculateSummaryFromReports(response.reports || []),
                pagination: {
                    page: response.page || page,
                    totalPages: response.totalPages || 1,
                    total: response.total || response.reports?.length || 0,
                    limit
                },
                isLoading: false 
            });

            return response;
        } catch (error) {
            console.error("Failed to fetch reports:", error);
            set({ 
                error: error.message || "Failed to fetch reports",
                isLoading: false,
                reports: []
            });
            throw error;
        }
    },

    // Fetch single report by ID
    fetchReportById: async (agentId, reportId) => {
        set({ isLoading: true, error: null });

        try {
            const response = await api.getAgentDailyReportById(agentId, reportId);

            set({
                currentReport: response.report,
                isLoading: false
            });

            return response;
        } catch (error) {
            console.error("Failed to fetch report:", error);
            set({
                error: error.response?.data?.error || "Failed to fetch report",
                isLoading: false,
                currentReport: null
            });
            throw error;
        }
    },

    // Create new report (INI YANG SATU, HAPUS YANG DUPLIKAT)
    createReport: async (agentId, reportData) => {
        set({ isLoading: true, error: null });

        try {
            const response = await api.createDailyReport(agentId, reportData);

            // Refresh reports list jika perlu
            if (response.success) {
                const { page, limit, startDate, endDate } = get().pagination;
                await get().fetchAgentReports(agentId, {
                    page,
                    limit,
                    startDate,
                    endDate
                });
            }

            set({ isLoading: false });

            return { success: true, data: response };
        } catch (error) {
            console.error("Failed to create report:", error);
            set({
                error: error.response?.data?.error || "Failed to create report",
                isLoading: false
            });
            return { success: false, error: error.response?.data?.error };
        }
    },

    // Update report
    updateReport: async (agentId, reportId, updateData) => {
        set({ isLoading: true, error: null });

        try {
            const response = await api.updateDailyReport(agentId, reportId, updateData);

            if (response.success) {
                // Update di list reports
                set(state => ({
                    reports: state.reports.map(r =>
                        r.id === reportId ? { ...r, ...updateData } : r
                    ),
                    currentReport: state.currentReport?.id === reportId
                        ? { ...state.currentReport, ...updateData }
                        : state.currentReport,
                    isLoading: false
                }));

                // Recalculate summary
                get().calculateSummary();
            }

            return { success: true, data: response };
        } catch (error) {
            console.error("Failed to update report:", error);
            set({
                error: error.response?.data?.error || "Failed to update report",
                isLoading: false
            });
            return { success: false, error: error.response?.data?.error };
        }
    },

    // Delete report
    deleteReport: async (agentId, reportId) => {
        set({ isLoading: true, error: null });

        try {
            const response = await api.deleteDailyReport(agentId, reportId);

            if (response.success) {
                // Remove from list
                set(state => {
                    const newReports = state.reports.filter(r => r.id !== reportId);

                    // Recalculate summary manually
                    const newSummary = get().calculateSummaryFromReports(newReports);

                    return {
                        reports: newReports,
                        summary: newSummary,
                        currentReport: state.currentReport?.id === reportId ? null : state.currentReport,
                        pagination: {
                            ...state.pagination,
                            total: state.pagination.total - 1
                        },
                        isLoading: false
                    };
                });
            }

            return { success: true };
        } catch (error) {
            console.error("Failed to delete report:", error);
            set({
                error: error.response?.data?.error || "Failed to delete report",
                isLoading: false
            });
            return { success: false, error: error.response?.data?.error };
        }
    },

    // Batch create reports
    batchCreateReports: async (agentId, reports) => {
        set({ isLoading: true, error: null });

        try {
            const response = await api.batchCreateDailyReports(agentId, { reports });

            if (response.success) {
                // Refresh reports list
                const { page, limit, startDate, endDate } = get().pagination;
                await get().fetchAgentReports(agentId, { page, limit, startDate, endDate });
            }

            set({ isLoading: false });

            return { success: true, results: response.results };
        } catch (error) {
            console.error("Failed to batch create reports:", error);
            set({
                error: error.response?.data?.error || "Failed to batch create reports",
                isLoading: false
            });
            return { success: false, error: error.response?.data?.error };
        }
    },

    // Helper: calculate summary from reports array
    calculateSummaryFromReports: (reports) => {
        if (!reports || reports.length === 0) {
            return {
                totalPages: 0,
                averagePages: 0,
                daysWithData: 0,
                maxPages: 0,
                minPages: 0,
                totalPrinters: 0,
                averagePrinters: 0
            };
        }

        const totalPages = reports.reduce((sum, r) => sum + (r.total_pages || 0), 0);
        const totalPrinters = reports.reduce((sum, r) => sum + (r.printer_count || 0), 0);
        const pages = reports.map(r => r.total_pages || 0);

        return {
            totalPages,
            averagePages: Math.round(totalPages / reports.length),
            daysWithData: reports.length,
            maxPages: Math.max(...pages),
            minPages: Math.min(...pages),
            totalPrinters,
            averagePrinters: Math.round(totalPrinters / reports.length)
        };
    },

    // Recalculate summary based on current reports
    calculateSummary: () => {
        const summary = get().calculateSummaryFromReports(get().reports);
        set({ summary });
    },

    // Set filters
    setFilters: (filters) => {
        set({ filters: { ...get().filters, ...filters } });
    },

    // Clear current report
    clearCurrentReport: () => set({ currentReport: null }),

    // Reset pagination to page 1
    resetPagination: () => set(state => ({
        pagination: { ...state.pagination, page: 1 }
    })),

    // Go to specific page
    goToPage: (page) => {
        const { totalPages } = get().pagination;
        if (page >= 1 && page <= totalPages) {
            set(state => ({
                pagination: { ...state.pagination, page }
            }));
        }
    },

    // Next page
    nextPage: () => {
        const { page, totalPages } = get().pagination;
        if (page < totalPages) {
            set(state => ({
                pagination: { ...state.pagination, page: page + 1 }
            }));
        }
    },

    // Previous page
    prevPage: () => {
        const { page } = get().pagination;
        if (page > 1) {
            set(state => ({
                pagination: { ...state.pagination, page: page - 1 }
            }));
        }
    },

    // Get reports for chart (grouped by date)
    getReportsForChart: () => {
        const reports = get().reports;

        return reports.map(report => ({
            date: new Date(report.report_date).toLocaleDateString(),
            pages: report.total_pages,
            printers: report.printer_count
        })).reverse(); // Reverse to show chronological order
    },

    // Get total pages by date range
    getTotalPagesByDateRange: (startDate, endDate) => {
        const reports = get().reports;
        const start = startDate ? new Date(startDate) : null;
        const end = endDate ? new Date(endDate) : null;

        return reports
            .filter(report => {
                const reportDate = new Date(report.report_date);
                if (start && reportDate < start) return false;
                if (end && reportDate > end) return false;
                return true;
            })
            .reduce((sum, report) => sum + (report.total_pages || 0), 0);
    },

    // Reset store
    reset: () => {
        set({
            reports: [],
            currentReport: null,
            summary: {
                totalPages: 0,
                averagePages: 0,
                daysWithData: 0,
                maxPages: 0,
                minPages: 0,
                totalPrinters: 0,
                averagePrinters: 0
            },
            pagination: {
                page: 1,
                totalPages: 1,
                total: 0,
                limit: 30
            },
            isLoading: false,
            error: null,
            filters: {
                startDate: null,
                endDate: null,
                agentId: null
            }
        });
    }
}));