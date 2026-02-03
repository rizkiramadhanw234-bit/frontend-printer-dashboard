"use client";

import React from "react";
import {
  LayoutDashboard,
  Printer,
  AlertTriangle,
  BarChart3,
  Settings,
  Cloud,
  Users,
  MapPin,
  Server,
  Shield,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuthStore } from "../store/auth.store";
import { usePrinterStore } from "../store/printer.store";
import { useSystemStore } from "../store/system.store";
import { useRouter } from "next/navigation";

export default function Sidebar({ activeTab, onTabChange }) {
  const router = useRouter();
  const { user } = useAuthStore();
  const logout = useAuthStore((state) => state.logout);
  const [loading, setLoading] = React.useState(false);


  const handleLogout = async () => {
    setLoading(true);
    await logout();
    router.push("/login");
  };



  const {
    printers,
    getPrintersWithLowInk,
    getOfflinePrinters,
    getPrintersWithCriticalInk,
  } = usePrinterStore();

  const { health } = useSystemStore();

  // Perbaiki nama function di sini
  const lowInkPrinters = getPrintersWithLowInk().length;
  const criticalInkPrinters = getPrintersWithCriticalInk().length;
  const offlinePrinters = getOfflinePrinters().length;

  // Total alerts = offline + low ink + critical ink
  const alertCount = offlinePrinters + lowInkPrinters + criticalInkPrinters;

  const menuItems = [
    {
      key: "overview",
      icon: <LayoutDashboard className="h-4 w-4" />,
      label: "DASHBOARD",
    },
    {
      key: "agents",
      icon: <Users className="h-4 w-4" />,
      label: "LIST AGENTS",
    },
    {
      key: "details",
      icon: <Printer className="h-4 w-4" />,
      label: "PRINTER DETAILS",
      disabled: printers.length === 0,
    },
    {
      key: "reports",
      icon: <BarChart3 className="h-4 w-4" />,
      label: "REPORTS",
    },
    {
      key: "alerts",
      icon: <AlertTriangle className="h-4 w-4" />,
      label: (
        <div className="flex items-center justify-between w-full">
          <span>ALERTS</span>
          {alertCount > 0 && (
            <Badge variant="destructive" className="h-5 w-5 p-0 flex items-center justify-center text-xs">
              {alertCount}
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: "cloud",
      icon: <Cloud className="h-4 w-4" />,
      label: (
        <div className="flex items-center justify-between w-full">
          <span>CLOUD</span>
          {health && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center">
                    <div className={`w-2 h-2 rounded-full ${health.status === "ok" ? "bg-green-500" : "bg-red-500"}`} />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  {health.status === "ok" ? "Cloud Connected" : "Cloud Disconnected"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      ),
    },
    // {
    //   key: "settings",
    //   icon: <Settings className="h-4 w-4" />,
    //   label: "SETTINGS",
    // },
  ];

  const handleMenuClick = (key) => {
    onTabChange(key);
  };

  // if (loading) return null;
  return (
    <div className="w-64 min-h-screen bg-white dark:bg-gray-900 shadow-lg border-r dark:border-gray-800">
      {/* Logo & Company Info */}
      <div className="p-6 border-b dark:border-gray-800">
        <div className="flex items-center justify-center mb-4">
          <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
            <Printer className="text-white h-6 w-6" />
          </div>
        </div>
        <div className="text-center">
          <div className="text-xl font-semibold text-gray-800 dark:text-gray-200">
            {process.env.NEXT_PUBLIC_COMPANY_NAME || "Printer Dashboard"}
          </div>
          <h1>Welcome, {user?.email}</h1>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {process.env.NEXT_PUBLIC_APP_VERSION || "1.0.0"}
          </div>
        </div>
      </div>

      {/* Printer Stats */}
      <div className="p-4 border-b dark:border-gray-800">
        <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          PRINTER STATS
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="text-center p-2 bg-green-50 dark:bg-green-900/20 rounded border border-green-100 dark:border-green-800">
            <div className="text-lg font-bold text-green-600 dark:text-green-400">
              {printers.length}
            </div>
            <div className="text-xs text-green-700 dark:text-green-300">Total</div>
          </div>
          <div className="text-center p-2 bg-red-50 dark:bg-red-900/20 rounded border border-red-100 dark:border-red-800">
            <div className="text-lg font-bold text-red-600 dark:text-red-400">
              {offlinePrinters}
            </div>
            <div className="text-xs text-red-700 dark:text-red-300">Offline</div>
          </div>
          <div className="text-center p-2 bg-amber-50 dark:bg-amber-900/20 rounded border border-amber-100 dark:border-amber-800">
            <div className="text-lg font-bold text-amber-600 dark:text-amber-400">
              {lowInkPrinters}
            </div>
            <div className="text-xs text-amber-700 dark:text-amber-300">Low Ink</div>
          </div>
          <div className="text-center p-2 bg-orange-50 dark:bg-orange-900/20 rounded border border-orange-100 dark:border-orange-800">
            <div className="text-lg font-bold text-orange-600 dark:text-orange-400">
              {criticalInkPrinters}
            </div>
            <div className="text-xs text-orange-700 dark:text-orange-300">Critical</div>
          </div>
        </div>
      </div>

      {/* Agent Info */}
      {health && health.agents && (
        <div className="p-4 border-b dark:border-gray-800 bg-blue-50 dark:bg-blue-900/20">
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            SYSTEM STATUS
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-sm flex items-center gap-1 text-gray-600 dark:text-gray-400">
                <Users className="h-3 w-3" />
                <span>Agents</span>
              </div>
              <Badge
                variant={health.agents.connected > 0 ? "default" : "destructive"}
                className="text-xs"
              >
                {health.agents.connected}/{health.agents.total}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm flex items-center gap-1 text-gray-600 dark:text-gray-400">
                <Cloud className="h-3 w-3" />
                <span>Status</span>
              </div>
              <Badge
                variant={health.status === "ok" ? "default" : "destructive"}
                className="text-xs"
              >
                {health.status === "ok" ? "Online" : "Offline"}
              </Badge>
            </div>
          </div>
        </div>
      )}

      {/* Main Menu */}
      <div className="pt-4 px-2">
        {menuItems.map((item) => (
          <Button
            key={item.key}
            variant={activeTab === item.key ? "default" : "ghost"}
            className={`w-full justify-start mb-1 ${activeTab === item.key ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
            onClick={() => handleMenuClick(item.key)}
            disabled={item.disabled}
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                {item.icon}
                <span className="text-sm font-medium">{item.label}</span>
              </div>
              {item.key === "alerts" && alertCount > 0 && (
                <Badge variant="destructive" className="h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {alertCount}
                </Badge>
              )}
            </div>
          </Button>
        ))}
      </div>

      <Separator className="my-4" />

      {/* Footer */}
      <div className="w-full p-4 border-t dark:border-gray-800 bg-gray-50 dark:bg-gray-900 mt-auto">
        <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
          <div className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {process.env.NEXT_PUBLIC_TIMEZONE}
          </div>
          <div className="flex items-center gap-1">
            <Server className="h-3 w-3" />
            {health?.server || "Printer Dashboard"}
          </div>
          <div className="flex items-center gap-1">
            <Shield className="h-3 w-3" />
            v{health?.version || "1.0.0"} • {new Date().getFullYear()}
          </div>
        </div>
      </div>

      {/* logout */}
      <div className="p-4 border-t dark:border-gray-800">
        <Button disabled={loading} onClick={handleLogout}> {loading ? "loading..." : "Logout"}</Button>
      </div>
    </div>
  );
}