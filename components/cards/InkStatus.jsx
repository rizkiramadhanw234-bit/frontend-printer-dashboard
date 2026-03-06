"use client";

import React from "react";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";
import { usePrinterStore } from "../../store/printer.store-backup";

export default function InkStatus({ printer }) {
  if (!printer) return null;
  const { inkStatus } = usePrinterStore();
  const ink = inkStatus[printerName];

  if (!ink || !ink.supported) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-4">
            <p className="text-muted-foreground">
              Ink monitoring not supported for this printer
            </p>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="ml-2 h-4 w-4 inline text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>USB printers may require vendor-specific software</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!ink.levels || Object.keys(ink.levels).length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-4">
            <p className="text-muted-foreground">No ink level data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getColorProgress = (color, level) => {
    if (level === null || level === undefined) return 0;
    if (level === 0) return "destructive";
    if (level < 10) return "destructive";
    if (level < 20) return "warning";
    return "default";
  };

  const getColorName = (color) => {
    const colors = {
      black: "Black",
      cyan: "Cyan",
      magenta: "Magenta",
      yellow: "Yellow",
      photoBlack: "Photo Black",
      gray: "Gray",
    };
    return colors[color] || color.charAt(0).toUpperCase() + color.slice(1);
  };

  const getColorHex = (color) => {
    const colors = {
      black: "#000000",
      cyan: "#00FFFF",
      magenta: "#FF00FF",
      yellow: "#FFFF00",
      photoBlack: "#333333",
      gray: "#808080",
    };
    return colors[color] || "#666666";
  };

  return (
    <div className="ink-status">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(ink.levels).map(([color, level]) => {
          if (level === null) return null;

          const status = getColorProgress(color, level);
          const statusClass = status === "destructive" ? "text-red-600" :
            status === "warning" ? "text-amber-600" :
              "text-green-600";

          return (
            <Card key={color} className="h-full">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                    style={{ backgroundColor: getColorHex(color) }}
                  >
                    <span className="text-white text-sm font-bold">
                      {getColorName(color).charAt(0)}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-2">
                      <p className="font-medium text-sm truncate">{getColorName(color)}</p>
                      <p className={`font-bold text-lg ${statusClass}`}>{level}%</p>
                    </div>
                    <Progress
                      value={level}
                      className={`
                            h-2
                            ${status === "destructive" ? "[&>div]:bg-red-500" : ""}
                            ${status === "warning" ? "[&>div]:bg-amber-500" : ""}
                            ${status === "default" ? "[&>div]:bg-green-500" : ""}
                          `}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {ink.lastChecked && (
        <div className="mt-6 pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            Last checked: {new Date(ink.lastChecked).toLocaleTimeString()}
          </p>
        </div>
      )}
    </div>
  );
}