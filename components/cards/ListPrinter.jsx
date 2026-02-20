"use client";

import React, { useEffect } from "react";
import { usePrinterStore } from "@/store/printer.store";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Printer,
  CheckCircle2,
  AlertCircle,
  XCircle,
  PauseCircle,
  Droplets,
  Wifi,
  WifiOff
} from "lucide-react";

export default function ListPrinter({ onSelectPrinter, selectedPrinter }) {
  const {
    allPrinters,
    fetchAllPrinters,
  } = usePrinterStore();

  useEffect(() => {
    fetchAllPrinters();
  }, [fetchAllPrinters]);

  const offlinePrinters = allPrinters.filter(p =>
    p.status === 'OFFLINE' || p.status === 'offline' || p.status === 'OTHER'
  );

  const lowInkPrinters = allPrinters.filter(p => {
    try {
      const inkLevels = typeof p.ink_levels === 'string'
        ? JSON.parse(p.ink_levels)
        : p.ink_levels || {};

      return Object.values(inkLevels).some(level =>
        level > 0 && level < 30 && level >= 15
      );
    } catch {
      return false;
    }
  });

  const criticalInkPrinters = allPrinters.filter(p => {
    try {
      const inkLevels = typeof p.ink_levels === 'string'
        ? JSON.parse(p.ink_levels)
        : p.ink_levels || {};

      return Object.values(inkLevels).some(level =>
        level > 0 && level < 15
      );
    } catch {
      return false;
    }
  });

  const getStatusIcon = (printer) => {
    const status = printer.status?.toUpperCase();

    if (status === 'READY' || status === 'ONLINE') {
      return <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />;
    } else if (status === 'PAUSED') {
      return <PauseCircle className="h-3.5 w-3.5 text-yellow-500" />;
    } else if (status === 'OFFLINE') {
      return <XCircle className="h-3.5 w-3.5 text-red-500" />;
    } else if (status === 'OTHER' || status === 'ERROR') {
      return <AlertCircle className="h-3.5 w-3.5 text-orange-500" />;
    } else {
      return <Printer className="h-3.5 w-3.5 text-gray-400" />;
    }
  };

  const getStatusBadge = (printer) => {
    // Cek critical ink
    const isCritical = criticalInkPrinters.some(p => p.id === printer.id);
    if (isCritical) {
      return <Badge variant="destructive" className="text-[10px] h-4 px-1">Critical</Badge>;
    }

    // Cek low ink
    const isLow = lowInkPrinters.some(p => p.id === printer.id);
    if (isLow) {
      return <Badge variant="warning" className="text-[10px] h-4 px-1 bg-yellow-100 text-yellow-800">Low Ink</Badge>;
    }

    // Cek status
    const status = printer.status?.toUpperCase();
    if (status === 'PAUSED') {
      return <Badge variant="secondary" className="text-[10px] h-4 px-1">Paused</Badge>;
    } else if (status === 'OTHER') {
      return <Badge variant="outline" className="text-[10px] h-4 px-1">Error</Badge>;
    }

    return null;
  };

  const getConnectionIcon = (printer) => {
    // Cek dari last_update atau status
    const isOnline = printer.status === 'READY' ||
      printer.status === 'ONLINE' ||
      printer.status === 'PRINTING';

    if (isOnline) {
      return <Wifi className="h-3 w-3 text-green-500" />;
    }
    return <WifiOff className="h-3 w-3 text-gray-400" />;
  };

  // Parse ink levels dengan aman
  const parseInkLevels = (inkLevels) => {
    if (!inkLevels) return {};
    try {
      return typeof inkLevels === 'string' ? JSON.parse(inkLevels) : inkLevels;
    } catch {
      return {};
    }
  };

  // Hitung statistik
  const stats = allPrinters.length > 0
    ? {
      total: allPrinters.length,
      online: allPrinters.filter(p => p.status === 'READY' || p.status === 'ONLINE').length,
      offline: offlinePrinters.length,
      error: allPrinters.filter(p => p.status === 'OTHER' || p.status === 'ERROR').length
    }
    : { total: 0, online: 0, offline: 0, error: 0 };

  return (
    <div className="space-y-3">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-2">
        <Card className="bg-gray-50">
          <CardContent className="p-2">
            <div className="text-[10px] text-gray-500">Total</div>
            <div className="text-lg font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card className="bg-green-50">
          <CardContent className="p-2">
            <div className="text-[10px] text-green-600">Online</div>
            <div className="text-lg font-bold text-green-700">{stats.online}</div>
          </CardContent>
        </Card>

        <Card className={`${offlinePrinters.length > 0 ? 'bg-red-50' : 'bg-gray-50'}`}>
          <CardContent className="p-2">
            <div className={`text-[10px] ${offlinePrinters.length > 0 ? 'text-red-600' : 'text-gray-500'}`}>
              Offline/Error
            </div>
            <div className={`text-lg font-bold ${offlinePrinters.length > 0 ? 'text-red-700' : 'text-gray-700'}`}>
              {offlinePrinters.length + stats.error}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ink Status Summary */}
      {(lowInkPrinters.length > 0 || criticalInkPrinters.length > 0) && (
        <div className="bg-amber-50 rounded-lg p-2 border border-amber-200">
          <div className="text-[10px] font-medium text-amber-800 mb-1">⚠️ Perlu Perhatian</div>
          <div className="space-y-1">
            {criticalInkPrinters.length > 0 && (
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1 text-red-600">
                  <Droplets className="h-3 w-3" />
                  <span>Tinta Critical</span>
                </div>
                <Badge variant="destructive" className="text-[10px] h-4">
                  {criticalInkPrinters.length}
                </Badge>
              </div>
            )}
            {lowInkPrinters.length > 0 && (
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1 text-yellow-600">
                  <Droplets className="h-3 w-3" />
                  <span>Tinta Menipis</span>
                </div>
                <Badge variant="warning" className="text-[10px] h-4 bg-yellow-100 text-yellow-800">
                  {lowInkPrinters.length}
                </Badge>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Printer List Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-medium text-gray-500">Daftar Printer</h4>
        <Badge variant="outline" className="text-[10px]">
          {allPrinters.length} printer
        </Badge>
      </div>

      {/* Printer List */}
      <ScrollArea className="h-[calc(100vh-500px)] min-h-[200px]">
        <div className="space-y-2 pr-2">
          {allPrinters.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-xs">
              <Printer className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p>Tidak ada printer</p>
              <p className="text-[10px] mt-1">Belum ada printer terdaftar</p>
            </div>
          ) : (
            allPrinters.map((printer) => (
              <Card
                key={printer.id}
                className={`cursor-pointer hover:bg-gray-50 transition-colors ${selectedPrinter?.id === printer.id ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                  }`}
                onClick={() => onSelectPrinter?.(printer)}
              >
                <CardContent className="p-2">
                  <div className="flex items-start gap-2">
                    <div className="mt-0.5">
                      {getStatusIcon(printer)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-medium truncate">
                          {printer.display_name || printer.name}
                        </p>
                        {getConnectionIcon(printer)}
                      </div>

                      <div className="flex items-center gap-1 mt-1">
                        {getStatusBadge(printer)}

                        {/* Vendor Badge */}
                        {printer.vendor && (
                          <Badge variant="outline" className="text-[10px] h-4 px-1">
                            {printer.vendor}
                          </Badge>
                        )}

                        {/* Pages Today Badge */}
                        {printer.pages_today > 0 && (
                          <Badge variant="outline" className="text-[10px] h-4 px-1">
                            {printer.pages_today} lbr
                          </Badge>
                        )}
                      </div>

                      {/* Agent Info */}
                      <div className="text-[9px] text-gray-400 mt-0.5 truncate">
                        Agent: {printer.agent_id}
                      </div>

                      {/* Ink Levels if available */}
                      {printer.ink_levels && (() => {
                        const inkLevels = parseInkLevels(printer.ink_levels);
                        const hasInkData = Object.keys(inkLevels).length > 0;

                        return hasInkData && (
                          <div className="flex gap-1 mt-1">
                            {Object.entries(inkLevels).map(([color, level]) => (
                              <div
                                key={color}
                                className="h-1 flex-1 rounded-full bg-gray-200 overflow-hidden"
                                title={`${color}: ${level}%`}
                              >
                                <div
                                  className={`h-full ${level < 15 ? 'bg-red-500' :
                                      level < 30 ? 'bg-yellow-500' :
                                        'bg-green-500'
                                    }`}
                                  style={{ width: `${level}%` }}
                                />
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}