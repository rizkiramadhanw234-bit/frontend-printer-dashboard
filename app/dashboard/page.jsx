"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/app.store";
import { useAuthStore } from "@/store/auth.store";
import { usePrinterStore } from "@/store/printer.store";
import { useReportStore } from "@/store/report.store";
import { useStatsStore } from "@/store/stats.store";
import { useSystemStore } from "@/store/system.store";
import { useAlertStore } from "@/store/alert.store";
import Sidebar from "@/components/Sidebar";
import AgentTable from "@/components/tables/AgentTable";
import PrinterTable from "@/components/tables/PrinterTable";
import PrinterCard from "@/components/cards/PrinterCard";
import StatsCards from "@/components/cards/StatsCard";
import HealthCard from "@/components/cards/HealthCard";
import DailyReport from "@/components/cards/DailyReport";
import CompanyModal from "@/components/company/Management";
import DepartmentModal from "@/components/company/Departement";
import DeleteCompanyDialog from "@/components/company/DeleteDialog";
import PrinterDetailModal from "@/components/modals/PrinterDetailModal";
import ReportView from "@/components/reports/ReportsView";
import AlertCard from "@/components/cards/AlertCard";
import {
  RefreshCw,
  Printer,
  AlertCircle,
  BarChart3,
  Settings,
  Building,
  Users,
  Bell,
} from "lucide-react";
import { useMemo } from "react";
import wsService from "@/services/ws";

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated, checkAuth } = useAuthStore();
  const [isInitialized, setIsInitialized] = useState(false);

  const {
    agents,
    companies,
    isLoading: appLoading,
    loadAgents,
    loadCompanies,
    selectAgent,
    deleteCompany,
    selectedAgent: selectedAgentGetter,
  } = useAppStore();

  const {
    allPrinters,
    agentPrinters,
    fetchAllPrinters,
    fetchAgentPrinters,
    getAllPrintersStatistics,
  } = usePrinterStore();

  const {
    alerts,
    unreadCount,
    generateAlertsFromPrinters,
    initWebSocket,
    cleanup,
    markAllAsRead
  } = useAlertStore();

  const stats = useMemo(() => {
    return {
      total: allPrinters.length,
      online: allPrinters.filter(p =>
        ['READY', 'ONLINE', 'PRINTING'].includes(p.status)
      ).length,
      offline: allPrinters.filter(p =>
        ['OFFLINE', 'DISCONNECTED', 'OTHER', 'ERROR'].includes(p.status)
      ).length,
      lowInk: alerts.filter(a => a.type === 'low_ink' && a.status === 'active').length,
      criticalInk: alerts.filter(a =>
        (a.type === 'no_ink' || a.type === 'offline' || a.type === 'paper_jam') &&
        a.severity === 'critical' &&
        a.status === 'active'
      ).length,
      pagesToday: allPrinters.reduce((sum, p) => sum + (p.pages_today || 0), 0)
    };
  }, [allPrinters, alerts]);

  const {
    agentStats,
    fetchAgentStats,
    fetchPrintStats,
  } = useStatsStore();

  const {
    health,
    fetchHealth,
    fetchSystemInfo,
  } = useSystemStore();

  const {
    dailyReport,
    fetchDailyReportToday,
  } = useReportStore();

  const [activeTab, setActiveTab] = useState("overview");
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [isDepartmentModalOpen, setIsDepartmentModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({
    isOpen: false,
    companyId: null,
    companyName: ''
  });
  const [selectedPrinter, setSelectedPrinter] = useState(null);
  const [isPrinterModalOpen, setIsPrinterModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [selectedAgentId, setSelectedAgentId] = useState(null);

  const selectedAgent = agents.find(a => a.id === selectedAgentId);
  const overviewPrinters = selectedAgent ? (agentPrinters[selectedAgentId] || []) : [];

  useEffect(() => {
    const init = async () => {
      const authed = await checkAuth();
      setIsInitialized(true);
      if (!authed) router.push('/login');
    };
    init();
  }, [checkAuth, router]);

  useEffect(() => {
    if (isAuthenticated) {
      const loadInitialData = async () => {
        try {
          await Promise.all([
            loadAgents(),
            loadCompanies(),
            fetchHealth(),
            fetchSystemInfo(),
            fetchAllPrinters(),
            fetchAgentStats(),
            fetchPrintStats()
          ]);

          const stats = getAllPrintersStatistics();

          if (allPrinters.length > 0) {
            generateAlertsFromPrinters(allPrinters, 'initial');
          }
        } catch (error) {
          // Error handled silently
        }
      };

      loadInitialData();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (allPrinters.length > 0) {
      const stats = getAllPrintersStatistics();
    }
  }, [allPrinters]);

  useEffect(() => {
    if (allPrinters.length > 0 && isAuthenticated) {
      generateAlertsFromPrinters(allPrinters, 'printer_update');
    }
  }, [allPrinters, isAuthenticated, generateAlertsFromPrinters]);

  useEffect(() => {
    if (selectedAgentId) {
      fetchAgentPrinters(selectedAgentId);
      fetchDailyReportToday(selectedAgentId);
    }
  }, [selectedAgentId, fetchAgentPrinters, fetchDailyReportToday]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const unsubPrinters = wsService.subscribeToPrinters(async (data) => {
      if (data.type === 'printer_update') {
        await fetchAllPrinters();
      }
    });

    const unsubAgents = wsService.subscribeToAgents(async (data) => {
      if (data.type === 'agent_disconnected') {
        await fetchAllPrinters();
        await loadAgents();
      }
    });

    return () => {
      unsubPrinters?.();
      unsubAgents?.();
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (agents.length > 0 && !selectedAgentId) {
      setSelectedAgentId(agents[0].id);
    }
  }, [agents, selectedAgentId]);

  const handleSelectAgent = async (agentId) => {
    try {
      setSelectedAgentId(agentId);
      await selectAgent(agentId);
    } catch (error) {
      // Error handled silently
    }
  };

  const handleDeleteCompany = (companyId, companyName) => {
    setDeleteConfirm({ isOpen: true, companyId, companyName });
  };

  const confirmDeleteCompany = async () => {
    const { companyId, companyName } = deleteConfirm;
    if (!companyId) return;

    try {
      await deleteCompany(companyId);
      alert(`Company "${companyName}" deleted successfully`);
    } catch (error) {
      alert(`Failed to delete company: ${error.message}`);
    } finally {
      setDeleteConfirm({ isOpen: false, companyId: null, companyName: '' });
    }
  };

  const handlePrinterClick = (printer) => {
    setSelectedPrinter(printer);
    setIsPrinterModalOpen(true);
  };

  const refreshAll = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        loadAgents(),
        loadCompanies(),
        fetchHealth(),
        fetchSystemInfo(),
        fetchAllPrinters(),
        fetchAgentStats(),
        fetchPrintStats()
      ]);

      if (selectedAgentId) {
        await fetchAgentPrinters(selectedAgentId);
        await fetchDailyReportToday(selectedAgentId);
      }

      if (allPrinters.length > 0) {
        generateAlertsFromPrinters(allPrinters, 'refresh');
      }
    } catch (error) {
      // Error handled silently
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleMarkAllAlertsRead = () => {
    markAllAsRead();
  };

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        stats={stats}
        health={health}
      />

      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {activeTab === "overview" && "Dashboard Overview"}
                {activeTab === "agents" && "Agent Management"}
                {activeTab === "printers" && "Printer Management"}
                {activeTab === "companies" && "Company Management"}
                {activeTab === "departments" && "Department Management"}
                {activeTab === "alerts" && "Alert Center"}
                {activeTab === "reports" && "Reports"}
                {activeTab === "settings" && "Settings"}
              </h1>

              {activeTab === "overview" && selectedAgent && (
                <p className="text-sm text-gray-500 mt-1">
                  {selectedAgent.company} • {selectedAgent.name}
                </p>
              )}

              {activeTab === "printers" && (
                <p className="text-sm text-gray-500 mt-1">
                  Total {stats.total} printers across all agents
                </p>
              )}

              {activeTab === "alerts" && (
                <p className="text-sm text-gray-500 mt-1">
                  {unreadCount} unread • {alerts.length} active alerts
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              {activeTab === "alerts" && unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAlertsRead}
                  className="px-3 py-1.5 text-sm border rounded-md hover:bg-gray-50 flex items-center gap-2"
                >
                  <Bell className="h-4 w-4" />
                  Mark all read
                </button>
              )}
              <button
                onClick={refreshAll}
                disabled={appLoading || isRefreshing}
                className="px-3 py-1.5 text-sm border rounded-md hover:bg-gray-50 flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${appLoading || isRefreshing ? "animate-spin" : ""}`} />
                Refresh
              </button>
            </div>
          </div>

          {activeTab === "overview" && (
            <>
              <StatsCards stats={stats} />

              {alerts.length > 0 && (
                <div className="bg-white rounded-lg border p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-red-500" />
                      <h3 className="font-medium">Active Alerts</h3>
                      <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                        {alerts.length}
                      </span>
                    </div>
                    <button
                      onClick={() => setActiveTab("alerts")}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      View All
                    </button>
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {alerts.slice(0, 3).map(alert => (
                      <div
                        key={alert.id}
                        className="text-sm p-2 bg-gray-50 rounded flex items-center gap-2 cursor-pointer hover:bg-gray-100"
                        onClick={() => {
                          setSelectedAlert(alert);
                          setActiveTab("alerts");
                        }}
                      >
                        {alert.severity === 'critical' ? (
                          <AlertCircle className="h-4 w-4 text-red-500" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-yellow-500" />
                        )}
                        <span className="flex-1 truncate">{alert.message}</span>
                        <span className="text-xs text-gray-500">
                          {new Date(alert.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
                <div className="lg:col-span-1 space-y-6">
                  <div className="bg-white rounded-lg border p-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">
                      Select Agent
                    </h3>
                    <select
                      value={selectedAgentId || ""}
                      onChange={(e) => handleSelectAgent(e.target.value)}
                      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={appLoading}
                    >
                      <option value="">-- Choose an agent --</option>
                      {agents.map((agent) => (
                        <option key={agent.id} value={agent.id}>
                          {agent.name} ({agent.company} - {agent.department})
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedAgentId && (
                    <DailyReport agentId={selectedAgentId} />
                  )}
                </div>

                <div className="lg:col-span-2">
                  {overviewPrinters.length > 0 ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-gray-700">
                          Printers for {selectedAgent?.name}
                        </h3>
                        <span className="px-2 py-1 border rounded text-xs">
                          {overviewPrinters.length} printers
                        </span>
                      </div>
                      {overviewPrinters.map((printer) => (
                        <PrinterCard
                          key={printer.id || printer.name}
                          printer={printer}
                          agent={selectedAgent}
                          onClick={() => handlePrinterClick(printer)}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="bg-white rounded-lg border p-12 text-center">
                      <Printer className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">
                        {selectedAgent
                          ? "No printers found for this agent"
                          : "Select an agent to view printers"}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {activeTab === "printers" && (
            <PrinterTable
              onPrinterSelect={(printer) => {
                setSelectedPrinter(printer);
                setIsPrinterModalOpen(true);
              }}
              selectedPrinterId={selectedPrinter?.id}
            />
          )}

          {activeTab === "agents" && (
            <AgentTable
              mode="dashboard"
              onAgentSelect={handleSelectAgent}
              selectedAgentId={selectedAgentId}
            />
          )}

          {activeTab === "companies" && (
            <div className="bg-white rounded-lg border">
              <div className="p-6 border-b flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Companies</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Manage companies and their departments
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsCompanyModalOpen(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
                  >
                    <Building className="h-4 w-4" />
                    Add Company
                  </button>
                  <button
                    onClick={() => setIsDepartmentModalOpen(true)}
                    className="px-4 py-2 border rounded-md hover:bg-gray-50 flex items-center gap-2"
                  >
                    <Users className="h-4 w-4" />
                    Departments
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase">License Key</th>
                        <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase">Name</th>
                        <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase">Email</th>
                        <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase">Phone</th>
                        <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase">Address</th>
                        <th className="px-4 py-3 text-right text-xs text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {companies.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                            No companies found. Click "Add Company" to create one.
                          </td>
                        </tr>
                      ) : (
                        companies.map((company) => (
                          <tr key={company.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-xs text-gray-600">
                              {company.id}
                            </td>
                            <td className="px-4 py-3 text-gray-900">
                              {company.name}
                            </td>
                            <td className="px-4 py-3 text-gray-600">
                              {company.email || '-'}
                            </td>
                            <td className="px-4 py-3 text-gray-600">
                              {company.phone || '-'}
                            </td>
                            <td className="px-4 py-3 text-gray-600">
                              {company.address || '-'}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 rounded"
                                onClick={() => handleDeleteCompany(company.id, company.name)}
                              >
                                <svg className="h-4 w-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === "departments" && (
            <div className="bg-white rounded-lg border p-12 text-center">
              <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Department Management
              </h3>
              <p className="text-gray-500 mb-4">
                Click the button below to manage departments
              </p>
              <button
                onClick={() => setIsDepartmentModalOpen(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 inline-flex items-center gap-2"
              >
                <Users className="h-4 w-4" />
                Open Department Manager
              </button>
            </div>
          )}

          {activeTab === "alerts" && (
            <AlertCard
              onAlertSelect={(alert) => setSelectedAlert(alert)}
              selectedAlertId={selectedAlert?.id}
            />
          )}

          {activeTab === "reports" && (
            <ReportView />
          )}

          {activeTab === "settings" && (
            <div className="bg-white rounded-lg border p-12 text-center">
              <Settings className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Settings</h3>
              <p className="text-gray-500">Settings feature coming soon</p>
            </div>
          )}
        </div>

        <CompanyModal
          isOpen={isCompanyModalOpen}
          onClose={() => setIsCompanyModalOpen(false)}
          onSuccess={() => {
            loadCompanies();
            setIsCompanyModalOpen(false);
          }}
        />

        <DepartmentModal
          isOpen={isDepartmentModalOpen}
          onClose={() => setIsDepartmentModalOpen(false)}
        />

        <DeleteCompanyDialog
          isOpen={deleteConfirm.isOpen}
          companyName={deleteConfirm.companyName}
          onClose={() => setDeleteConfirm({ isOpen: false, companyId: null, companyName: '' })}
          onConfirm={confirmDeleteCompany}
          isLoading={appLoading}
        />

        <PrinterDetailModal
          printer={selectedPrinter}
          isOpen={isPrinterModalOpen}
          onClose={() => setIsPrinterModalOpen(false)}
        />
      </main>
    </div>
  );
}