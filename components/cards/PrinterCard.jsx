"use client";

import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Printer,
  Pause,
  Play,
  AlertTriangle,
  BarChart3,
  Calendar,
  Wifi,
  Monitor,
  Info,
  Settings,
  MapPin,
  Users,
  Building,
  CircleAlert,
} from "lucide-react";

import { usePrinterStore } from "../../store/printer.store";
import {
  formatDate,
  formatPages,
  formatPrinterStatus,
  formatInkLevel,
  formatAPITimestamp,
} from "../../utils/format";

export default function PrinterCard({ printerName }) {
  const {
    selectedAgent,
    getPrinterByName,
    pausePrinter,
    resumePrinter,
    fetchAgentPrinters,
    getAgentById,
  } = usePrinterStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [agentInfo, setAgentInfo] = useState(null);

  const printer = getPrinterByName(printerName);
  const agent = selectedAgent;

  useEffect(() => {
    if (agent) {
      setAgentInfo({
        name: agent.name,
        company: agent.company,
        department: agent.department,
        location: agent.location,
        customerId: agent.customerId,
      });
    }
  }, [agent]);

  if (!printer) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Alert variant="warning">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Printer Not Found</AlertTitle>
            <AlertDescription>
              Printer &quot;{printerName}&quot; is not available
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const handlePause = async () => {
    if (!agent) {
      setError("No agent selected");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await pausePrinter(agent.agentId, printerName);
      await fetchAgentPrinters(agent.agentId);
    } catch (err) {
      setError(err.message || "Failed to pause printer");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResume = async () => {
    if (!agent) {
      setError("No agent selected");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await resumePrinter(agent.agentId, printerName);
      await fetchAgentPrinters(agent.agentId);
    } catch (err) {
      setError(err.message || "Failed to resume printer");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusInfo = formatPrinterStatus(printer.status);

  // Format ink levels untuk display
  const renderInkLevels = () => {
    if (!printer.inkLevels || Object.keys(printer.inkLevels).length === 0) {
      return (
        <Alert variant="default">
          <Info className="h-4 w-4" />
          <AlertTitle>No Ink Data</AlertTitle>
          <AlertDescription>
            Ink level monitoring not available for this printer
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(printer.inkLevels).map(([color, level]) => {
          const inkInfo = formatInkLevel(level);
          const colorHex =
            {
              black: "#000000",
              cyan: "#00FFFF",
              magenta: "#FF00FF",
              yellow: "#FFFF00",
              photoBlack: "#333333",
              gray: "#808080",
            }[color] || "#666666";

          const colorName = color.charAt(0).toUpperCase() + color.slice(1);

          return (
            <Card key={color} className="h-full">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: colorHex }}
                  >
                    <span className="text-white text-xs font-bold">
                      {colorName.charAt(0)}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-2">
                      <p className="font-medium text-sm truncate">
                        {colorName}
                      </p>
                      <p
                        className={`font-bold ${inkInfo.color.includes("red") ? "text-red-600" : inkInfo.color.includes("orange") ? "text-amber-600" : "text-green-600"}`}
                      >
                        {level}%
                      </p>
                    </div>
                    <Progress
                      value={level}
                      className={`h-2 ${level < 10 ? "bg-red-500" : level < 20 ? "bg-amber-500" : "bg-green-500"}`}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  const getStatusBadgeVariant = (status) => {
    const statusLower = status?.toLowerCase();
    if (statusLower === "ready" || statusLower === "online") return "default";
    if (statusLower === "error" || statusLower === "critical")
      return "destructive";
    if (statusLower === "warning" || statusLower === "offline")
      return "secondary";
    if (statusLower === "paused") return "outline";
    return "secondary";
  };

  return (
    <div className="space-y-6">
      {/* Printer Header Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-100 rounded-lg dark:bg-blue-900/20">
                <Printer className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <CardTitle className="text-xl">
                  {printer.displayName || printer.name}
                </CardTitle>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <Badge variant={getStatusBadgeVariant(printer.status)}>
                    {getStatusInfo.text}
                  </Badge>
                  {printer.isNetworkPrinter && (
                    <Badge variant="outline" className="gap-1">
                      <Wifi className="h-3 w-3" />
                      Network
                    </Badge>
                  )}
                  {printer.vendor && (
                    <Badge variant="secondary" className="gap-1">
                      <Settings className="h-3 w-3" />
                      {printer.vendor}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <TooltipProvider>
                {printer.status?.toLowerCase() === "paused" ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="default"
                        onClick={handleResume}
                        disabled={isLoading || !agent || printer.status === "offline"}
                        className="gap-2"
                      >
                        {isLoading ? (
                          <>
                            <Play className="h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4" />
                            Resume Printer
                          </>
                        )}
                      </Button>

                    </TooltipTrigger>
                    <TooltipContent>Resume Printer</TooltipContent>
                  </Tooltip>
                ) : (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        onClick={handlePause}
                        disabled={
                          isLoading ||
                          !agent ||
                          printer.status !== "ready" ||
                          printer.status === "offline"
                        }
                        className="gap-2"
                      >
                        {isLoading ? (
                          <>
                            <Pause className="h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <Pause className="h-4 w-4" />
                            Pause Printer
                          </>
                        )}
                      </Button>

                    </TooltipTrigger>
                    <TooltipContent>Pause Printer</TooltipContent>
                  </Tooltip>
                )}
              </TooltipProvider>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Printer Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card className="h-full">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <BarChart3 className="h-8 w-8 text-blue-600 mb-2" />
                  <div className="text-2xl font-bold">
                    {printer.pagesToday || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Pages Today
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="h-full">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <Calendar className="h-8 w-8 text-purple-600 mb-2" />
                  <div className="text-lg font-semibold">
                    {printer.lastPrintTime
                      ? formatAPITimestamp(printer.lastPrintTime)
                      : "Never"}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Last Print
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="h-full">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <Wifi className="h-8 w-8 text-green-600 mb-2" />
                  <div className="text-lg font-semibold truncate w-full">
                    {printer.ipAddress || "N/A"}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    IP Address
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Agent Information */}
          {agentInfo && (
            <>
              <Separator className="my-6" />
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Monitor className="h-5 w-5" />
                  Agent Information
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">
                      Agent Name
                    </div>
                    <div className="flex items-center gap-2 font-medium">
                      <div
                        className={`w-2 h-2 rounded-full ${agent.status === "online" ? "bg-green-500" : "bg-red-500"}`}
                      />
                      {agentInfo.name}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">Company</div>
                    <div className="flex items-center gap-2 font-medium">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      {agentInfo.company}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">
                      Department
                    </div>
                    <div className="font-medium">
                      {agentInfo.department || "N/A"}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">
                      Location
                    </div>
                    <div className="flex items-center gap-2 font-medium">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      {agentInfo.location}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {error && (
            <Alert variant="destructive" className="mt-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Action Failed</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Ink Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Printer className="h-5 w-5" />
            Ink/Toner Levels
          </CardTitle>
        </CardHeader>
        <CardContent>{renderInkLevels()}</CardContent>
      </Card>

      {/* Printer Details Card */}
      <Card>
        <CardHeader>
          <CardTitle>Printer Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Printer Name</div>
              <div className="font-medium">{printer.name}</div>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Display Name</div>
              <div className="font-medium">{printer.displayName || "N/A"}</div>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Vendor</div>
              <div className="font-medium">{printer.vendor || "Unknown"}</div>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Status</div>
              <Badge variant={getStatusBadgeVariant(printer.status)}>
                {getStatusInfo.text}
              </Badge>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">
                Connection Type
              </div>
              <div className="font-medium">
                {printer.isNetworkPrinter ? "Network" : "Local"}
              </div>
            </div>
            {printer.ipAddress && (
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">IP Address</div>
                <div className="font-medium">{printer.ipAddress}</div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Alerts Section */}
      <div className="space-y-3">
        {printer.hasCriticalInk && (
          <Alert variant="destructive">
            <CircleAlert className="h-4 w-4" />
            <AlertTitle>Critical Ink Level</AlertTitle>
            <AlertDescription>
              One or more ink cartridges are critically low
            </AlertDescription>
          </Alert>
        )}

        {printer.hasLowInk && !printer.hasCriticalInk && (
          <Alert variant="warning">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Low Ink Warning</AlertTitle>
            <AlertDescription>
              One or more ink cartridges are running low
            </AlertDescription>
          </Alert>
        )}

        {printer.status === "error" && (
          <Alert variant="destructive">
            <CircleAlert className="h-4 w-4" />
            <AlertTitle>Printer Error</AlertTitle>
            <AlertDescription>
              Printer is in error state. Please check the physical printer.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}
