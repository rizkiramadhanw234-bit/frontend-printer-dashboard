// components/cards/PrinterCard.jsx
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
import { Progress } from "@/components/ui/progress";
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
  Wifi,
  WifiOff,
  HardDrive,
  Calendar,
  FileText,
  Building2,
  MapPin,
  Server,
  AlertCircle
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

  const isOnline = printer.status === "ready" || printer.status === "online";
  const isPaused = printer.status === "paused";

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
                  {printer.displayName || printer.name}
                </CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge
                    variant={isOnline ? "default" : "secondary"}
                    className="text-[10px] h-5 px-2"
                  >
                    {isPaused ? "Paused" : isOnline ? "Online" : "Offline"}
                  </Badge>
                  {printer.isNetworkPrinter && (
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
                  disabled={loading || !isOnline}
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
          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div className="flex justify-center mb-1">
                <FileText className="h-4 w-4 text-gray-400" />
              </div>
              <div className="text-lg font-semibold text-gray-900">
                {printer.pagesToday || 0}
              </div>
              <div className="text-xs text-gray-500">Pages Today</div>
            </div>

            <div className="text-center">
              <div className="flex justify-center mb-1">
                <Calendar className="h-4 w-4 text-gray-400" />
              </div>
              <div className="text-xs font-medium text-gray-700 mt-1">
                {printer.lastPrintTime
                  ? new Date(printer.lastPrintTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
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
                {printer.ipAddress || "N/A"}
              </div>
              <div className="text-xs text-gray-500">IP Address</div>
            </div>
          </div>

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
                  <div className={`
                    h-2 w-2 rounded-full
                    ${agent.isOnline ? 'bg-gray-900' : 'bg-gray-300'}
                  `} />
                  <span className="text-gray-500">{agent.isOnline ? 'Connected' : 'Disconnected'}</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ink Levels Card */}
      {printer.inkLevels && Object.keys(printer.inkLevels).length > 0 && (
        <Card className="border border-gray-200">
          <CardHeader className="border-b border-gray-100 pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <HardDrive className="h-4 w-4 text-gray-500" />
              Ink & Toner Levels
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(printer.inkLevels).map(([color, level]) => {
                const colorName = color.charAt(0).toUpperCase() + color.slice(1);
                const isLow = level < 20;

                return (
                  <div key={color} className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">{colorName}</span>
                      <span className={`font-medium ${isLow ? 'text-gray-900' : 'text-gray-700'}`}>
                        {level}%
                      </span>
                    </div>
                    <Progress
                      value={level}
                      className={`h-1.5 bg-gray-100 [&>div]:${isLow ? 'bg-gray-600' : 'bg-gray-900'}`} 
                    />
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