"use client";

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Printer,
  Pause,
  Play,
  Wifi,
  WifiOff,
  HardDrive,
  Calendar,
  FileText,
  Building2,
  MapPin,
  Server,
  AlertCircle,
  Palette,
  ScanLine,
} from "lucide-react";

export default function PrinterCard({ printer, agent, onPause, onResume }) {
  const [loading, setLoading] = useState(false);

  if (!printer) {
    return (
      <Card className="border border-gray-200">
        <CardContent className="p-6 text-center">
          <div className="flex flex-col items-center gap-2">
            <Printer className="h-8 w-8 text-gray-300" />
            <p className="text-sm text-gray-500">Printer not found</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  const detail = printer.printer_status_detail || printer.printerStatusDetail;
  const isOnline = printer.status === "READY" || printer.status === "ready" || printer.status === "online";
  const isPaused = printer.status === "paused" || printer.status === "PAUSED";

  // Helper: support both camelCase (agent API) and snake_case (all printers API)
  const colorPagesToday = printer.colorPagesToday ?? printer.color_pages_today ?? 0;
  const bwPagesToday = printer.bwPagesToday ?? printer.bw_pages_today ?? 0;
  const colorPagesTotal = printer.colorPagesTotal ?? printer.color_pages_total ?? 0;
  const bwPagesTotal = printer.bwPagesTotal ?? printer.bw_pages_total ?? 0;
  const pagesToday = printer.pagesToday ?? printer.pages_today ?? 0;
  const totalPages = printer.totalPages ?? printer.total_pages ?? 0;

  // Color vs BW ratio for today
  const totalPrintedToday = colorPagesToday + bwPagesToday;
  const colorRatio = totalPrintedToday > 0 ? Math.round((colorPagesToday / totalPrintedToday) * 100) : 0;
  const bwRatio = totalPrintedToday > 0 ? 100 - colorRatio : 0;

  const detailLabelMap = {
    'out_of_paper': 'Out of Paper',
    'paper_jam': 'Paper Jam',
    'door_open': 'Door Open',
    'user_intervention': 'User Intervention',
  };

  const getStatusLabel = () => {
    if (detail && detailLabelMap[detail]) return detailLabelMap[detail];
    if (isPaused) return 'Paused';
    if (isOnline) return 'Online';
    return 'Offline';
  };

  const getStatusVariant = () => {
    if (detail && detailLabelMap[detail]) return 'destructive';
    if (isPaused) return 'secondary';
    if (isOnline) return 'default';
    return 'secondary';
  };

  const handlePause = async () => {
    setLoading(true);
    try {
      await onPause(printer.name);
    } finally {
      setLoading(false);
    }
  };

  const handleResume = async () => {
    setLoading(true);
    try {
      await onResume(printer.name);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Main Printer Card */}
      <Card className="border border-gray-200">
        <CardHeader className="border-b border-gray-100 pb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                <Printer className="h-4 w-4 text-gray-600" />
              </div>
              <div>
                <CardTitle className="text-base font-medium">
                  {printer.displayName || printer.display_name || printer.name}
                </CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={getStatusVariant()} className="text-[10px] h-5 px-2">
                    {getStatusLabel()}
                  </Badge>
                  {(printer.isNetwork || printer.is_network) && (
                    <Badge variant="outline" className="text-[10px] h-5 px-2 gap-1">
                      <Wifi className="h-2.5 w-2.5" />
                      Network
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-1">
              {isPaused ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs gap-1.5"
                  onClick={handleResume}
                  disabled={loading}
                >
                  <Play className="h-3 w-3" />
                  Resume
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs gap-1.5"
                  onClick={handlePause}
                  disabled={loading || !isOnline}
                >
                  <Pause className="h-3 w-3" />
                  Pause
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-4">
          {/* Stats Grid - Top Row */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div className="flex justify-center mb-1">
                <FileText className="h-4 w-4 text-gray-400" />
              </div>
              <div className="text-lg font-semibold text-gray-900">
                {pagesToday}
              </div>
              <div className="text-xs text-gray-500">Pages Today</div>
            </div>

            <div className="text-center">
              <div className="flex justify-center mb-1">
                <Calendar className="h-4 w-4 text-gray-400" />
              </div>
              <div className="text-xs font-medium text-gray-700 mt-1">
                {(printer.lastPrintTime || printer.last_print_time)
                  ? new Date(printer.lastPrintTime || printer.last_print_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : "Never"}
              </div>
              <div className="text-xs text-gray-500">Last Print</div>
            </div>

            <div className="text-center">
              <div className="flex justify-center mb-1">
                {isOnline ? (
                  <Wifi className="h-4 w-4 text-gray-400" />
                ) : (
                  <WifiOff className="h-4 w-4 text-gray-400" />
                )}
              </div>
              <div className="text-xs font-medium text-gray-700 truncate">
                {printer.ipAddress || printer.ip_address || "N/A"}
              </div>
              <div className="text-xs text-gray-500">IP Address</div>
            </div>
          </div>

          {/* Color vs BW Breakdown */}
          {totalPrintedToday > 0 && (
            <>
              <Separator className="my-3" />
              <div className="space-y-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-gray-500">Today's Print Breakdown</span>
                  <span className="text-xs text-gray-400">{totalPrintedToday} pages</span>
                </div>

                {/* Stacked bar */}
                <div className="h-2 w-full rounded-full overflow-hidden bg-gray-100 flex">
                  <div
                    style={{ width: `${colorRatio}%`, backgroundColor: "#6366f1", transition: "width 0.4s ease" }}
                    className="h-full"
                  />
                  <div
                    style={{ width: `${bwRatio}%`, backgroundColor: "#d1d5db", transition: "width 0.4s ease" }}
                    className="h-full"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div className="flex items-center gap-2 bg-indigo-50 rounded-md px-2 py-1.5">
                    <Palette className="h-3 w-3 text-indigo-500 flex-shrink-0" />
                    <div>
                      <div className="text-xs font-semibold text-indigo-700">{colorPagesToday}</div>
                      <div className="text-[10px] text-indigo-400">Color ({colorRatio}%)</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-gray-50 rounded-md px-2 py-1.5">
                    <ScanLine className="h-3 w-3 text-gray-500 flex-shrink-0" />
                    <div>
                      <div className="text-xs font-semibold text-gray-700">{bwPagesToday}</div>
                      <div className="text-[10px] text-gray-400">B&W ({bwRatio}%)</div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Lifetime totals (if data available) */}
          {(colorPagesTotal > 0 || bwPagesTotal > 0) && (
            <>
              <Separator className="my-3" />
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="text-xs font-semibold text-gray-700">{totalPages.toLocaleString()}</div>
                  <div className="text-[10px] text-gray-400">Total Lifetime</div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-indigo-600">{colorPagesTotal.toLocaleString()}</div>
                  <div className="text-[10px] text-gray-400">Color Total</div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-gray-600">{bwPagesTotal.toLocaleString()}</div>
                  <div className="text-[10px] text-gray-400">B&W Total</div>
                </div>
              </div>
            </>
          )}

          <Separator className="my-3" />

          {/* Agent Info */}
          {agent && (
            <div className="space-y-2 pt-1">
              <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Agent Information
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-1.5">
                  <Server className="h-3 w-3 text-gray-400" />
                  <span className="text-gray-700">{agent.name}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Building2 className="h-3 w-3 text-gray-400" />
                  <span className="text-gray-700">{agent.company}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-3 w-3 text-gray-400" />
                  <span className="text-gray-700">{agent.department}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className={`h-2 w-2 rounded-full ${agent.isOnline ? 'bg-gray-900' : 'bg-gray-300'}`} />
                  <span className="text-gray-500">{agent.isOnline ? 'Connected' : 'Disconnected'}</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ink Levels Card */}
      {(printer.inkLevels || printer.ink_levels) &&
        Object.keys(printer.inkLevels || (typeof printer.ink_levels === 'string' ? JSON.parse(printer.ink_levels) : printer.ink_levels) || {}).length > 0 && (
          <Card className="border border-gray-200">
            <CardHeader className="border-b border-gray-100 pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <HardDrive className="h-4 w-4 text-gray-500" />
                Ink & Toner Levels
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(
                  printer.inkLevels ||
                  (typeof printer.ink_levels === 'string' ? JSON.parse(printer.ink_levels) : printer.ink_levels) ||
                  {}
                ).map(([color, level]) => {
                  const colorName = color.charAt(0).toUpperCase() + color.slice(1);
                  const isLow = level < 20;
                  const inkColorHex = {
                    black: "#1a1a1a",
                    cyan: "#06b6d4",
                    magenta: "#ec4899",
                    yellow: "#eab308",
                    photoBlack: "#4b5563",
                    gray: "#9ca3af",
                  }[color] || "#6b7280";
                  const barColor = isLow ? "#ef4444" : inkColorHex;

                  return (
                    <div key={color} className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="inline-block h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: inkColorHex }} />
                          <span className="text-gray-600">{colorName}</span>
                        </div>
                        <span style={{ color: isLow ? "#ef4444" : "#374151" }} className="font-medium">
                          {level}%
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                        <div style={{ width: `${level}%`, backgroundColor: barColor, height: "100%", borderRadius: "9999px", transition: "width 0.3s ease" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

      {/* Alerts */}
      {(printer.hasCriticalInk || printer.hasLowInk || printer.status === "error") && (
        <Card className="border border-gray-200 bg-gray-50">
          <CardContent className="p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-gray-500 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-gray-700">Printer Alert</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {printer.hasCriticalInk && "Critical ink level - replace cartridge soon"}
                  {printer.hasLowInk && !printer.hasCriticalInk && "Low ink level - prepare replacement"}
                  {printer.status === "error" && !printer.hasLowInk && !printer.hasCriticalInk &&
                    "Printer error - please check the device"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}