"use client";

import React, { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Eye,
  AlertTriangle,
  Printer,
  Wifi,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { usePrinterStore } from "../../store/printer.store";
import { formatPrinterStatus, formatInkLevel } from "../../utils/format";

export default function PrinterTable({ onRowClick }) {
  const [isClient, setIsClient] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [filteredPrinters, setFilteredPrinters] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [connectionFilter, setConnectionFilter] = useState("all");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  const { printers, isLoading } = usePrinterStore();

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    let result = printers || [];

    // Apply search filter
    if (searchText) {
      result = result.filter(
        (printer) =>
          printer.name?.toLowerCase().includes(searchText.toLowerCase()) ||
          printer.displayName?.toLowerCase().includes(searchText.toLowerCase()) ||
          printer.status?.toLowerCase().includes(searchText.toLowerCase()) ||
          printer.vendor?.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      result = result.filter((printer) =>
        printer.status?.toLowerCase() === statusFilter.toLowerCase()
      );
    }

    // Apply connection filter
    if (connectionFilter !== "all") {
      const isNetwork = connectionFilter === "network";
      result = result.filter((printer) =>
        printer.isNetworkPrinter === isNetwork
      );
    }

    // Apply sorting
    if (sortConfig.key) {
      result.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        if (sortConfig.key === 'name') {
          aValue = a.displayName || a.name;
          bValue = b.displayName || b.name;
        }

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    setFilteredPrinters(result);
  }, [printers, searchText, statusFilter, connectionFilter, sortConfig]);

  const handleSearch = (e) => {
    setSearchText(e.target.value);
  };

  const getInkInfo = (printer) => {
    if (!printer.inkLevels || Object.keys(printer.inkLevels).length === 0) {
      return {
        lowest: null,
        hasLow: printer.hasLowInk,
        hasCritical: printer.hasCriticalInk
      };
    }

    const levels = Object.values(printer.inkLevels).filter(
      (level) => typeof level === "number",
    );
    if (levels.length === 0) {
      return {
        lowest: null,
        hasLow: printer.hasLowInk,
        hasCritical: printer.hasCriticalInk
      };
    }

    const lowest = Math.min(...levels);
    const hasLow = printer.hasLowInk || lowest < 20;
    const hasCritical = printer.hasCriticalInk || lowest < 10;

    return { lowest, hasLow, hasCritical };
  };

  const getStatusVariant = (status) => {
    const statusLower = status?.toLowerCase();
    if (statusLower === 'ready' || statusLower === 'online') return 'default';
    if (statusLower === 'error') return 'destructive';
    if (statusLower === 'offline' || statusLower === 'unknown') return 'secondary';
    return 'outline';
  };

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const SortIcon = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) return null;
    return sortConfig.direction === 'asc' ?
      <ChevronUp className="h-3 w-3 ml-1" /> :
      <ChevronDown className="h-3 w-3 ml-1" />;
  };

  if (!isClient) {
    return (
      <div className="p-6 flex justify-center">
        <div className="text-muted-foreground">Loading printers...</div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <Printer className="h-5 w-5" />
            Printer List
          </CardTitle>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search printers..."
                value={searchText}
                onChange={handleSearch}
                className="pl-9 w-full sm:w-50"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-37.5">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="ready">Ready</SelectItem>
                <SelectItem value="error">Error</SelectItem>
                <SelectItem value="offline">Offline</SelectItem>
                <SelectItem value="unknown">Unknown</SelectItem>
              </SelectContent>
            </Select>
            <Select value={connectionFilter} onValueChange={setConnectionFilter}>
              <SelectTrigger className="w-full sm:w-37.5">
                <SelectValue placeholder="Connection" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Connections</SelectItem>
                <SelectItem value="network">Network</SelectItem>
                <SelectItem value="local">Local</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="text-sm text-muted-foreground">
          Showing {filteredPrinters.length} of {printers.length} printers
        </div>
      </CardHeader>

      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead
                  className="cursor-pointer"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center">
                    Printer Name
                    <SortIcon columnKey="name" />
                  </div>
                </TableHead>
                <TableHead>Status</TableHead>
                <TableHead
                  className="cursor-pointer"
                  onClick={() => handleSort('pagesToday')}
                >
                  <div className="flex items-center">
                    Today&apos;s Pages
                    <SortIcon columnKey="pagesToday" />
                  </div>
                </TableHead>
                <TableHead>Ink Level</TableHead>
                <TableHead>Connection</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-8 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : filteredPrinters.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="text-muted-foreground">No printers found</div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredPrinters.map((printer) => {
                  const inkInfo = getInkInfo(printer);
                  const statusInfo = formatPrinterStatus(printer.status);
                  const inkLevelInfo = inkInfo.lowest !== null ? formatInkLevel(inkInfo.lowest) : null;

                  const rowClass = printer.hasCriticalInk ? "bg-red-50 dark:bg-red-950/20" :
                    printer.hasLowInk ? "bg-amber-50 dark:bg-amber-950/20" :
                      printer.status === "offline" || printer.status === "unknown" ?
                        "bg-muted/50" : "";

                  return (
                    <TableRow
                      key={printer.name}
                      className={`cursor-pointer hover:bg-muted/50 ${rowClass}`}
                      onClick={() => onRowClick && onRowClick(printer.name)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Printer className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">
                              {printer.displayName || printer.name}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {printer.name}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(printer.status)}>
                          {statusInfo.text}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-bold text-blue-600">
                          {printer.pagesToday || 0}
                        </span>
                      </TableCell>
                      <TableCell>
                        {inkInfo.lowest === null ? (
                          <div className="flex items-center gap-2">
                            {printer.hasCriticalInk ? (
                              <Badge variant="destructive" className="gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                Critical
                              </Badge>
                            ) : printer.hasLowInk ? (
                              <Badge variant="outline" className="border-amber-200 text-amber-800 bg-amber-50 gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                Low
                              </Badge>
                            ) : (
                              <Badge variant="outline">N/A</Badge>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Progress
                              value={inkInfo.lowest}
                              className={`w-16 h-2 [&>div]:${inkLevelInfo.color.includes("red")
                                ? "bg-red-500"
                                : inkLevelInfo.color.includes("orange")
                                  ? "bg-amber-500"
                                  : "bg-green-500"
                                }`}
                            />

                            <span className={`text-sm font-medium ${inkLevelInfo.color.includes('red') ? 'text-red-600' :
                              inkLevelInfo.color.includes('orange') ? 'text-amber-600' :
                                'text-green-600'
                              }`}>
                              {inkLevelInfo.text}
                            </span>
                            {(printer.hasLowInk || printer.hasCriticalInk) && (
                              <AlertTriangle className={`h-3 w-3 ${printer.hasCriticalInk ? 'text-red-500' : 'text-amber-500'
                                }`} />
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {printer.isNetworkPrinter ? (
                            <>
                              <Wifi className="h-4 w-4 text-green-600" />
                              <span className="text-xs text-muted-foreground">Network</span>
                            </>
                          ) : (
                            <>
                              <Wifi className="h-4 w-4 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">Local</span>
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onRowClick && onRowClick(printer.name);
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              View Details
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
          <div>
            Page 1 of 1
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled>
              Next
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}