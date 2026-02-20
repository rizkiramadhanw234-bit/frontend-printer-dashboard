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
  Server
} from "lucide-react";

export default function PrinterDetailModal({ printer, isOpen, onClose }) {
  if (!printer) return null;

  // Helper function untuk parse ink levels (karena bisa berupa string JSON)
  const parseInkLevels = (inkLevels) => {
    if (!inkLevels) return {};
    try {
      return typeof inkLevels === 'string' ? JSON.parse(inkLevels) : inkLevels;
    } catch {
      return {};
    }
  };

  // Dapatkan status printer yang benar
  const getPrinterStatus = () => {
    const status = printer.status?.toUpperCase();
    
    if (status === 'READY' || status === 'ONLINE' || status === 'PRINTING') {
      return {
        label: status,
        variant: 'default',
        icon: <Wifi className="h-4 w-4 text-green-500" />
      };
    }
    if (status === 'PAUSED') {
      return {
        label: 'Paused',
        variant: 'secondary',
        icon: <Wifi className="h-4 w-4 text-yellow-500" />
      };
    }
    if (status === 'OTHER' || status === 'ERROR') {
      return {
        label: 'Error',
        variant: 'destructive',
        icon: <WifiOff className="h-4 w-4 text-red-500" />
      };
    }
    return {
      label: status || 'Unknown',
      variant: 'secondary',
      icon: <WifiOff className="h-4 w-4 text-gray-400" />
    };
  };

  // Cek kondisi ink
  const getInkStatus = (color, level) => {
    if (level < 15) return 'critical';
    if (level < 30) return 'low';
    return 'normal';
  };

  const printerStatus = getPrinterStatus();
  const inkLevels = parseInkLevels(printer.ink_levels || printer.inkLevels);
  const hasInkData = Object.keys(inkLevels).length > 0;

  // Format tanggal dengan benar
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleString('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short'
      });
    } catch {
      return '-';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Printer className="h-5 w-5" />
            {printer.display_name || printer.name || 'Unknown Printer'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Basic Info Grid */}
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="p-2 bg-gray-50 rounded">
              <div className="text-xs text-gray-500">Agent ID</div>
              <div className="font-mono text-xs truncate" title={printer.agent_id}>
                {printer.agent_id || '-'}
              </div>
            </div>
            <div className="p-2 bg-gray-50 rounded">
              <div className="text-xs text-gray-500">Vendor</div>
              <div className="font-medium">{printer.vendor || '-'}</div>
            </div>
            <div className="p-2 bg-gray-50 rounded">
              <div className="text-xs text-gray-500">IP Address</div>
              <div className="font-mono text-xs">{printer.ip_address || printer.ip || '-'}</div>
            </div>
            <div className="p-2 bg-gray-50 rounded">
              <div className="text-xs text-gray-500">Network</div>
              <div>{printer.is_network ? 'Yes' : 'No'}</div>
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-sm text-gray-600">Status</span>
            <div className="flex items-center gap-2">
              {printerStatus.icon}
              <Badge variant={printerStatus.variant}>
                {printerStatus.label}
              </Badge>
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
                  const inkStatus = getInkStatus(color, level);
                  return (
                    <div key={color}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="capitalize">{color}</span>
                        <span className={
                          inkStatus === 'critical' ? 'text-red-600' : 
                          inkStatus === 'low' ? 'text-yellow-600' : 
                          'text-green-600'
                        }>
                          {level}%
                        </span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${
                            inkStatus === 'critical' ? 'bg-red-500' : 
                            inkStatus === 'low' ? 'bg-yellow-500' : 
                            'bg-green-500'
                          }`}
                          style={{ width: `${level}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Statistics */}
          <div className="grid grid-cols-3 gap-2">
            <div className="p-2 bg-gray-50 rounded-lg text-center">
              <FileText className="h-4 w-4 mx-auto mb-1 text-gray-400" />
              <div className="text-xs text-gray-500">Today</div>
              <div className="font-bold">{printer.pages_today || 0}</div>
            </div>
            <div className="p-2 bg-gray-50 rounded-lg text-center">
              <HardDrive className="h-4 w-4 mx-auto mb-1 text-gray-400" />
              <div className="text-xs text-gray-500">Total</div>
              <div className="font-bold">{printer.total_pages || 0}</div>
            </div>
            <div className="p-2 bg-gray-50 rounded-lg text-center">
              <Clock className="h-4 w-4 mx-auto mb-1 text-gray-400" />
              <div className="text-xs text-gray-500">Last Print</div>
              <div className="font-bold text-xs">
                {printer.last_print_time ? new Date(printer.last_print_time).toLocaleDateString() : '-'}
              </div>
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
            {printer.last_ink_update && (
              <div className="flex items-center gap-1 col-span-2">
                <Droplets className="h-3 w-3" />
                <span>Ink Updated: {formatDate(printer.last_ink_update)}</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
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