"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/app.store";
import { useAuthStore } from "@/store/auth.store";
import { usePrinterStore } from "@/store/printer.store";
import { useDailyReportStore } from "@/store/daily.reports";
import {api} from "@/services/api"
import { Badge } from "@/components/ui/badge";
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
import { Button } from "@/components/ui/button";
import {
  RefreshCw,
  Printer,
  AlertCircle,
  BarChart3,
  Settings,
  Building,
  Users,
} from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated, checkAuth } = useAuthStore();

  // ========== APP STORE ==========
  const {
    // State
    agents,
    printers: appPrinters,
    health,
    companies,
    isLoading,
    // Actions
    loadAgents,
    loadHealth,
    loadCompanies,
    selectAgent,
    deleteCompany,
    getStats,
    selectedAgent: selectedAgentGetter,
  } = useAppStore();

  // ========== PRINTER STORE ==========
  const {
    allPrinters,
    printers: agentPrinters,
    setSelectedAgent: setPrinterSelectedAgent,
    fetchAllAgents: fetchAllPrinterAgents,
    fetchAllPrinters,
    getAllPrintersStatistics,
    getPrintersByStatus,
  } = usePrinterStore();

  // ======daily reports
  const {
    reports: dailyReports,
    summary: dailySummary,
    fetchAgentReports
  } = useDailyReportStore();

  // ========== LOCAL UI STATE ==========
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

  // ========== GETTERS ==========
  const selectedAgent = selectedAgentGetter();
  const stats = getStats();

  // Untuk Overview tab: pake agentPrinters (printer per agent)
  const overviewPrinters = agentPrinters;

  // Untuk Printer Management tab: pake allPrinters (semua printer dari database)
  const allSystemPrinters = allPrinters;

  // Stats untuk overview
  const overviewPrinterStats = {
    total: overviewPrinters.length,
    online: overviewPrinters.filter(p => p.isOnline || p.status === 'READY' || p.status === 'ONLINE').length,
    offline: overviewPrinters.filter(p => !p.isOnline && p.status !== 'READY' && p.status !== 'ONLINE').length,
    totalPages: overviewPrinters.reduce((sum, p) => sum + (parseInt(p.pagesToday) || 0), 0)
  };

  // Stats untuk semua printer (gunakan helper dari store)
  const allPrintersStats = getAllPrintersStatistics?.() || {
    total: 0,
    online: 0,
    offline: 0,
    error: 0,
    printing: 0,
    byVendor: {}
  };

  // ========== AUTH CHECK ==========
  useEffect(() => {
    const init = async () => {
      const authed = await checkAuth();
      if (!authed) router.push('/login');
    };
    init();
  }, [checkAuth, router]);

  // ========== INITIAL LOAD ==========
  useEffect(() => {
    if (isAuthenticated) {
      const loadInitialData = async () => {
        try {
          // Load data sequentially
          await loadAgents();
          await loadHealth();
          await loadCompanies();
          await fetchAllPrinterAgents();
          await fetchAllPrinters();
        } catch (error) {
          console.error('Failed to load initial data:', error);
        }
      };

      loadInitialData();
    }
  }, [isAuthenticated, loadAgents, loadHealth, loadCompanies, fetchAllPrinterAgents, fetchAllPrinters]);

  // Sync selected agent dengan printer store
  useEffect(() => {
    if (selectedAgent) {
      setPrinterSelectedAgent(selectedAgent.id);
    }
  }, [selectedAgent, setPrinterSelectedAgent]);

  // ========== SAVE AGENT API KEY ==========
  useEffect(() => {
    const saveAgentApiKey = async () => {
      if (selectedAgent) {
        try {
          // Panggil API untuk dapetin detail agent (yang contains API key)
          const response = await api.getAgent(selectedAgent.id);
          const apiKey = response.agent?.apiKey;

          if (apiKey) {
            // Simpan di app-storage sesuai format yang dibaca getAgentApiKey()
            const store = JSON.parse(localStorage.getItem('app-storage') || '{}');
            if (!store.state) store.state = {};
            if (!store.state.agentsWithKeys) store.state.agentsWithKeys = {};
            store.state.agentsWithKeys[selectedAgent.id] = apiKey;
            localStorage.setItem('app-storage', JSON.stringify(store));

            console.log('✅ API Key saved for agent:', selectedAgent.id);
          } else {
            console.warn('⚠️ No API key in agent response:', response);
          }
        } catch (error) {
          console.error('Failed to get agent API key:', error);
        }
      }
    };

    if (selectedAgent) {
      saveAgentApiKey();
    }
  }, [selectedAgent]);

  // ========== HANDLERS ==========
  const handleSelectAgent = async (agentId) => {
    try {
      await selectAgent(agentId);
      // Printer store akan otomatis sync lewat useEffect di atas
    } catch (error) {
      console.error('Failed to select agent:', error);
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
      alert(`✅ Company "${companyName}" deleted successfully`);
    } catch (error) {
      alert(`❌ Failed to delete company: ${error.message}`);
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
        loadHealth(),
        loadCompanies(),
        fetchAllPrinterAgents(),
        fetchAllPrinters()
      ]);

      if (selectedAgent) {
        await selectAgent(selectedAgent.id);
      }
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  if (!isAuthenticated) {
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
          {/* ========== HEADER ========== */}
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

              {/* Tampilkan info berbeda tergantung tab */}
              {activeTab === "overview" && selectedAgent && (
                <p className="text-sm text-gray-500 mt-1">
                  {selectedAgent.company} • {selectedAgent.name}
                </p>
              )}

              {activeTab === "printers" && (
                <p className="text-sm text-gray-500 mt-1">
                  Total {allPrintersStats.total} printers across all agents
                </p>
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={refreshAll}
              disabled={isLoading || isRefreshing}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading || isRefreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>

          {/* ========== OVERVIEW TAB ========== */}
          {activeTab === "overview" && (
            <>
              <StatsCards stats={stats} />
              <HealthCard health={health} />

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
                {/* Left Column - Agent Selector & Daily Report */}
                <div className="lg:col-span-1 space-y-6">
                  <div className="bg-white rounded-lg border p-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">
                      Select Agent
                    </h3>
                    <select
                      value={selectedAgent?.id || ""}
                      onChange={(e) => handleSelectAgent(e.target.value)}
                      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={isLoading}
                    >
                      <option value="">-- Choose an agent --</option>
                      {agents.map((agent) => (
                        <option key={agent.id} value={agent.id}>
                          {agent.name} ({agent.company} - {agent.department})
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedAgent && (
                    <DailyReport agentId={selectedAgent.id} />
                  )}
                </div>

                {/* Right Column - Printers (hanya printer untuk agent terpilih) */}
                <div className="lg:col-span-2">
                  {overviewPrinters.length > 0 ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-gray-700">
                          Printers for {selectedAgent?.name}
                        </h3>
                        <Badge variant="outline">
                          {overviewPrinters.length} printers
                        </Badge>
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

          {/* ========== PRINTERS TAB ========== */}
          {activeTab === "printers" && (
            <>
              {/* Printer Table dengan semua printer */}
              <PrinterTable
                onPrinterSelect={(printer) => {
                  setSelectedPrinter(printer);
                  setIsPrinterModalOpen(true);
                }}
                selectedPrinterId={selectedPrinter?.id}
              />
            </>
          )}

          {/* ========== AGENTS TAB ========== */}
          {activeTab === "agents" && (
            <AgentTable
              mode="dashboard"
              onAgentSelect={handleSelectAgent}
              selectedAgentId={selectedAgent?.id}
            />
          )}

          {/* ========== COMPANIES TAB ========== */}
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
                  <Button
                    onClick={() => setIsCompanyModalOpen(true)}
                    className="gap-2"
                  >
                    <Building className="h-4 w-4" />
                    Add Company
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsDepartmentModalOpen(true)}
                    className="gap-2"
                  >
                    <Users className="h-4 w-4" />
                    Departments
                  </Button>
                </div>
              </div>

              <div className="p-6">
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase">ID</th>
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
                            No companies found. Click &quot;Add Company&quot; to create one.
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
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => handleDeleteCompany(company.id, company.name)}
                              >
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </Button>
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

          {/* ========== DEPARTMENTS TAB ========== */}
          {activeTab === "departments" && (
            <div className="bg-white rounded-lg border p-12 text-center">
              <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Department Management
              </h3>
              <p className="text-gray-500 mb-4">
                Click the button below to manage departments
              </p>
              <Button onClick={() => setIsDepartmentModalOpen(true)} className="gap-2">
                <Users className="h-4 w-4" />
                Open Department Manager
              </Button>
            </div>
          )}

          {/* ========== ALERTS TAB ========== */}
          {activeTab === "alerts" && (
            <div className="bg-white rounded-lg border p-12 text-center">
              <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Alerts</h3>
              <p className="text-gray-500">All systems are operating normally</p>
            </div>
          )}

          {/* ========== REPORTS TAB ========== */}
          {activeTab === "reports" && (
            <div className="space-y-6">
              {/* Header dengan statistik global */}
              <div className="bg-white rounded-lg border p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Print Reports Overview</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-500">Total Agents</div>
                    <div className="text-2xl font-bold">{agents.length}</div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-500">Total Printers</div>
                    <div className="text-2xl font-bold">{allPrintersStats.total || 0}</div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-500">Active Printers</div>
                    <div className="text-2xl font-bold">{allPrintersStats.online || 0}</div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-500">Companies</div>
                    <div className="text-2xl font-bold">{companies.length}</div>
                  </div>
                </div>
              </div>

              {/* Quick Agent Selector untuk Reports */}
              <div className="bg-white rounded-lg border p-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  View Reports by Agent
                </h3>
                <select
                  value={selectedAgent?.id || ""}
                  onChange={(e) => handleSelectAgent(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Select Agent --</option>
                  {agents.map((agent) => (
                    <option key={agent.id} value={agent.id}>
                      {agent.name} ({agent.company})
                    </option>
                  ))}
                </select>
              </div>

              {/* Daily Reports untuk Agent terpilih (full width) */}
              {selectedAgent ? (
                <div className="bg-white rounded-lg border p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      Daily Reports: {selectedAgent.name}
                    </h3>
                    <Badge variant="outline" className="text-xs">
                      {selectedAgent.company} - {selectedAgent.department}
                    </Badge>
                  </div>

                  {/* DailyReport component dengan limit lebih besar untuk reports tab */}
                  <DailyReport
                    agentId={selectedAgent.id}
                    limit={10}  // Tampilkan lebih banyak di halaman reports
                    showViewAll={false} // Sembunyikan tombol view all karena sudah full
                  />
                </div>
              ) : (
                <div className="bg-white rounded-lg border p-12 text-center">
                  <BarChart3 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Select an Agent</h3>
                  <p className="text-gray-500">
                    Choose an agent from the dropdown above to view their daily reports
                  </p>
                </div>
              )}

              {/* Tombol untuk laporan bulanan (future feature) */}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => alert('Monthly reports coming soon!')}>
                  Monthly Reports
                </Button>
                <Button variant="outline" onClick={() => alert('Export feature coming soon!')}>
                  Export Data
                </Button>
              </div>
            </div>
          )}

          {/* ========== SETTINGS TAB ========== */}
          {activeTab === "settings" && (
            <div className="bg-white rounded-lg border p-12 text-center">
              <Settings className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Settings</h3>
              <p className="text-gray-500">Settings feature coming soon</p>
            </div>
          )}
        </div>

        {/* ========== MODALS ========== */}
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
          isLoading={isLoading}
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