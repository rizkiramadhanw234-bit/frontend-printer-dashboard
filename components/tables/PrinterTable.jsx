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
  AlertCircle
} from "lucide-react";

export default function PrinterTable({ onPrinterSelect, selectedPrinterId }) {
  const {
    allPrinters,
    fetchAllPrinters,
    isLoading
  } = usePrinterStore();

  // Fetch data saat komponen mount
  useEffect(() => {
    fetchAllPrinters();
  }, [fetchAllPrinters]);

  // Local state
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [inkFilter, setInkFilter] = useState("all");
  const [vendorFilter, setVendorFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const parseInkLevels = (inkLevels) => {
    if (!inkLevels) return {};
    try {
      return typeof inkLevels === 'string' ? JSON.parse(inkLevels) : inkLevels;
    } catch {
      return {};
    }
  };

  // Cek kondisi ink
  const getInkStatus = (printer) => {
    if (printer.printer_status_detail === 'no_ink') return 'critical';
    if (printer.printer_status_detail === 'low_ink') return 'low';

    if (printer.lowInkColors && printer.lowInkColors.length > 0) {
      const inkLevels = typeof printer.ink_levels === 'string'
        ? JSON.parse(printer.ink_levels)
        : printer.ink_levels || {};
      const hasZero = printer.lowInkColors.some(color => inkLevels[color] === 0);
      if (hasZero) return 'critical';
      return 'low';
    }

    const inkLevels = parseInkLevels(printer.ink_levels);
    const values = Object.values(inkLevels).filter(v => v !== null && v !== undefined);

    if (values.some(v => v === 0)) return 'critical';
    if (values.some(v => v > 0 && v < 15)) return 'critical';
    if (values.some(v => v >= 15 && v < 30)) return 'low';
    if (values.length > 0) return 'normal';

    return 'unknown';
  };

  // Dapatkan status detail dari printer
  const getDetailedStatus = (printer) => {
    // Prioritaskan printerStatusDetail dari backend
    if (printer.printer_status_detail && printer.printer_status_detail !== 'unknown') {
      return printer.printer_status_detail;
    }
    // Fallback ke status lama
    return printer.status?.toLowerCase() || 'unknown';
  };

  // Dapatkan daftar vendor unik untuk filter
  const vendors = useMemo(() => {
    const vendorSet = new Set(allPrinters.map(p => p.vendor).filter(Boolean));
    return ['all', ...Array.from(vendorSet)];
  }, [allPrinters]);

  // Filter printers
  const filteredPrinters = useMemo(() => {
    return allPrinters.filter(printer => {
      // Search filter
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = searchTerm === "" ||
        printer.name?.toLowerCase().includes(searchLower) ||
        printer.display_name?.toLowerCase().includes(searchLower) ||
        printer.vendor?.toLowerCase().includes(searchLower) ||
        printer.ip_address?.includes(searchTerm) ||
        printer.agent_id?.toLowerCase().includes(searchLower);

      // Status filter dengan detail status
      const detailedStatus = getDetailedStatus(printer);
      const printerStatus = printer.status?.toUpperCase();

      let matchesStatus = true;
      if (statusFilter !== "all") {
        if (statusFilter === "online") {
          matchesStatus = printerStatus === 'READY' || printerStatus === 'ONLINE' || printerStatus === 'PRINTING';
        } else if (statusFilter === "offline") {
          matchesStatus = printerStatus === 'OFFLINE' || detailedStatus === 'offline';
        } else if (statusFilter === "error") {
          matchesStatus = printerStatus === 'OTHER' || printerStatus === 'ERROR' || detailedStatus === 'error_other';
        } else if (statusFilter === "paused") {
          matchesStatus = printerStatus === 'PAUSED' || detailedStatus === 'paused';
        } else {
          // Filter berdasarkan detailed status
          matchesStatus = detailedStatus === statusFilter;
        }
      }

      // Ink filter
      const inkStatus = getInkStatus(printer);
      let matchesInk = true;
      if (inkFilter !== "all") {
        matchesInk = inkStatus === inkFilter;
      }

      // Vendor filter
      let matchesVendor = true;
      if (vendorFilter !== "all") {
        matchesVendor = printer.vendor === vendorFilter;
      }

      return matchesSearch && matchesStatus && matchesInk && matchesVendor;
    });
  }, [allPrinters, searchTerm, statusFilter, inkFilter, vendorFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredPrinters.length / itemsPerPage);
  const paginatedPrinters = filteredPrinters.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Stats
  const stats = useMemo(() => {
    const online = allPrinters.filter(p =>
      p.status === 'READY' || p.status === 'ONLINE' || p.status === 'PRINTING'
    ).length;

    const offline = allPrinters.filter(p => p.status === 'OFFLINE').length;
    const error = allPrinters.filter(p => p.status === 'OTHER' || p.status === 'ERROR').length;

    const lowInk = allPrinters.filter(p => getInkStatus(p) === 'low').length;
    const criticalInk = allPrinters.filter(p => getInkStatus(p) === 'critical').length;

    return { online, offline, error, lowInk, criticalInk };
  }, [allPrinters]);

  // Status options untuk dropdown (untuk pengembangan ke depan)
  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'ready', label: 'Ready' },
    { value: 'printing', label: 'Printing' },
    { value: 'offline', label: 'Offline' },
    { value: 'paused', label: 'Paused' },
    { value: 'paper_jam', label: 'Paper Jam' },
    { value: 'out_of_paper', label: 'Out of Paper' },
    { value: 'door_open', label: 'Door Open' },
    { value: 'low_ink', label: 'Low Ink' },
    { value: 'no_ink', label: 'No Ink' },
    { value: 'error', label: 'Error' },
  ];

  const getStatusIcon = (printer) => {
    const inkStatus = getInkStatus(printer);
    const detailedStatus = getDetailedStatus(printer);

    // Prioritaskan icon berdasarkan ink status
    if (inkStatus === 'critical' || detailedStatus === 'no_ink') {
      return <Droplets className="h-4 w-4 text-red-500" />;
    }

    if (inkStatus === 'low' || detailedStatus === 'low_ink') {
      return <Droplets className="h-4 w-4 text-yellow-500" />;
    }

    // Prioritaskan icon berdasarkan detailed status
    if (detailedStatus === 'paper_jam' || detailedStatus === 'out_of_paper' || detailedStatus === 'door_open') {
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    }

    if (inkStatus === 'critical') {
      return <Droplets className="h-4 w-4 text-red-500" />;
    }
    if (inkStatus === 'low') {
      return <Droplets className="h-4 w-4 text-yellow-500" />;
    }

    const status = printer.status?.toUpperCase();
    if (status === 'READY' || status === 'ONLINE' || status === 'PRINTING') {
      return <Wifi className="h-4 w-4 text-green-500" />;
    }
    if (status === 'PAUSED' || detailedStatus === 'paused') {
      return <PauseCircle className="h-4 w-4 text-yellow-500" />;
    }
    if (status === 'OTHER' || status === 'ERROR' || detailedStatus === 'error_other') {
      return <AlertCircle className="h-4 w-4 text-orange-500" />;
    }
    return <WifiOff className="h-4 w-4 text-gray-400" />;
  };

  const getLowInkIndicator = (printer) => {
    // 🔥 GANTI lowInkColors → lowInkColors
    if (!printer.lowInkColors || printer.lowInkColors.length === 0) return null;

    const criticalColors = [];
    const lowColors = [];

    // 🔥 Parse ink_levels karena bisa string JSON
    const inkLevels = typeof printer.ink_levels === 'string'
      ? JSON.parse(printer.ink_levels)
      : printer.ink_levels || {};

    // 🔥 GANTI lowInkColors → lowInkColors
    printer.lowInkColors.forEach(color => {
      const level = inkLevels[color] || 0;
      if (level === 0) {
        criticalColors.push(color);
      } else {
        lowColors.push(color);
      }
    });

    return (
      <div className="flex flex-wrap gap-1 mt-1">
        {criticalColors.map(color => (
          <Badge key={color} variant="destructive" className="text-xs">
            {color} empty
          </Badge>
        ))}
        {lowColors.map(color => (
          <Badge key={color} variant="warning" className="text-xs bg-yellow-100 text-yellow-800">
            {color} low
          </Badge>
        ))}
      </div>
    );
  };

  const formatLastSeen = (lastSeen) => {
    if (!lastSeen) return 'Never';

    const now = new Date();
    const last = new Date(lastSeen);
    const diffMinutes = Math.floor((now - last) / (1000 * 60));

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    return `${Math.floor(diffMinutes / 1440)}d ago`;
  };

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, inkFilter, vendorFilter]);

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-5 gap-4">
        <div className="rounded-lg border p-4">
          <div className="text-sm text-gray-500">Total Printers</div>
          <div className="text-2xl font-bold">{allPrinters.length}</div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-sm text-gray-500">Online</div>
          <div className="text-2xl font-bold text-green-600">{stats.online}</div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-sm text-gray-500">Offline/Error</div>
          <div className="text-2xl font-bold text-orange-600">{stats.offline + stats.error}</div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-sm text-gray-500">Low Ink</div>
          <div className="text-2xl font-bold text-yellow-600">{stats.lowInk}</div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-sm text-gray-500">Critical Ink</div>
          <div className="text-2xl font-bold text-red-600">{stats.criticalInk}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
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
              Status: {statusFilter === 'all' ? 'All' : statusFilter}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setStatusFilter('all')}>
              All Status
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter('online')}>
              Online
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter('offline')}>
              Offline
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter('printing')}>
              Printing
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter('paused')}>
              Paused
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter('paper_jam')}>
              Paper Jam
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter('out_of_paper')}>
              Out of Paper
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter('door_open')}>
              Door Open
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter('error')}>
              Error
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Droplets className="h-4 w-4" />
              Ink: {inkFilter === 'all' ? 'All' : inkFilter}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setInkFilter('all')}>
              All
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setInkFilter('normal')}>
              Normal
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setInkFilter('low')}>
              Low Ink
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setInkFilter('critical')}>
              Critical Ink
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Printer className="h-4 w-4" />
              Vendor: {vendorFilter === 'all' ? 'All' : vendorFilter}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {vendors.map(vendor => (
              <DropdownMenuItem
                key={vendor}
                onClick={() => setVendorFilter(vendor)}
              >
                {vendor === 'all' ? 'All Vendors' : vendor}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Printer Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Printer</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vendor</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">IP Address</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Agent</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pages Today</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Pages</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Update</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {paginatedPrinters.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center text-gray-500">
                  <Printer className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium text-gray-900 mb-1">No printers found</p>
                  <p className="text-sm">
                    {searchTerm || statusFilter !== 'all' || inkFilter !== 'all' || vendorFilter !== 'all'
                      ? 'Try adjusting your filters'
                      : 'No printers registered in the system'}
                  </p>
                </td>
              </tr>
            ) : (
              paginatedPrinters.map((printer) => (
                <tr
                  key={printer.id}
                  className={`hover:bg-gray-50 cursor-pointer ${selectedPrinterId === printer.id ? 'bg-blue-50' : ''
                    }`}
                  onClick={() => onPrinterSelect?.(printer)}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center">
                      {getStatusIcon(printer)}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <div className="font-medium text-gray-900">
                        {printer.display_name || printer.name}
                      </div>
                      {getLowInkIndicator(printer)}
                      <div className="text-xs text-gray-500">
                        ID: {printer.id}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {printer.vendor ? (
                      <Badge variant="outline">{printer.vendor}</Badge>
                    ) : '-'}
                  </td>
                  <td className="px-4 py-3 text-sm font-mono text-gray-600">
                    {printer.ip_address || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    <div className="truncate max-w-[150px]" title={printer.agent_id}>
                      {printer.agent_id?.substring(0, 15)}...
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className="text-xs">
                      {printer.pages_today || 0}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {printer.total_pages || 0}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {formatLastSeen(printer.updated_at)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          onPrinterSelect?.(printer);
                        }}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-yellow-600"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <PauseCircle className="h-4 w-4 mr-2" />
                          Pause Printer
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-green-600"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <PlayCircle className="h-4 w-4 mr-2" />
                          Resume Printer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {filteredPrinters.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredPrinters.length)} of {filteredPrinters.length} printers
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="px-4 py-2 text-sm">
              Page {currentPage} of {totalPages || 1}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}