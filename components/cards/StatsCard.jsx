// components/cards/StatsCards.jsx
"use client";

import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { 
  Printer, 
  WifiOff, 
  AlertCircle, 
  FileText,
  HardDrive
} from "lucide-react";

export default function StatsCards({ stats }) {
  const cards = [
    {
      title: "Total Printers",
      value: stats.total || 0,
      icon: Printer,
    },
    {
      title: "Offline",
      value: stats.offline || 0,
      icon: WifiOff,
    },
    {
      title: "Low Ink",
      value: stats.lowInk || 0,
      icon: HardDrive,
    },
    {
      title: "Critical",
      value: stats.criticalInk || 0,
      icon: AlertCircle,
    },
    {
      title: "Pages Today",
      value: stats.pagesToday || 0,
      icon: FileText,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card key={index} className="border border-gray-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 mb-1">{card.title}</p>
                  <p className="text-xl font-semibold text-gray-900">
                    {card.value.toLocaleString()}
                  </p>
                </div>
                <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                  <Icon className="h-4 w-4 text-gray-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}