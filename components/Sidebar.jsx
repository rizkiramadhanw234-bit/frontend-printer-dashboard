// components/Sidebar.jsx
"use client";

import React from "react";
import {
  LayoutDashboard,
  Printer,
  AlertCircle,
  BarChart3,
  Settings,
  Users,
  Server,
  LogOut,
  Building,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useRouter } from "next/navigation";

export default function Sidebar({ activeTab, onTabChange, stats = {}, health = {} }) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  
  // ✅ SAFE GET SEMUA!
  const serverStatus = health?.status || 'unknown';
  const isOnline = serverStatus === 'ok';
  const agentConnected = health?.agents?.connected || 0;
  const agentTotal = health?.agents?.total || 0;
  
  // ✅ STATS DENGAN DEFAULT
  const printerTotal = stats?.total || 0;
  const offlineCount = stats?.offline || 0;
  const lowInkCount = stats?.lowInk || 0;
  const criticalInkCount = stats?.criticalInk || 0;
  const alertCount = offlineCount + lowInkCount + criticalInkCount;

  const handleMenuClick = (key) => {
    onTabChange(key);  
  };

  const handleLogout = async () => {
    setLoading(true);
    localStorage.removeItem('jwt_token');
    router.push('/login');
  };

  const menuItems = [
    {
      key: "overview",
      icon: <LayoutDashboard className="h-4 w-4" />,
      label: "Dashboard",
    },
    {
      key: "agents",
      icon: <Users className="h-4 w-4" />,
      label: "Agents",
      badge: agentTotal,  // ✅ PAKE VARIABLE
    },
    {
      key: "printers",
      icon: <Printer className="h-4 w-4" />,
      label: "Printers",
      badge: printerTotal,  // ✅ PAKE VARIABLE
    },
    {
      key: "companies",
      icon: <Building className="h-4 w-4" />,
      label: "Companies",
    },
    {
      key: "alerts",
      icon: <AlertCircle className="h-4 w-4" />,
      label: "Alerts",
      badge: alertCount,  // ✅ PAKE VARIABLE
      badgeVariant: "destructive",
    },
    {
      key: "reports",
      icon: <BarChart3 className="h-4 w-4" />,
      label: "Reports",
    },
    {
      key: "settings",
      icon: <Settings className="h-4 w-4" />,
      label: "Settings",
    },
  ];

  return (
    <div className="w-64 min-h-screen bg-white border-r border-gray-200 flex flex-col">
      {/* Logo */}
      <div className="p-5 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-md bg-gray-900 flex items-center justify-center">
            <Printer className="h-4 w-4 text-white" />
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-900">
              Printer Dashboard
            </div>
            <div className="text-[10px] text-gray-500">
              v{process.env.NEXT_PUBLIC_APP_VERSION || "1.0.0"}
            </div>
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className="p-4 border-b border-gray-200 bg-gray-50/50">
        <div className="text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-2">
          System Status
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-600">Server</span>
          <div className="flex items-center gap-1.5">
            <div className={`h-1.5 w-1.5 rounded-full ${
              isOnline ? "bg-green-500" : "bg-gray-300"
            }`} />
            <span className="text-gray-700">
              {isOnline ? "Online" : "Offline"}
            </span>
          </div>
        </div>
        <div className="flex items-center justify-between text-xs mt-1.5">
          <span className="text-gray-600">Agents</span>
          <span className="text-gray-900 font-medium">
            {agentConnected}/{agentTotal}
          </span>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 p-3">
        <div className="space-y-1">
          {menuItems.map((item) => {
            const isActive = activeTab === item.key;
            const badgeCount = item.badge || 0;

            return (
              <Button
                key={item.key}
                variant={isActive ? "secondary" : "ghost"}
                className={`
                  w-full justify-start gap-2 h-9 px-3 text-sm
                  ${isActive ? "bg-gray-100 text-gray-900" : "text-gray-600 hover:bg-gray-50"}
                `}
                onClick={() => handleMenuClick(item.key)}
              >
                <span className={isActive ? "text-gray-900" : "text-gray-500"}>
                  {item.icon}
                </span>
                <span className="flex-1 text-left">{item.label}</span>
                {badgeCount > 0 && (
                  <Badge
                    variant={item.badgeVariant === "destructive" ? "destructive" : "secondary"}
                    className="text-[10px] h-5 px-1.5 min-w-5"
                  >
                    {badgeCount > 99 ? "99+" : badgeCount}
                  </Badge>
                )}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 h-9 px-3 text-sm text-gray-600 hover:bg-gray-50"
          onClick={handleLogout}
          disabled={loading}
        >
          <LogOut className="h-4 w-4 text-gray-500" />
          <span className="flex-1 text-left">Logout</span>
        </Button>
        <div className="text-[10px] text-gray-400 text-center mt-3">
          © {new Date().getFullYear()} Printer Dashboard
        </div>
      </div>
    </div>
  );
}