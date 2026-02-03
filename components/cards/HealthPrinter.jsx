"use client";

import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import {
  Monitor,
  Wifi,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Printer,
  FileText,
  Server,
  Activity,
  AlertCircle,
} from "lucide-react";

import { useSystemStore } from "../../store/system.store";
import { usePrinterStore } from "../../store/printer.store";
import { useWebSocketStore } from "../../store/ws.store";

export default function HealthPrinter() {
  const [isClient, setIsClient] = useState(false);
  const [localLoading, setLocalLoading] = useState(true);
  const [lastChecked, setLastChecked] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const {
    health = {},
    fetchHealth,
    isLoading: healthLoading,
  } = useSystemStore();
  const {
    printers = [],
    selectedAgent,
    getTotalPagesToday,
    getOfflinePrinters,
    fetchAgentPrinters,
    isLoading: printersLoading,
  } = usePrinterStore();

  const { isConnected } = useWebSocketStore();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const loadData = async () => {
    try {
      setIsRefreshing(true);
      await Promise.all([fetchHealth()]);
      if (selectedAgent && selectedAgent.agentId) {
        await fetchAgentPrinters(selectedAgent.agentId);
      }
      setLastChecked(new Date());
    } catch (error) {
      console.error("Error loading health data:", error);
    } finally {
      setIsRefreshing(false);
      setLocalLoading(false);
    }
  };

  useEffect(() => {
    if (!isClient) return;

    loadData();

    const interval = setInterval(() => {
      fetchHealth();
      setLastChecked(new Date());
    }, 5000);

    return () => clearInterval(interval);
  }, [isClient, fetchHealth, fetchAgentPrinters, selectedAgent]);

  // Safe calculations dengan error handling
  const calculateMetrics = () => {
    let totalPrinters = 0;
    let offlinePrinters = 0;
    let onlinePrinters = 0;
    let totalPages = 0;

    try {
      totalPrinters = Array.isArray(printers) ? printers.length : 0;
      const offlineArray = getOfflinePrinters();
      offlinePrinters = Array.isArray(offlineArray) ? offlineArray.length : 0;
      onlinePrinters = Math.max(0, totalPrinters - offlinePrinters);
      totalPages = getTotalPagesToday();
    } catch (error) {
      console.error("Error calculating printer metrics:", error);
    }

    return { totalPrinters, offlinePrinters, onlinePrinters, totalPages };
  };

  const { totalPrinters, offlinePrinters, onlinePrinters, totalPages } =
    calculateMetrics();

  const getHealthStatus = () => {
    if (localLoading || printersLoading || healthLoading || isRefreshing)
      return "loading";
    if (!health || health.status === "unknown") return "loading";
    if (health.status === "ok" && isConnected && offlinePrinters === 0)
      return "healthy";
    if (offlinePrinters > 0 || !isConnected) return "warning";
    return "error";
  };

  const healthStatus = getHealthStatus();

  const getStatusConfig = () => {
    switch (healthStatus) {
      case "healthy":
        return {
          variant: "default",
          icon: CheckCircle,
          title: "All Systems Operational",
          description: "All printers are online and functioning normally",
          color: "text-green-600",
          bgColor: "bg-green-50",
          borderColor: "border-green-200",
        };
      case "warning":
        return {
          variant: "warning",
          icon: AlertTriangle,
          title: "Partial Outage",
          description: `${offlinePrinters} printer(s) offline or low ink detected`,
          color: "text-amber-600",
          bgColor: "bg-amber-50",
          borderColor: "border-amber-200",
        };
      case "error":
        return {
          variant: "destructive",
          icon: AlertCircle,
          title: "System Issues",
          description: "Unable to connect to monitoring service",
          color: "text-red-600",
          bgColor: "bg-red-50",
          borderColor: "border-red-200",
        };
      default:
        return {
          variant: "default",
          icon: RefreshCw,
          title: "Loading system status...",
          description: "Please wait while we check system health",
          color: "text-muted-foreground",
          bgColor: "bg-muted",
          borderColor: "border-muted",
        };
    }
  };

  const statusConfig = getStatusConfig();
  const StatusIcon = statusConfig.icon;

  // Tampilkan skeleton loading jika belum client-side
  if (!isClient) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <div className="grid grid-cols-3 gap-4">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Monitor className="h-5 w-5" />
          System Health
        </CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={loadData}
          disabled={isRefreshing}
          className="gap-2"
        >
          <RefreshCw
            className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Health Status Alert */}
        <Alert
          variant={statusConfig.variant}
          className={`${statusConfig.bgColor} ${statusConfig.borderColor}`}
        >
          <StatusIcon className={`h-4 w-4 ${statusConfig.color}`} />
          <AlertTitle className={statusConfig.color}>
            {statusConfig.title}
          </AlertTitle>
          <AlertDescription className="text-sm mt-1">
            {statusConfig.description}
          </AlertDescription>
        </Alert>

        {/* Health Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-card border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Printer className="h-4 w-4 text-muted-foreground" />
              <div className="text-sm font-medium text-muted-foreground">
                Printers Online
              </div>
            </div>
            <div
              className={`text-2xl font-bold ${onlinePrinters === totalPrinters ? "text-green-600" : "text-amber-600"}`}
            >
              {onlinePrinters}
              <span className="text-sm font-normal text-muted-foreground">
                {" "}
                / {totalPrinters}
              </span>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {offlinePrinters > 0
                ? `${offlinePrinters} offline`
                : "All online"}
            </div>
          </div>

          <div className="bg-card border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <div className="text-sm font-medium text-muted-foreground">
                Today&apos;s Pages
              </div>
            </div>
            <div className="text-2xl font-bold text-blue-600">
              {totalPages.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Total printed pages
            </div>
          </div>

          <div className="bg-card border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Wifi
                className={`h-4 w-4 ${isConnected ? "text-green-600" : "text-red-600"}`}
              />
              <div className="text-sm font-medium text-muted-foreground">
                WebSocket
              </div>
            </div>
            <div
              className={`text-2xl font-bold ${isConnected ? "text-green-600" : "text-red-600"}`}
            >
              {isConnected ? "Connected" : "Disconnected"}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {isConnected ? "Real-time updates" : "Polling mode"}
            </div>
          </div>
        </div>

        <Separator />

        {/* Printer Status Progress */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <div className="text-sm font-medium">Printer Status</div>
            <div className="text-sm text-muted-foreground">
              {onlinePrinters}/{totalPrinters} Online
            </div>
          </div>
          <Progress
            value={
              totalPrinters > 0 ? (onlinePrinters / totalPrinters) * 100 : 0
            }
            className="h-2"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Offline</span>
            <span>Online</span>
          </div>
        </div>

        {/* System Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Server className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Connected Agents</span>
            </div>
            <div className="ml-6">
              {health?.agents ? (
                <div className="flex items-center gap-2">
                  <span className="font-mono">{health.agents.connected}</span>
                  <span className="text-muted-foreground">/</span>
                  <span className="text-muted-foreground">
                    {health.agents.total}
                  </span>
                  <Badge
                    variant={
                      health.agents.connected === health.agents.total
                        ? "default"
                        : "secondary"
                    }
                  >
                    {Math.round(
                      (health.agents.connected / health.agents.total) * 100,
                    )}
                    %
                  </Badge>
                </div>
              ) : (
                <span className="text-muted-foreground">No agent data</span>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">System Uptime</span>
            </div>
            <div className="ml-6">
              {health?.uptime ? (
                <div className="flex items-center gap-2">
                  <span>{Math.floor(health.uptime / 3600)}h</span>
                  <span>{Math.floor((health.uptime % 3600) / 60)}m</span>
                  <Badge variant="outline">
                    {Math.floor(health.uptime / 86400)}d
                  </Badge>
                </div>
              ) : (
                <span className="text-muted-foreground">Not available</span>
              )}
            </div>
          </div>
        </div>

        {/* No Printers Alert */}
        {printers.length === 0 && !localLoading && !isRefreshing && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>No Printers Found</AlertTitle>
            <AlertDescription>
              No printers are currently being monitored. Check if the backend
              service is running.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>

      <CardFooter className="border-t pt-4">
        <div className="text-xs text-muted-foreground w-full flex justify-between items-center">
          <div>
            Health status:{" "}
            <Badge
              variant={healthStatus === "healthy" ? "default" : "secondary"}
            >
              {healthStatus.charAt(0).toUpperCase() + healthStatus.slice(1)}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            {lastChecked && (
              <>
                <span>Last checked:</span>
                <span className="font-medium">
                  {lastChecked.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </>
            )}
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
