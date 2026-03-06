"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useAlertStore } from "@/store/alert.store";
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
  AlertCircle,
  CheckCircle,
  Clock,
  Droplets,
  WifiOff,
  Printer,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Eye,
  CheckCheck,
  XCircle,
  RefreshCw,
  Bell,
  BellOff,
  Settings,
  DoorOpen,
  FileText,
  HardDrive
} from "lucide-react";

export default function AlertCard({ onAlertSelect, selectedAlertId }) {
  const {
    alerts,
    alertHistory,
    unreadCount,
    markAsRead,
    markAllAsRead,
    resolveAlert,
    resolveAllAlerts,
    getAlertStats
  } = useAlertStore();

  const { allPrinters, fetchAllPrinters } = usePrinterStore();

  // Local state
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showSettings, setShowSettings] = useState(false);

  // Fetch printers data if needed
  useEffect(() => {
    if (allPrinters.length === 0) {
      fetchAllPrinters();
    }
  }, [allPrinters.length, fetchAllPrinters]);

  // Get stats
  const stats = useMemo(() => {
    return getAlertStats();
  }, [getAlertStats, alerts]);

  // Combine active alerts and history based on filter
  const displayedAlerts = useMemo(() => {
    let items = [];
    
    if (filterType === "active") {
      items = [...alerts];
    } else if (filterType === "history") {
      items = [...alertHistory];
    } else {
      // Show both, with active first
      items = [...alerts, ...alertHistory];
    }

    // Apply filters
    return items.filter(alert => {
      // Search filter
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = searchTerm === "" ||
        alert.printerName?.toLowerCase().includes(searchLower) ||
        alert.message?.toLowerCase().includes(searchLower) ||
        alert.type?.toLowerCase().includes(searchLower);

      // Severity filter
      let matchesSeverity = true;
      if (severityFilter !== "all") {
        matchesSeverity = alert.severity === severityFilter;
      }

      // Type filter
      let matchesType = true;
      if (typeFilter !== "all") {
        matchesType = alert.type === typeFilter;
      }

      return matchesSearch && matchesSeverity && matchesType;
    });
  }, [alerts, alertHistory, searchTerm, severityFilter, typeFilter, filterType]);

  // Sort: newest first
  const sortedAlerts = useMemo(() => {
    return [...displayedAlerts].sort((a, b) => 
      new Date(b.timestamp) - new Date(a.timestamp)
    );
  }, [displayedAlerts]);

  // Pagination
  const totalPages = Math.ceil(sortedAlerts.length / itemsPerPage);
  const paginatedAlerts = sortedAlerts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, severityFilter, typeFilter, filterType]);

  // 🔥 Helper functions yang diperbaiki
  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-blue-500" />;
    }
  };

  // 🔥 Ikon berdasarkan tipe alert
  const getTypeIcon = (type) => {
    switch (type) {
      case 'offline':
        return <WifiOff className="h-4 w-4 text-gray-600" />;
      case 'no_ink':
      case 'low_ink':
        return <Droplets className="h-4 w-4 text-red-500" />;
      case 'paper_jam':
        return <HardDrive className="h-4 w-4 text-orange-500" />;
      case 'out_of_paper':
        return <FileText className="h-4 w-4 text-yellow-500" />;
      case 'door_open':
        return <DoorOpen className="h-4 w-4 text-blue-500" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  // 🔥 Badge berdasarkan severity
  const getSeverityBadge = (severity) => {
    switch (severity) {
      case 'critical':
        return <Badge variant="destructive" className="text-xs">Critical</Badge>;
      case 'warning':
        return <Badge variant="warning" className="text-xs bg-yellow-100 text-yellow-800">Warning</Badge>;
      default:
        return <Badge variant="secondary" className="text-xs">Info</Badge>;
    }
  };

  // 🔥 Badge berdasarkan tipe alert
  const getTypeBadge = (type) => {
    switch (type) {
      case 'offline':
        return <Badge variant="outline" className="text-xs bg-gray-100">Offline</Badge>;
      case 'no_ink':
        return <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">No Ink</Badge>;
      case 'low_ink':
        return <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">Low Ink</Badge>;
      case 'paper_jam':
        return <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">Paper Jam</Badge>;
      case 'out_of_paper':
        return <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">Out of Paper</Badge>;
      case 'door_open':
        return <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">Door Open</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMinutes = Math.floor((now - date) / (1000 * 60));

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const handleAlertClick = (alert) => {
    if (!alert.read && alert.status === 'active') {
      markAsRead(alert.id);
    }
    onAlertSelect?.(alert);
  };

  const handleResolve = (e, alert) => {
    e.stopPropagation();
    resolveAlert(alert.id);
  };

  // 🔥 Get unique types for filter dropdown - sesuaikan dengan tipe baru
  const alertTypes = useMemo(() => {
    const types = new Set();
    [...alerts, ...alertHistory].forEach(a => {
      if (a.type) types.add(a.type);
    });
    return ['all', ...Array.from(types)];
  }, [alerts, alertHistory]);

  return (
    <div className="space-y-4">
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">Alerts & Notifications</h2>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="rounded-full">
              {unreadCount} unread
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {alerts.length > 0 && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => markAllAsRead()}
                className="gap-2"
              >
                <CheckCheck className="h-4 w-4" />
                Mark all read
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => resolveAllAlerts()}
                className="gap-2"
              >
                <CheckCircle className="h-4 w-4" />
                Resolve all
              </Button>
            </>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSettings(!showSettings)}
            className="gap-2"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Summary Cards - diperbaiki typenya */}
      <div className="grid grid-cols-5 gap-4">
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-blue-600">Total Alerts</div>
            <AlertCircle className="h-4 w-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-blue-700">{stats.total}</div>
        </div>
        
        <div className="bg-red-50 rounded-lg border border-red-200 p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-red-600">Critical</div>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </div>
          <div className="text-2xl font-bold text-red-700">{stats.critical}</div>
        </div>
        
        <div className="bg-yellow-50 rounded-lg border border-yellow-200 p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-yellow-600">Warning</div>
            <AlertCircle className="h-4 w-4 text-yellow-500" />
          </div>
          <div className="text-2xl font-bold text-yellow-700">{stats.warning}</div>
        </div>
        
        <div className="bg-purple-50 rounded-lg border border-purple-200 p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-purple-600">Offline</div>
            <WifiOff className="h-4 w-4 text-purple-500" />
          </div>
          <div className="text-2xl font-bold text-purple-700">{stats.byType?.offline || 0}</div>
        </div>
        
        <div className="bg-orange-50 rounded-lg border border-orange-200 p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-orange-600">Ink Issues</div>
            <Droplets className="h-4 w-4 text-orange-500" />
          </div>
          <div className="text-2xl font-bold text-orange-700">
            {(stats.byType?.no_ink || 0) + (stats.byType?.low_ink || 0)}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search alerts by printer, message, or type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              View: {filterType === 'all' ? 'All' : filterType === 'active' ? 'Active' : 'History'}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setFilterType('all')}>
              All Alerts
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterType('active')}>
              Active Only
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterType('history')}>
              History Only
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <AlertCircle className="h-4 w-4" />
              Severity: {severityFilter === 'all' ? 'All' : severityFilter}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setSeverityFilter('all')}>
              All Severities
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSeverityFilter('critical')}>
              Critical
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSeverityFilter('warning')}>
              Warning
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSeverityFilter('info')}>
              Info
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Printer className="h-4 w-4" />
              Type: {typeFilter === 'all' ? 'All' : typeFilter}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setTypeFilter('all')}>
              All Types
            </DropdownMenuItem>
            {alertTypes.filter(t => t !== 'all').map(type => (
              <DropdownMenuItem key={type} onClick={() => setTypeFilter(type)}>
                {type.replace(/_/g, ' ').toUpperCase()}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Alerts Table/Cards */}
      <div className="bg-white rounded-lg border overflow-hidden">
        {paginatedAlerts.length === 0 ? (
          <div className="px-4 py-12 text-center text-gray-500">
            <BellOff className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium text-gray-900 mb-1">No alerts found</p>
            <p className="text-sm">
              {searchTerm || severityFilter !== 'all' || typeFilter !== 'all' || filterType !== 'all'
                ? 'Try adjusting your filters'
                : 'All systems are running smoothly!'}
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {paginatedAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`
                  p-4 hover:bg-gray-50 cursor-pointer transition-colors
                  ${selectedAlertId === alert.id ? 'bg-blue-50' : ''}
                  ${!alert.read && alert.status === 'active' ? 'bg-blue-50/50' : ''}
                `}
                onClick={() => handleAlertClick(alert)}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={`
                    p-2 rounded-lg
                    ${alert.severity === 'critical' ? 'bg-red-100' : ''}
                    ${alert.severity === 'warning' ? 'bg-yellow-100' : ''}
                    ${alert.severity === 'info' ? 'bg-blue-100' : ''}
                  `}>
                    {getTypeIcon(alert.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-medium text-gray-900">
                        {alert.printerName}
                      </span>
                      {getSeverityBadge(alert.severity)}
                      {getTypeBadge(alert.type)}
                      {!alert.read && alert.status === 'active' && (
                        <Badge variant="default" className="text-xs bg-blue-500">New</Badge>
                      )}
                      {alert.status === 'resolved' && (
                        <Badge variant="outline" className="text-xs bg-green-50 text-green-700">Resolved</Badge>
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-2">
                      {alert.message}
                    </p>
                    
                    <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTimestamp(alert.timestamp)}
                      </span>
                      {alert.details?.offlineMinutes && (
                        <span>Duration: {alert.details.offlineMinutes}m</span>
                      )}
                      {alert.details?.level && (
                        <span>Level: {alert.details.level}%</span>
                      )}
                      {alert.details?.color && (
                        <span>Color: {alert.details.color}</span>
                      )}
                      {alert.details?.colors && alert.details.colors.length > 0 && (
                        <span>Colors: {alert.details.colors.join(', ')}</span>
                      )}
                      <span className="text-gray-400">via {alert.source || 'system'}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    {alert.status === 'active' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-green-600"
                        onClick={(e) => handleResolve(e, alert)}
                        title="Resolve"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          onAlertSelect?.(alert);
                        }}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        {!alert.read && alert.status === 'active' && (
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(alert.id);
                          }}>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Mark as Read
                          </DropdownMenuItem>
                        )}
                        {alert.status === 'active' && (
                          <DropdownMenuItem 
                            className="text-green-600"
                            onClick={(e) => handleResolve(e, alert)}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Resolve Alert
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {sortedAlerts.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, sortedAlerts.length)} of {sortedAlerts.length} alerts
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