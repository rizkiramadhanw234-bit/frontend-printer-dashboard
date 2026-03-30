"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Printer,
  Wifi,
  WifiOff,
  Droplets,
  FileText,
  Clock,
  Activity,
  HardDrive,
  Calendar,
  Palette,
  ScanLine,
} from "lucide-react";

export default function PrinterDetailModal({ printer, isOpen, onClose }) {
  if (!printer) return null;

  const parseInkLevels = (inkLevels) => {
    if (!inkLevels) return {};
    try {
      return typeof inkLevels === "string" ? JSON.parse(inkLevels) : inkLevels;
    } catch {
      return {};
    }
  };

  // Support both camelCase (agent API) and snake_case (all-printers API)
  const colorPagesToday = printer.colorPagesToday ?? printer.color_pages_today ?? 0;
  const bwPagesToday = printer.bwPagesToday ?? printer.bw_pages_today ?? 0;
  const colorPagesTotal = printer.colorPagesTotal ?? printer.color_pages_total ?? 0;
  const bwPagesTotal = printer.bwPagesTotal ?? printer.bw_pages_total ?? 0;
  const pagesToday = printer.pagesToday ?? printer.pages_today ?? 0;
  const totalPages = printer.totalPages ?? printer.total_pages ?? 0;

  const totalPrintedToday = colorPagesToday + bwPagesToday;
  const colorRatioToday = totalPrintedToday > 0 ? Math.round((colorPagesToday / totalPrintedToday) * 100) : 0;
  const bwRatioToday = totalPrintedToday > 0 ? 100 - colorRatioToday : 0;

  const totalPrintedLifetime = colorPagesTotal + bwPagesTotal;
  const colorRatioLifetime = totalPrintedLifetime > 0 ? Math.round((colorPagesTotal / totalPrintedLifetime) * 100) : 0;
  const bwRatioLifetime = totalPrintedLifetime > 0 ? 100 - colorRatioLifetime : 0;

  const getPrinterStatus = () => {
    const detail = printer.printer_status_detail || printer.printerStatusDetail;

    const detailLabelMap = {
      'out_of_paper': 'Out of Paper',
      'paper_jam': 'Paper Jam',
      'door_open': 'Door Open',
      'user_intervention': 'User Intervention',
      'low_ink': 'Low Ink',
      'no_ink': 'No Ink',
      'offline': 'Offline',
      'paused': 'Paused',
      'printing': 'Printing',
      'ready': 'Ready',
    };

    // Prioritaskan detail status
    if (detail && detailLabelMap[detail]) {
      const isError = ['out_of_paper', 'paper_jam', 'door_open', 'user_intervention', 'no_ink'].includes(detail);
      return {
        label: detailLabelMap[detail],
        variant: isError ? 'destructive' : 'secondary',
        icon: isError
          ? <WifiOff className="h-4 w-4 text-red-500" />
          : <Wifi className="h-4 w-4 text-yellow-500" />
      };
    }

    const status = (printer.status || printer.printerStatus)?.toUpperCase();
    if (["READY", "ONLINE", "PRINTING"].includes(status))
      return { label: status, variant: "default", icon: <Wifi className="h-4 w-4 text-green-500" /> };
    if (status === "PAUSED")
      return { label: "Paused", variant: "secondary", icon: <Wifi className="h-4 w-4 text-yellow-500" /> };
    if (["OTHER", "ERROR"].includes(status))
      return { label: "Error", variant: "destructive", icon: <WifiOff className="h-4 w-4 text-red-500" /> };
    return { label: status || "Unknown", variant: "secondary", icon: <WifiOff className="h-4 w-4 text-gray-400" /> };
  };

  const getInkStatus = (level) => {
    if (level < 15) return "critical";
    if (level < 30) return "low";
    return "normal";
  };

  const printerStatus = getPrinterStatus();
  const inkLevels = parseInkLevels(printer.ink_levels || printer.inkLevels);
  const hasInkData = Object.keys(inkLevels).length > 0;

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
      return new Date(dateString).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
    } catch {
      return "-";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[580px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Printer className="h-5 w-5" />
            {printer.display_name || printer.displayName || printer.name || "Unknown Printer"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Basic Info Grid */}
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="p-2 bg-gray-50 rounded">
              <div className="text-xs text-gray-500">Agent ID</div>
              <div className="font-mono text-xs truncate" title={printer.agent_id}>{printer.agent_id || "-"}</div>
            </div>
            <div className="p-2 bg-gray-50 rounded">
              <div className="text-xs text-gray-500">Vendor</div>
              <div className="font-medium">{printer.vendor || "-"}</div>
            </div>
            <div className="p-2 bg-gray-50 rounded">
              <div className="text-xs text-gray-500">IP Address</div>
              <div className="font-mono text-xs">{printer.ip_address || printer.ipAddress || "-"}</div>
            </div>
            <div className="p-2 bg-gray-50 rounded">
              <div className="text-xs text-gray-500">Network</div>
              <div>{(printer.is_network || printer.isNetwork) ? "Yes" : "No"}</div>
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-sm text-gray-600">Status</span>
            <div className="flex items-center gap-2">
              {printerStatus.icon}
              <Badge variant={printerStatus.variant}>{printerStatus.label}</Badge>
            </div>
          </div>

          {/* Ink Levels */}
          {hasInkData && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                <Droplets className="h-4 w-4" />
                Ink Levels
              </h4>
              <div className="space-y-2">
                {Object.entries(inkLevels).map(([color, level]) => {
                  const inkStatus = getInkStatus(level);
                  const inkColorHex = {
                    black: "#1a1a1a", cyan: "#06b6d4", magenta: "#ec4899",
                    yellow: "#eab308", photoBlack: "#4b5563", gray: "#9ca3af",
                  }[color] || "#6b7280";
                  const barColor = inkStatus === "critical" ? "#ef4444" : inkStatus === "low" ? "#f59e0b" : inkColorHex;
                  const textColor = inkStatus === "critical" ? "#dc2626" : inkStatus === "low" ? "#d97706" : "#374151";
                  return (
                    <div key={color}>
                      <div className="flex justify-between text-xs mb-1 items-center">
                        <div className="flex items-center gap-1.5">
                          <span className="inline-block h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: inkColorHex }} />
                          <span className="capitalize">{color}</span>
                        </div>
                        <span style={{ color: textColor }} className="font-medium">{level}%</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div style={{ width: `${level}%`, backgroundColor: barColor, height: "100%", borderRadius: "9999px", transition: "width 0.3s ease" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── TODAY'S PRINT BREAKDOWN ── */}
          <div className="rounded-lg border overflow-hidden">
            <div className="px-3 py-2 bg-gray-50 border-b">
              <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Today's Print Breakdown</span>
            </div>
            <div className="p-3 space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <div className="p-2 bg-gray-50 rounded-lg text-center">
                  <FileText className="h-4 w-4 mx-auto mb-1 text-gray-400" />
                  <div className="text-xs text-gray-500">Total</div>
                  <div className="font-bold text-gray-900">{pagesToday}</div>
                </div>
                <div className="p-2 bg-indigo-50 rounded-lg text-center">
                  <Palette className="h-4 w-4 mx-auto mb-1 text-indigo-400" />
                  <div className="text-xs text-indigo-500">Color</div>
                  <div className="font-bold text-indigo-700">{colorPagesToday}</div>
                </div>
                <div className="p-2 bg-gray-50 rounded-lg text-center">
                  <ScanLine className="h-4 w-4 mx-auto mb-1 text-gray-400" />
                  <div className="text-xs text-gray-500">B&W</div>
                  <div className="font-bold text-gray-700">{bwPagesToday}</div>
                </div>
              </div>

              {/* Ratio bar for today */}
              {totalPrintedToday > 0 && (
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-gray-400">
                    <span>Color {colorRatioToday}%</span>
                    <span>B&W {bwRatioToday}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full overflow-hidden bg-gray-100 flex">
                    <div style={{ width: `${colorRatioToday}%`, backgroundColor: "#6366f1" }} className="h-full transition-all duration-300" />
                    <div style={{ width: `${bwRatioToday}%`, backgroundColor: "#d1d5db" }} className="h-full transition-all duration-300" />
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-gray-400">
                    <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-indigo-400" />Color</span>
                    <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-gray-300" />B&W</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── LIFETIME BREAKDOWN ── */}
          <div className="rounded-lg border overflow-hidden">
            <div className="px-3 py-2 bg-gray-50 border-b">
              <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Lifetime Print Breakdown</span>
            </div>
            <div className="p-3 space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <div className="p-2 bg-gray-50 rounded-lg text-center">
                  <HardDrive className="h-4 w-4 mx-auto mb-1 text-gray-400" />
                  <div className="text-xs text-gray-500">Total</div>
                  <div className="font-bold text-gray-900">{totalPages.toLocaleString()}</div>
                </div>
                <div className="p-2 bg-indigo-50 rounded-lg text-center">
                  <Palette className="h-4 w-4 mx-auto mb-1 text-indigo-400" />
                  <div className="text-xs text-indigo-500">Color</div>
                  <div className="font-bold text-indigo-700">{colorPagesTotal.toLocaleString()}</div>
                </div>
                <div className="p-2 bg-gray-50 rounded-lg text-center">
                  <ScanLine className="h-4 w-4 mx-auto mb-1 text-gray-400" />
                  <div className="text-xs text-gray-500">B&W</div>
                  <div className="font-bold text-gray-700">{bwPagesTotal.toLocaleString()}</div>
                </div>
              </div>

              {/* Ratio bar for lifetime */}
              {totalPrintedLifetime > 0 && (
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-gray-400">
                    <span>Color {colorRatioLifetime}%</span>
                    <span>B&W {bwRatioLifetime}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full overflow-hidden bg-gray-100 flex">
                    <div style={{ width: `${colorRatioLifetime}%`, backgroundColor: "#6366f1" }} className="h-full transition-all duration-300" />
                    <div style={{ width: `${bwRatioLifetime}%`, backgroundColor: "#d1d5db" }} className="h-full transition-all duration-300" />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Timestamps */}
          <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>Created: {formatDate(printer.created_at)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Activity className="h-3 w-3" />
              <span>Updated: {formatDate(printer.updated_at)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>Last Print: {formatDate(printer.last_print_time || printer.lastPrintTime)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={onClose}>Close</Button>
            <Button>
              <Activity className="h-4 w-4 mr-2" />
              View History
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}