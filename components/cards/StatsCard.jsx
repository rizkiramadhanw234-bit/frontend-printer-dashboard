"use client";

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
      iconColor: "text-gray-600",
      bgColor: "bg-gray-100"
    },
    {
      title: "Offline",
      value: stats.offline || 0,
      icon: WifiOff,
      iconColor: "text-red-600",
      bgColor: "bg-red-100"
    },
    {
      title: "Low Ink",
      value: stats.lowInk || 0,
      icon: HardDrive,
      iconColor: "text-yellow-600",
      bgColor: "bg-yellow-100"
    },
    {
      title: "Critical",
      value: stats.criticalInk || 0,
      icon: AlertCircle,
      iconColor: "text-orange-600",
      bgColor: "bg-orange-100"
    },
    {
      title: "Pages Today",
      value: stats.pagesToday || 0,
      icon: FileText,
      iconColor: "text-blue-600",
      bgColor: "bg-blue-100"
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <div key={index} className="border border-gray-200 rounded-lg">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 mb-1">{card.title}</p>
                  <p className="text-xl font-semibold text-gray-900">
                    {card.value.toLocaleString()}
                  </p>
                </div>
                <div className={`h-8 w-8 rounded-full ${card.bgColor} flex items-center justify-center`}>
                  <Icon className={`h-4 w-4 ${card.iconColor}`} />
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}