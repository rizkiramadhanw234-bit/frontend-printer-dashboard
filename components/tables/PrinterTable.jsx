"use client";

import React, { useState, useMemo, useEffect } from "react";
import { usePrinterStore } from "@/store/printer.store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreVertical,
  Eye,
  PauseCircle,
  PlayCircle,
  Droplets,
  Wifi,
  WifiOff,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Printer,
  AlertCircle,
  Palette,
  ScanLine,
} from "lucide-react";

export default function PrinterTable({ onPrinterSelect, selectedPrinterId }) {
  const {
    allPrinters,
    fetchAllPrinters,
    isLoading,
    pausePrinter,
    resumePrinter,
  } = usePrinterStore();

  useEffect(() => {
    fetchAllPrinters();
  }, [fetchAllPrinters]);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [inkFilter, setInkFilter] = useState("all");
  const [vendorFilter, setVendorFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Helper: support camelCase & snake_case
  const getField = (printer, camel, snake) =>
    printer[camel] ?? printer[snake] ?? 0;

  const parseInkLevels = (inkLevels) => {
    if (!inkLevels) return {};
    try { return typeof inkLevels === "string" ? JSON.parse(inkLevels) : inkLevels; }
    catch { return {}; }
  };

  const getInkStatus = (printer) => {
    if (printer.printer_status_detail === "no_ink") return "critical";
    if (printer.printer_status_detail === "low_ink") return "low";
    if (printer.lowInkColors?.length > 0) {
      const inkLevels = parseInkLevels(printer.ink_levels);
      return printer.lowInkColors.some((c) => inkLevels[c] === 0) ? "critical" : "low";
    }
    const vals = Object.values(parseInkLevels(printer.ink_levels)).filter((v) => v != null);
    if (vals.some((v) => v === 0 || (v > 0 && v < 15))) return "critical";
    if (vals.some((v) => v >= 15 && v < 30)) return "low";
    if (vals.length > 0) return "normal";
    return "unknown";
  };

  const getDetailedStatus = (printer) => {
    if (printer.printer_status_detail && printer.printer_status_detail !== "unknown")
      return printer.printer_status_detail;
    return printer.status?.toLowerCase() || "unknown";
  };

  const vendors = useMemo(() => {
    const s = new Set(allPrinters.map((p) => p.vendor).filter(Boolean));
    return ["all", ...Array.from(s)];
  }, [allPrinters]);

  const filteredPrinters = useMemo(() => {
    return allPrinters.filter((printer) => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        !searchTerm ||
        printer.name?.toLowerCase().includes(searchLower) ||
        printer.display_name?.toLowerCase().includes(searchLower) ||
        printer.vendor?.toLowerCase().includes(searchLower) ||
        printer.ip_address?.includes(searchTerm) ||
        printer.agent_id?.toLowerCase().includes(searchLower);

      const detailedStatus = getDetailedStatus(printer);
      const printerStatus = printer.status?.toUpperCase();
      let matchesStatus = true;
      if (statusFilter !== "all") {
        if (statusFilter === "online") matchesStatus = ["READY", "ONLINE", "PRINTING"].includes(printerStatus);
        else if (statusFilter === "offline") matchesStatus = printerStatus === "OFFLINE" || detailedStatus === "offline";
        else if (statusFilter === "error") matchesStatus = ["OTHER", "ERROR"].includes(printerStatus) || detailedStatus === "error_other";
        else if (statusFilter === "paused") matchesStatus = printerStatus === "PAUSED" || detailedStatus === "paused";
        else matchesStatus = detailedStatus === statusFilter;
      }

      const inkStatus = getInkStatus(printer);
      const matchesInk = inkFilter === "all" || inkStatus === inkFilter;
      const matchesVendor = vendorFilter === "all" || printer.vendor === vendorFilter;

      return matchesSearch && matchesStatus && matchesInk && matchesVendor;
    });
  }, [allPrinters, searchTerm, statusFilter, inkFilter, vendorFilter]);

  const totalPages = Math.ceil(filteredPrinters.length / itemsPerPage);
  const paginatedPrinters = filteredPrinters.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const stats = useMemo(() => ({
    online: allPrinters.filter((p) => ["READY", "ONLINE", "PRINTING"].includes(p.status)).length,
    offline: allPrinters.filter((p) => p.status === "OFFLINE").length,
    error: allPrinters.filter((p) => ["OTHER", "ERROR"].includes(p.status)).length,
    lowInk: allPrinters.filter((p) => getInkStatus(p) === "low").length,
    criticalInk: allPrinters.filter((p) => getInkStatus(p) === "critical").length,
    colorToday: allPrinters.reduce((s, p) => s + getField(p, "colorPagesToday", "color_pages_today"), 0),
    bwToday: allPrinters.reduce((s, p) => s + getField(p, "bwPagesToday", "bw_pages_today"), 0),
  }), [allPrinters]);

  const getStatusIcon = (printer) => {
    const inkStatus = getInkStatus(printer);
    const detailedStatus = getDetailedStatus(printer);
    if (inkStatus === "critical" || detailedStatus === "no_ink")
      return <Droplets className="h-4 w-4 text-red-500" />;
    if (inkStatus === "low" || detailedStatus === "low_ink")
      return <Droplets className="h-4 w-4 text-yellow-500" />;
    if (["paper_jam", "out_of_paper", "door_open"].includes(detailedStatus))
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    const s = printer.status?.toUpperCase();
    if (["READY", "ONLINE", "PRINTING"].includes(s)) return <Wifi className="h-4 w-4 text-green-500" />;
    if (s === "PAUSED" || detailedStatus === "paused") return <PauseCircle className="h-4 w-4 text-yellow-500" />;
    if (["OTHER", "ERROR"].includes(s) || detailedStatus === "error_other")
      return <AlertCircle className="h-4 w-4 text-orange-500" />;
    return <WifiOff className="h-4 w-4 text-gray-400" />;
  };

  const getLowInkIndicator = (printer) => {
    if (!printer.lowInkColors?.length) return null;
    const inkLevels = parseInkLevels(printer.ink_levels);
    const critical = printer.lowInkColors.filter((c) => inkLevels[c] === 0);
    const low = printer.lowInkColors.filter((c) => inkLevels[c] !== 0);
    return (
      <div className="flex flex-wrap gap-1 mt-1">
        {critical.map((c) => <Badge key={c} variant="destructive" className="text-xs">{c} empty</Badge>)}
        {low.map((c) => <Badge key={c} variant="warning" className="text-xs bg-yellow-100 text-yellow-800">{c} low</Badge>)}
      </div>
    );
  };

  const formatLastSeen = (lastSeen) => {
    if (!lastSeen) return "Never";
    const diff = Math.floor((Date.now() - new Date(lastSeen)) / 60000);
    if (diff < 1) return "Just now";
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return `${Math.floor(diff / 1440)}d ago`;
  };

  useEffect(() => setCurrentPage(1), [searchTerm, statusFilter, inkFilter, vendorFilter]);

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="rounded-lg border p-3">
          <div className="text-xs text-gray-500">Total</div>
          <div className="text-xl font-bold">{allPrinters.length}</div>
        </div>
        <div className="rounded-lg border p-3">
          <div className="text-xs text-gray-500">Online</div>
          <div className="text-xl font-bold text-green-600">{stats.online}</div>
        </div>
        <div className="rounded-lg border p-3">
          <div className="text-xs text-gray-500">Offline/Err</div>
          <div className="text-xl font-bold text-orange-600">{stats.offline + stats.error}</div>
        </div>
        <div className="rounded-lg border p-3">
          <div className="text-xs text-gray-500">Low Ink</div>
          <div className="text-xl font-bold text-yellow-600">{stats.lowInk}</div>
        </div>
        <div className="rounded-lg border p-3">
          <div className="text-xs text-gray-500">Critical Ink</div>
          <div className="text-xl font-bold text-red-600">{stats.criticalInk}</div>
        </div>
        {/* Color/BW today totals */}
        <div className="rounded-lg border p-3 bg-indigo-50">
          <div className="flex items-center gap-1 text-xs text-indigo-500 mb-0.5">
            <Palette className="h-3 w-3" /> Color Today
          </div>
          <div className="text-xl font-bold text-indigo-700">{stats.colorToday.toLocaleString()}</div>
        </div>
        <div className="rounded-lg border p-3 bg-gray-50">
          <div className="flex items-center gap-1 text-xs text-gray-500 mb-0.5">
            <ScanLine className="h-3 w-3" /> B&W Today
          </div>
          <div className="text-xl font-bold text-gray-700">{stats.bwToday.toLocaleString()}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search printers by name, vendor, agent ID, or IP..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Status: {statusFilter === "all" ? "All" : statusFilter}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {["all", "online", "offline", "printing", "paused", "paper_jam", "out_of_paper", "door_open", "error"].map((s) => (
              <DropdownMenuItem key={s} onClick={() => setStatusFilter(s)}>
                {s === "all" ? "All Status" : s.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Droplets className="h-4 w-4" />
              Ink: {inkFilter === "all" ? "All" : inkFilter}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {["all", "normal", "low", "critical"].map((s) => (
              <DropdownMenuItem key={s} onClick={() => setInkFilter(s)}>
                {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1) + " Ink"}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Printer className="h-4 w-4" />
              Vendor: {vendorFilter === "all" ? "All" : vendorFilter}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {vendors.map((v) => (
              <DropdownMenuItem key={v} onClick={() => setVendorFilter(v)}>
                {v === "all" ? "All Vendors" : v}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Printer</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vendor</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">IP</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Agent</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Total Today</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-indigo-500 uppercase">
                  <div className="flex items-center justify-center gap-1">
                    <Palette className="h-3 w-3" /> Color
                  </div>
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  <div className="flex items-center justify-center gap-1">
                    <ScanLine className="h-3 w-3" /> B&W
                  </div>
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Total Pages</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Updated</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {paginatedPrinters.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-12 text-center text-gray-500">
                    <Printer className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium text-gray-900 mb-1">No printers found</p>
                    <p className="text-sm">
                      {searchTerm || statusFilter !== "all" || inkFilter !== "all" || vendorFilter !== "all"
                        ? "Try adjusting your filters"
                        : "No printers registered in the system"}
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedPrinters.map((printer) => {
                  const cpToday = getField(printer, "colorPagesToday", "color_pages_today");
                  const bwToday = getField(printer, "bwPagesToday", "bw_pages_today");
                  const pToday = printer.pages_today || 0;

                  return (
                    <tr
                      key={printer.id}
                      className={`hover:bg-gray-50 cursor-pointer ${selectedPrinterId === printer.id ? "bg-blue-50" : ""}`}
                      onClick={() => onPrinterSelect?.(printer)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center">{getStatusIcon(printer)}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <div className="font-medium text-gray-900">{printer.display_name || printer.name}</div>
                          {getLowInkIndicator(printer)}
                          <div className="text-xs text-gray-400">ID: {printer.id}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {printer.vendor ? <Badge variant="outline">{printer.vendor}</Badge> : "-"}
                      </td>
                      <td className="px-4 py-3 text-sm font-mono text-gray-600">{printer.ip_address || "-"}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        <div className="truncate max-w-[120px]" title={printer.agent_id}>
                          {printer.agent_id?.substring(0, 12)}...
                        </div>
                      </td>

                      {/* Total today */}
                      <td className="px-4 py-3 text-center">
                        <Badge variant="outline" className="text-xs">{pToday}</Badge>
                      </td>

                      {/* Color today */}
                      <td className="px-4 py-3 text-center">
                        {cpToday > 0 ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                            <Palette className="h-3 w-3" />{cpToday}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </td>

                      {/* BW today */}
                      <td className="px-4 py-3 text-center">
                        {bwToday > 0 ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">
                            <ScanLine className="h-3 w-3" />{bwToday}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </td>

                      {/* Total lifetime */}
                      <td className="px-4 py-3 text-center text-sm text-gray-600">
                        {(printer.total_pages || 0).toLocaleString()}
                      </td>

                      <td className="px-4 py-3 text-sm text-gray-600">{formatLastSeen(printer.updated_at)}</td>

                      <td className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onPrinterSelect?.(printer); }}>
                              <Eye className="h-4 w-4 mr-2" /> View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-yellow-600"
                              onClick={async (e) => {
                                e.stopPropagation();
                                try { await pausePrinter(printer.agent_id, printer.name); await fetchAllPrinters(); }
                                catch (err) { console.error("Pause failed:", err); }
                              }}
                            >
                              <PauseCircle className="h-4 w-4 mr-2" /> Pause Printer
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-green-600"
                              onClick={async (e) => {
                                e.stopPropagation();
                                try { await resumePrinter(printer.agent_id, printer.name); await fetchAllPrinters(); }
                                catch (err) { console.error("Resume failed:", err); }
                              }}
                            >
                              <PlayCircle className="h-4 w-4 mr-2" /> Resume Printer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {filteredPrinters.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Showing {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, filteredPrinters.length)} of {filteredPrinters.length}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="px-4 py-2 text-sm">Page {currentPage} of {totalPages || 1}</span>
            <Button variant="outline" size="sm" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}