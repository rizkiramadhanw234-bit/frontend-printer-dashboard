"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  Search,
  Printer,
  RefreshCw,
  AlertCircle,
  Monitor,
  Users,
  BarChart3,
  Cloud,
  Settings,
  LayoutDashboard,
  Info,
  Eye,
  History,
  Download,
  Filter,
  ChevronRight,
  Server,
  Wifi,
  Battery,
  Calendar,
  FileText,
  Bell,
  Home,
  Database,
  Shield,
  Activity,
  Cpu,
  HardDrive,
  Network,
} from "lucide-react";

import { useRequireAuth } from "../../store/requiredAuth";

// Shadcn Components
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import AgentTable from "../agent/page"

// Custom Components
import Sidebar from "../../components/Sidebar";
import Footer from "../../components/Footer";
import HealthPrinter from "../../components/cards/HealthPrinter";
import PrinterTable from "../../components/tables/PrinterTable";
import PrinterCard from "../../components/cards/PrinterCard";
import DailyReport from "../../components/cards/DailyReport";
import InkStatus from "../../components/cards/InkStatus";

// Stores
import { usePrinterStore } from "../../store/printer.store";
import { useSystemStore } from "../../store/system.store";
import { useWebSocketStore } from "../../store/ws.store";

export default function Dashboard() {
  // ==================== STATE ====================
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedPrinter, setSelectedPrinter] = useState(null);
  const [isClient, setIsClient] = useState(false);
  const [monthlyReportData, setMonthlyReportData] = useState([]);
  const [isManualLoading, setIsManualLoading] = useState(false);
  const [isAgentLoading, setIsAgentLoading] = useState(false);
  const { loading } = useRequireAuth();

  // ==================== REFS ====================
  const lastRefreshTimeRef = useRef(0);
  const lastAgentChangeTimeRef = useRef(0);
  const fetchHealthRef = useRef(null);
  const fetchConnectedAgentsRef = useRef(null);
  const fetchDailyReportRef = useRef(null);
  const connectRef = useRef(null);
  const loadSettingsRef = useRef(null);
  const wsCleanupRef = useRef(null);
  const isMountedRef = useRef(true);

  // ==================== STORES ====================
  const {
    agents,
    printers,
    selectedAgent,
    alerts,
    isLoading,
    error,
    fetchConnectedAgents,
    fetchAgentPrinters,
    fetchDailyReport,
    fetchMonthlyReport,
    clearAlerts,
    setSelectedAgent,
    getTotalPagesToday,
    getOfflinePrinters,
    getPrintersWithLowInk,
    getPrintersWithCriticalInk,
  } = usePrinterStore();

  const { health, settings, loadSettings, fetchHealth } = useSystemStore();
  const { isConnected, connect } = useWebSocketStore();

  // ==================== EFFECTS ====================

  useEffect(() => {
    fetchHealthRef.current = fetchHealth;
    fetchConnectedAgentsRef.current = fetchConnectedAgents;
    fetchDailyReportRef.current = fetchDailyReport;
    connectRef.current = connect;
    loadSettingsRef.current = loadSettings;
  }, [
    fetchHealth,
    fetchConnectedAgents,
    fetchDailyReport,
    connect,
    loadSettings,
  ]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const loadInitialData = useCallback(async () => {
    try {
      await Promise.all([
        fetchHealthRef.current(),
        fetchConnectedAgentsRef.current(),
        fetchDailyReportRef.current(),
      ]);
    } catch (error) {
      console.error("Failed to load initial data:", error);
    }
  }, []);

  useEffect(() => {
    if (!isClient) return;

    console.log("📱 DashboardPage mounting...");
    isMountedRef.current = true;

    loadSettingsRef.current();

    const setupWebSocket = () => {
      if (!isMountedRef.current || !settings?.enableWebSocket) return;

      console.log("🔌 Setting up WebSocket subscriptions...");

      if (wsCleanupRef.current) {
        wsCleanupRef.current();
        wsCleanupRef.current = null;
      }

      const wsTimeout = setTimeout(() => {
        if (!isMountedRef.current) return;

        wsCleanupRef.current = connectRef.current();
        console.log("✅ WebSocket subscriptions established");
      }, 2000);

      return () => clearTimeout(wsTimeout);
    };

    const setupAutoRefresh = () => {
      let refreshInterval;

      if (settings?.autoRefresh) {
        const interval = Math.max(settings?.refreshInterval || 15000, 10000);
        console.log(`🔄 Setting up auto-refresh every ${interval}ms`);

        let lastRefresh = 0;
        const MIN_REFRESH_INTERVAL = 5000;

        refreshInterval = setInterval(() => {
          if (!isMountedRef.current) return;

          const now = Date.now();
          if (now - lastRefresh < MIN_REFRESH_INTERVAL) {
            console.log("⏸️ Skipping auto-refresh - too soon");
            return;
          }

          lastRefresh = now;
          console.log("🔄 Auto-refresh triggered");

          Promise.allSettled([
            fetchHealthRef.current(),
            fetchConnectedAgentsRef.current(),
          ]).then((results) => {
            const errors = results
              .filter((r) => r.status === "rejected")
              .map((r) => r.reason.message);

            if (errors.length > 0) {
              console.warn("Some fetches failed:", errors);
            }
          });
        }, interval);
      }

      return refreshInterval;
    };

    loadInitialData();

    const wsCleanupTimeout = setupWebSocket();
    const refreshInterval = setupAutoRefresh();

    return () => {
      console.log("📱 DashboardPage unmounting...");
      isMountedRef.current = false;

      if (wsCleanupTimeout) {
        clearTimeout(wsCleanupTimeout);
      }

      if (wsCleanupRef.current) {
        wsCleanupRef.current();
        wsCleanupRef.current = null;
      }

      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [
    isClient,
    settings?.enableWebSocket,
    settings?.autoRefresh,
    settings?.refreshInterval,
    loadInitialData,
  ]);

  useEffect(() => {
    if (activeTab === "monthly-report") {
      const currentDate = new Date();
      fetchMonthlyReport(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
      ).then((data) => {
        if (data && data.dailyData) {
          setMonthlyReportData(data.dailyData);
        }
      });
    }
  }, [activeTab, fetchMonthlyReport]);

  // ==================== HANDLERS ====================

  const handleRefresh = async () => {
    const now = Date.now();
    if (now - lastRefreshTimeRef.current < 3000) {
      return;
    }

    lastRefreshTimeRef.current = now;
    setIsManualLoading(true);

    try {
      await Promise.allSettled([
        fetchHealthRef.current(),
        fetchConnectedAgentsRef.current(),
        fetchDailyReportRef.current(),
      ]);
    } catch (error) {
      console.error("Failed to refresh data:", error);
    } finally {
      setTimeout(() => {
        setIsManualLoading(false);
      }, 500);
    }
  };

  const handlePrinterSelect = (printerName) => {
    setSelectedPrinter(printerName);
    setActiveTab("details");
  };

  const handleAgentChange = (agentId) => {
    const now = Date.now();
    if (now - lastAgentChangeTimeRef.current < 1000) {
      console.log("⏸️ Skipping agent change - too soon");
      return;
    }

    lastAgentChangeTimeRef.current = now;
    setIsAgentLoading(true);

    const agent = agents.find((a) => a.agentId === agentId);
    if (agent) {
      setSelectedAgent(agent);

      setTimeout(() => {
        setIsAgentLoading(false);
      }, 2000);
    }
  };

  // ==================== HELPER FUNCTIONS ====================

  const getLoadingText = () => {
    if (isManualLoading) return "Refreshing data...";
    if (isAgentLoading)
      return `Loading ${selectedAgent?.name || "agent"} printers...`;
    if (isLoading) return "Loading printers data...";
    return "Loading...";
  };

  const getAlertCount = () => {
    if (!alerts || !Array.isArray(alerts)) return 0;
    return alerts.filter(
      (alert) => alert.type === "error" || alert.type === "warning",
    ).length;
  };

  const getSystemAlerts = () => {
    const systemAlerts = [];

    if (health.status !== "ok") {
      systemAlerts.push({
        id: "health-error",
        type: "error",
        title: "System Health Issue",
        message: `System health status: ${health.status}`,
        timestamp: new Date().toISOString(),
      });
    }

    if (!isConnected && settings?.enableWebSocket) {
      systemAlerts.push({
        id: "ws-disconnected",
        type: "warning",
        title: "WebSocket Disconnected",
        message: "Real-time updates unavailable",
        timestamp: new Date().toISOString(),
      });
    }

    if (selectedAgent && selectedAgent.status !== "online") {
      systemAlerts.push({
        id: "agent-offline",
        type: "error",
        title: "Agent Offline",
        message: `${selectedAgent.name} is offline`,
        timestamp: new Date().toISOString(),
      });
    }

    return systemAlerts;
  };

  const getPrinterAlerts = () => {
    const printerAlerts = [];

    if (!printers || printers.length === 0) {
      return printerAlerts;
    }

    printers.forEach((printer) => {
      if (printer.hasCriticalInk) {
        printerAlerts.push({
          id: `critical-ink-${printer.name}`,
          type: "error",
          title: "Critical Ink Level",
          message: `${printer.displayName || printer.name} has critical ink levels`,
          timestamp: new Date().toISOString(),
          printer: printer.name,
        });
      } else if (printer.hasLowInk) {
        printerAlerts.push({
          id: `low-ink-${printer.name}`,
          type: "warning",
          title: "Low Ink Warning",
          message: `${printer.displayName || printer.name} has low ink levels`,
          timestamp: new Date().toISOString(),
          printer: printer.name,
        });
      }

      if (printer.status === "error") {
        printerAlerts.push({
          id: `printer-error-${printer.name}`,
          type: "error",
          title: "Printer Error",
          message: `${printer.displayName || printer.name} is in error state`,
          timestamp: new Date().toISOString(),
          printer: printer.name,
        });
      }

      if (printer.status === "offline" || printer.status === "unknown") {
        printerAlerts.push({
          id: `printer-offline-${printer.name}`,
          type: "warning",
          title: "Printer Offline",
          message: `${printer.displayName || printer.name} is offline`,
          timestamp: new Date().toISOString(),
          printer: printer.name,
        });
      }
    });

    return printerAlerts;
  };

  const getPrinterStats = () => {
    if (!printers || !Array.isArray(printers)) {
      return { total: 0, offline: 0, lowInk: 0, criticalInk: 0, pagesToday: 0 };
    }

    const total = printers.length;
    const offline = getOfflinePrinters().length;
    const lowInk = getPrintersWithLowInk().length;
    const criticalInk = getPrintersWithCriticalInk().length;
    const pagesToday = getTotalPagesToday();

    return { total, offline, lowInk, criticalInk, pagesToday };
  };

  // ==================== RENDER FUNCTIONS ====================

  const renderStatusBadge = (status) => {
    const statusConfig = {
      online: { variant: "default", color: "bg-green-500" },
      offline: { variant: "destructive", color: "bg-red-500" },
      error: { variant: "destructive", color: "bg-red-500" },
      warning: { variant: "outline", color: "bg-yellow-500" },
      success: { variant: "default", color: "bg-green-500" },
    };

    const config = statusConfig[status] || {
      variant: "secondary",
      color: "bg-gray-500",
    };

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <div className={`w-2 h-2 rounded-full ${config.color}`} />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const renderStatsCards = () => {
    const stats = getPrinterStats();
    if (loading) return <p>Loading...</p>;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Printers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              All connected devices
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Offline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats.offline}
            </div>
            <p className="text-xs text-muted-foreground">Require attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Low Ink
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {stats.lowInk}
            </div>
            <p className="text-xs text-muted-foreground">Below 20%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Critical Ink
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats.criticalInk}
            </div>
            <p className="text-xs text-muted-foreground">Below 10%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Today&apos;s Pages
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats.pagesToday}
            </div>
            <p className="text-xs text-muted-foreground">Total printed pages</p>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderAgentSelector = () => (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Monitor className="h-5 w-5" />
          Select Client
        </CardTitle>
        <CardDescription>
          Choose an agent to monitor its printers
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <Select
            value={selectedAgent?.agentId}
            onValueChange={handleAgentChange}
            disabled={isLoading || isAgentLoading}
          >
            <SelectTrigger className="w-full sm:w-[300px]">
              <SelectValue placeholder="Select an agent" />
            </SelectTrigger>
            <SelectContent>
              {agents.map((agent) => (
                <SelectItem key={agent.agentId} value={agent.agentId}>
                  <div className="flex items-center gap-2">
                    <Server className="h-4 w-4" />
                    <span>{agent.name}</span>
                    <Badge
                      variant={
                        agent.status === "online" ? "default" : "destructive"
                      }
                    >
                      {agent.status}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            disabled={isManualLoading}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isManualLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>

        {selectedAgent && (
          <>
            <Separator className="my-4" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Company
                </p>
                <p className="font-semibold">{selectedAgent.company}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Location
                </p>
                <p className="font-semibold">
                  {selectedAgent.location || "N/A"}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Printers
                </p>
                <p className="font-semibold">
                  {selectedAgent.printerCount || 0}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Last Seen
                </p>
                <p className="font-semibold">
                  {selectedAgent.lastSeen
                    ? new Date(selectedAgent.lastSeen).toLocaleTimeString()
                    : "N/A"}
                </p>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );

  const renderAlertsSection = () => {
    const systemAlerts = getSystemAlerts();
    const printerAlerts = getPrinterAlerts();
    const totalAlerts = systemAlerts.length + printerAlerts.length;

    return (
      <Tabs defaultValue="system" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="system" className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            System Alerts
            {systemAlerts.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {systemAlerts.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="printer" className="flex items-center gap-2">
            <Printer className="h-4 w-4" />
            Printer Alerts
            {printerAlerts.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {printerAlerts.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="system" className="space-y-4 mt-4">
          {systemAlerts.length > 0 ? (
            systemAlerts.map((alert) => (
              <Alert
                key={alert.id}
                variant={alert.type === "error" ? "destructive" : "default"}
              >
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>{alert.title}</AlertTitle>
                <AlertDescription>
                  {alert.message}
                  <div className="text-xs text-muted-foreground mt-1">
                    {new Date(alert.timestamp).toLocaleString()}
                  </div>
                </AlertDescription>
              </Alert>
            ))
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>No System Alerts</AlertTitle>
              <AlertDescription>
                All system components are operating normally
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent value="printer" className="space-y-4 mt-4">
          {printerAlerts.length > 0 ? (
            printerAlerts.map((alert, index) => (
              <Alert
                key={alert.id || index}
                variant={alert.type === "error" ? "destructive" : "default"}
              >
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>{alert.title}</AlertTitle>
                <AlertDescription>
                  {alert.message}
                  {alert.printer && (
                    <div className="text-sm mt-1">Printer: {alert.printer}</div>
                  )}
                  <div className="text-xs text-muted-foreground mt-1">
                    {new Date(alert.timestamp).toLocaleString()}
                  </div>
                </AlertDescription>
              </Alert>
            ))
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>No Printer Alerts</AlertTitle>
              <AlertDescription>
                All printers are operating normally
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>
      </Tabs>
    );
  };

  const renderCloudStatus = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cloud className="h-5 w-5" />
            Cloud Connection Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Server className="h-4 w-4" />
                  Backend Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className={`text-2xl font-bold ${health.status === "ok" ? "text-green-600" : "text-red-600"}`}
                >
                  {health.status === "ok" ? "Online" : "Offline"}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Wifi className="h-4 w-4" />
                  WebSocket
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className={`text-2xl font-bold ${isConnected ? "text-green-600" : "text-red-600"}`}
                >
                  {isConnected ? "Connected" : "Disconnected"}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Monitor className="h-4 w-4" />
                  Connected Agents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {health.agents?.connected || 0}
                  <span className="text-sm text-muted-foreground ml-2">
                    / {health.agents?.total || 0}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Connection Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label className="text-sm text-muted-foreground">
                  Backend URL
                </Label>
                <div className="font-mono text-sm bg-muted p-2 rounded">
                  {process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-sm text-muted-foreground">
                  WebSocket URL
                </Label>
                <div className="font-mono text-sm bg-muted p-2 rounded">
                  {process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3002"}
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-sm text-muted-foreground">Uptime</Label>
                <div className="font-semibold">
                  {Math.floor((health.uptime || 0) / 3600)}h{" "}
                  {Math.floor(((health.uptime || 0) % 3600) / 60)}m
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-sm text-muted-foreground">
                  Last Update
                </Label>
                <div className="font-semibold">
                  {health.timestamp
                    ? new Date(health.timestamp).toLocaleString()
                    : "Never"}
                </div>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Dashboard Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <CardTitle className="text-lg">Auto Refresh Settings</CardTitle>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="refresh-interval">Auto Refresh Interval</Label>
                <Select
                  defaultValue={
                    settings?.refreshInterval?.toString() || "5000"
                  }
                  onValueChange={(value) => {
                    useSystemStore
                      .getState()
                      .updateSettings({ refreshInterval: parseInt(value) });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select interval" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10000">10 seconds</SelectItem>
                    <SelectItem value="30000">30 seconds</SelectItem>
                    <SelectItem value="60000">1 minute</SelectItem>
                    <SelectItem value="300000">5 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="low-ink">Low Ink Threshold</Label>
                <Select
                  defaultValue={settings?.lowInkThreshold?.toString() || "15"}
                  onValueChange={(value) => {
                    useSystemStore
                      .getState()
                      .updateSettings({ lowInkThreshold: parseInt(value) });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select threshold" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10%</SelectItem>
                    <SelectItem value="15">15%</SelectItem>
                    <SelectItem value="20">20%</SelectItem>
                    <SelectItem value="25">25%</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="critical-ink">Critical Ink Threshold</Label>
                <Select
                  defaultValue={
                    settings?.criticalInkThreshold?.toString() || "10"
                  }
                  onValueChange={(value) => {
                    useSystemStore
                      .getState()
                      .updateSettings({
                        criticalInkThreshold: parseInt(value),
                      });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select threshold" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5%</SelectItem>
                    <SelectItem value="10">10%</SelectItem>
                    <SelectItem value="15">15%</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <CardTitle className="text-lg">Feature Toggles</CardTitle>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="websocket" className="font-medium">
                    WebSocket Updates
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Enable real-time updates via WebSocket
                  </p>
                </div>
                <Switch
                  id="websocket"
                  checked={settings?.enableWebSocket}
                  onCheckedChange={(checked) => {
                    useSystemStore
                      .getState()
                      .updateSettings({ enableWebSocket: checked });
                  }}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-refresh" className="font-medium">
                    Auto Refresh
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically refresh data
                  </p>
                </div>
                <Switch
                  id="auto-refresh"
                  checked={settings?.autoRefresh}
                  onCheckedChange={(checked) => {
                    useSystemStore
                      .getState()
                      .updateSettings({ autoRefresh: checked });
                  }}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="printer-control" className="font-medium">
                    Printer Control
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Allow pausing/resuming printers
                  </p>
                </div>
                <Switch
                  id="printer-control"
                  checked={settings?.enablePrinterControl}
                  onCheckedChange={(checked) => {
                    useSystemStore
                      .getState()
                      .updateSettings({ enablePrinterControl: checked });
                  }}
                />
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <CardTitle className="text-lg">System Information</CardTitle>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-sm text-muted-foreground">
                  App Name
                </Label>
                <p>
                  {process.env.NEXT_PUBLIC_APP_NAME ||
                    "Printer Monitoring Dashboard"}
                </p>
              </div>
              <div className="space-y-1">
                <Label className="text-sm text-muted-foreground">Version</Label>
                <p>{process.env.NEXT_PUBLIC_APP_VERSION || "1.0.0"}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-sm text-muted-foreground">Company</Label>
                <p>{process.env.NEXT_PUBLIC_COMPANY_NAME || "PT. Kudukuats"}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-sm text-muted-foreground">
                  Timezone
                </Label>
                <p>{process.env.NEXT_PUBLIC_TIMEZONE || "Asia/Jakarta"}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderMonthlyReport = () => (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Printing Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {monthlyReportData.length > 0 ? (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Pages Printed</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {monthlyReportData.map((day, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">
                        {new Date(day.date).toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-bold">
                            {day.pages.toLocaleString()}
                          </span>
                          <Progress
                            value={Math.min((day.pages / 100) * 100, 100)}
                            className="w-25"
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        {day.pages === 0 ? (
                          <Badge variant="outline">No Activity</Badge>
                        ) : day.pages < 10 ? (
                          <Badge variant="default">Low</Badge>
                        ) : day.pages < 50 ? (
                          <Badge variant="secondary">Normal</Badge>
                        ) : (
                          <Badge variant="destructive">High</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Pages
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {monthlyReportData
                      .reduce((sum, day) => sum + day.pages, 0)
                      .toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">pages</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Average Daily
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {Math.round(
                      monthlyReportData.reduce(
                        (sum, day) => sum + day.pages,
                        0,
                      ) / monthlyReportData.length,
                    ).toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">pages/day</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Active Days
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {monthlyReportData.filter((day) => day.pages > 0).length}
                  </div>
                  <p className="text-xs text-muted-foreground">days</p>
                </CardContent>
              </Card>
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              No monthly report data available
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );

  // ==================== MAIN RENDER ====================

  if (!isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-primary/20 rounded-full"></div>
            <div className="absolute top-0 left-0 w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
          <div className="text-muted-foreground">Loading Dashboard...</div>
        </div>
      </div>
    );
  }

  const printerStats = getPrinterStats();
  const alertCount = getAlertCount();

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

        <main className="flex-1 p-6">
          {/* Header */}
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">
                  {process.env.NEXT_PUBLIC_APP_NAME ||
                    "Printer Monitoring Dashboard"}
                </h1>
                <div className="flex flex-wrap items-center gap-4 mt-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`}
                    />
                    <span className="text-sm text-muted-foreground">
                      {isConnected ? "WS Connected" : "WS Disconnected"}
                    </span>
                  </div>
                  {selectedAgent && (
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {selectedAgent.company} - {printerStats.total} printers
                    </span>
                  )}
                  <span className="text-sm text-muted-foreground">
                    {printerStats.pagesToday} pages today
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  {printerStats.offline > 0 && (
                    <Badge
                      variant="destructive"
                      className="flex items-center gap-1"
                    >
                      <AlertCircle className="h-3 w-3" />
                      {printerStats.offline} Offline
                    </Badge>
                  )}
                  {printerStats.lowInk > 0 && (
                    <Badge
                      variant="outline"
                      className="bg-amber-50 text-amber-800 border-amber-200 flex items-center gap-1"
                    >
                      <AlertCircle className="h-3 w-3" />
                      {printerStats.lowInk} Low Ink
                    </Badge>
                  )}
                  {printerStats.criticalInk > 0 && (
                    <Badge
                      variant="destructive"
                      className="flex items-center gap-1"
                    >
                      <AlertCircle className="h-3 w-3" />
                      {printerStats.criticalInk} Critical
                    </Badge>
                  )}
                </div>

                <Button
                  onClick={handleRefresh}
                  disabled={isLoading || isManualLoading}
                  className="flex items-center gap-2 min-w-25"
                >
                  <div className="relative flex items-center justify-center">
                    <RefreshCw
                      className={`h-4 w-4 transition-all ${isManualLoading ? "opacity-0" : "opacity-100"
                        }`}
                    />
                    {isManualLoading && (
                      <div className="absolute top-0 left-0 w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                    )}
                  </div>
                  Refresh
                </Button>
              </div>
            </div>

            {renderStatsCards()}
          </div>

          {/* Error Alerts */}
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error Loading Data</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!isConnected && settings?.enableWebSocket && (
            <Alert variant="warning" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>WebSocket Disconnected</AlertTitle>
              <AlertDescription>
                Real-time updates unavailable. Using polling mode.
                <div className="mt-1 text-sm text-muted-foreground font-mono">
                  Server:{" "}
                  {process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3002"}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {!selectedAgent && (
            <Alert className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>No Agent Selected</AlertTitle>
              <AlertDescription>
                Please select an agent from the dropdown to view printers
              </AlertDescription>
            </Alert>
          )}

          {/* Main Tabs */}
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >


            <div className="mt-6">
              {(isLoading || isManualLoading || isAgentLoading) && (
                <div className="flex flex-col items-center justify-center py-8 space-y-4">
                  <div className="relative">
                    <div className="w-12 h-12 border-4 border-primary/20 rounded-full"></div>
                    <div className="absolute top-0 left-0 w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                  </div>
                  <p className="text-muted-foreground">{getLoadingText()}</p>
                </div>
              )}

              <TabsContent value="overview" className="space-y-6">
                {renderAgentSelector()}

                {/* <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      System Health
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <HealthPrinter />
                  </CardContent>
                </Card> */}

                {selectedAgent && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Printer className="h-5 w-5" />
                        Printer List
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <PrinterTable onRowClick={handlePrinterSelect} />
                    </CardContent>
                  </Card>
                )}


                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Daily Report
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <DailyReport />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="agents" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Agent Management
                    </CardTitle>
                    <CardDescription>
                      Manage and monitor all connected agents
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <AgentTable />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="details">
                {selectedPrinter ? (
                  <div className="space-y-4">
                    <Button
                      variant="outline"
                      onClick={() => setActiveTab("overview")}
                      className="mb-4"
                    >
                      <ChevronRight className="h-4 w-4 mr-2 rotate-180" />
                      Back to Overview
                    </Button>
                    <PrinterCard printerName={selectedPrinter} />
                  </div>
                ) : (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>No Printer Selected</AlertTitle>
                    <AlertDescription>
                      Select a printer from the overview tab
                    </AlertDescription>
                  </Alert>
                )}
              </TabsContent>

              <TabsContent value="reports" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Printing Reports
                    </CardTitle>
                    <CardDescription>
                      View detailed reports of printing activities, ink usage,
                      and printer performance
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="daily" className="w-full">
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="daily">Daily Report</TabsTrigger>
                        <TabsTrigger value="monthly">
                          Monthly Report
                        </TabsTrigger>
                        <TabsTrigger value="ink">Ink Reports</TabsTrigger>
                      </TabsList>

                      <TabsContent value="daily" className="mt-4">
                        <DailyReport />
                      </TabsContent>

                      <TabsContent value="monthly" className="mt-4">
                        {renderMonthlyReport()}
                      </TabsContent>

                      <TabsContent value="ink" className="mt-4">
                        {selectedPrinter ? (
                          <InkStatus printerName={selectedPrinter} />
                        ) : (
                          <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Select a Printer</AlertTitle>
                            <AlertDescription>
                              Please select a printer from the overview tab to
                              view ink reports
                            </AlertDescription>
                          </Alert>
                        )}
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="alerts" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bell className="h-5 w-5" />
                      System Alerts
                    </CardTitle>
                    <CardDescription>
                      Monitor system and printer alerts in real-time
                    </CardDescription>
                  </CardHeader>
                  <CardContent>{renderAlertsSection()}</CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="cloud" className="space-y-6">
                {renderCloudStatus()}
              </TabsContent>

              <TabsContent value="settings" className="space-y-6">
                {renderSettings()}
              </TabsContent>
            </div>
          </Tabs>
        </main>
      </div>
      <Footer />
    </div>
  );
}
