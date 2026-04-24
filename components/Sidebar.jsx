"use client";

import React, { useState } from "react";
import {
  LayoutDashboard,
  Printer,
  AlertCircle,
  BarChart3,
  Settings,
  Users,
  LogOut,
  Building,
  FolderOpen,
  ChevronDown,
  ChevronRight,
  Plus,
  Pencil,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useAlertStore } from "@/store/alert.store";
import { usePrinterGroupStore } from "@/store/printer.group.store";
import { ManageGroupsModal } from "./modals/PrinterGroupModal";

export default function Sidebar({
  activeTab,
  onTabChange,
  stats = {},
  health = {},
  activeGroupId = null,
  onGroupSelect,
  allPrinters = [],
}) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [groupsExpanded, setGroupsExpanded] = useState(true);
  const [showManageModal, setShowManageModal] = useState(false);

  const { groups, getUngroupedIds } = usePrinterGroupStore();
  const unreadCount = useAlertStore((state) => state.unreadCount);

  const serverStatus = health?.status || "unknown";
  const isOnline = serverStatus === "ok";
  const agentConnected = health?.agents?.connected || 0;
  const agentTotal = health?.agents?.total || 0;

  const handleLogout = async () => {
    setLoading(true);
    localStorage.removeItem("jwt_token");
    router.push("/login");
  };

  const handleMenuClick = (key) => {
    onTabChange(key);
    if (key !== "printers" && onGroupSelect) onGroupSelect(null);
  };

  const handleGroupClick = (group) => {
    onTabChange("printers");
    if (onGroupSelect) onGroupSelect(group.id === activeGroupId ? null : group);
  };

  const ungroupedCount = allPrinters.length > 0
    ? getUngroupedIds(allPrinters.map((p) => p.id)).length
    : 0;

  const menuItems = [
    { key: "overview", icon: <LayoutDashboard className="h-4 w-4" />, label: "Dashboard" },
    { key: "agents", icon: <Users className="h-4 w-4" />, label: "Agents", badge: agentTotal },
    { key: "printers", icon: <Printer className="h-4 w-4" />, label: "Printers", badge: stats?.total },
    { key: "companies", icon: <Building className="h-4 w-4" />, label: "Companies" },
    { key: "alerts", icon: <AlertCircle className="h-4 w-4" />, label: "Alerts", badge: unreadCount, badgeVariant: "destructive" },
    { key: "reports", icon: <BarChart3 className="h-4 w-4" />, label: "Reports" },
    { key: "settings", icon: <Settings className="h-4 w-4" />, label: "Settings" },
  ];

  return (
    <>
      <div className="w-64 min-h-screen bg-white border-r border-gray-200 flex flex-col">
        {/* Logo */}
        <div className="p-5 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-md bg-gray-900 flex items-center justify-center">
              <Printer className="h-4 w-4 text-white" />
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-900">Newton MPS Dashboard</div>
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
              <div className={`h-1.5 w-1.5 rounded-full ${isOnline ? "bg-green-500" : "bg-gray-300"}`} />
              <span className="text-gray-700">{isOnline ? "Online" : "Offline"}</span>
            </div>
          </div>
          {/* <div className="flex items-center justify-between text-xs mt-1.5">
            <span className="text-gray-600">Agents</span>
            <span className="text-gray-900 font-medium">{agentConnected}/{agentTotal}</span>
          </div> */}
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-3 space-y-0.5">
            {menuItems.map((item) => {
              const isActive = activeTab === item.key && !(item.key === "printers" && activeGroupId);
              const badgeCount = item.badge || 0;
              return (
                <Button
                  key={item.key}
                  variant={isActive ? "secondary" : "ghost"}
                  className={`w-full justify-start gap-2 h-9 px-3 text-sm
                    ${isActive ? "bg-gray-100 text-gray-900" : "text-gray-600 hover:bg-gray-50"}`}
                  onClick={() => handleMenuClick(item.key)}
                >
                  <span className={isActive ? "text-gray-900" : "text-gray-500"}>{item.icon}</span>
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

            {/*  PRINTER GROUPS  */}
            <div className="pt-3">
              <div className="flex items-center justify-between px-2 mb-1">
                <button
                  onClick={() => setGroupsExpanded((v) => !v)}
                  className="flex items-center gap-1.5 text-[11px] font-medium text-gray-700 uppercase tracking-wider hover:text-gray-600 transition-colors"
                >
                  {groupsExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                  Printer Groups
                </button>
                <div className="flex items-center gap-0.5">
                  <button
                    onClick={() => setShowManageModal(true)}
                    title="Manage groups"
                    className="h-5 w-5 flex items-center justify-center rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => setShowManageModal(true)}
                    title="Add group"
                    className="h-5 w-5 flex items-center justify-center rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
              </div>

              {groupsExpanded && (
                <div className="space-y-0.5">
                  {/* All Printers shortcut saat group aktif */}
                  {activeGroupId && activeTab === "printers" && (
                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-2 h-8 px-3 text-xs text-gray-500 hover:bg-gray-50"
                      onClick={() => onGroupSelect?.(null)}
                    >
                      <Printer className="h-3.5 w-3.5 text-gray-400" />
                      <span className="flex-1 text-left">All Printers</span>
                    </Button>
                  )}

                  {groups.length === 0 ? (
                    <button
                      onClick={() => setShowManageModal(true)}
                      className="w-full px-3 py-2 text-left text-[11px] text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-md transition-colors"
                    >
                      + Create your first group
                    </button>
                  ) : (
                    groups.map((group) => {
                      const isActive = activeGroupId === group.id && activeTab === "printers";
                      return (
                        <button
                          key={group.id}
                          onClick={() => handleGroupClick(group)}
                          className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-xs transition-colors text-left
                            ${isActive
                              ? "bg-gray-100 text-gray-900 font-medium"
                              : "text-gray-600 hover:bg-gray-50"
                            }`}
                        >
                          <FolderOpen className={`h-3.5 w-3.5 shrink-0 ${isActive ? "text-gray-700" : "text-gray-400"}`} />
                          <span className="flex-1 truncate">{group.name}</span>
                          <span className="text-[10px] shrink-0 text-gray-400">
                            {group.printerIds.length}
                          </span>
                        </button>
                      );
                    })
                  )}

                  {/* Ungrouped */}
                  {ungroupedCount > 0 && (
                    <button
                      onClick={() => handleGroupClick({ id: "__ungrouped__", name: "Ungrouped" })}
                      className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-xs transition-colors text-left
                        ${activeGroupId === "__ungrouped__" && activeTab === "printers"
                          ? "bg-gray-100 text-gray-900 font-medium"
                          : "text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                        }`}
                    >
                      <FolderOpen className="h-3.5 w-3.5 shrink-0 text-gray-300" />
                      <span className="flex-1 truncate italic">Ungrouped</span>
                      <span className="text-[10px] shrink-0">{ungroupedCount}</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* download agent exe */}
        <div className="flex justify-center items-start pb-4">
          <Button className="bg-gray-600 w-35 text-xs">
            <a href="/MPS Newton Agent Setup.exe" download="MPS Newton Agent Setup.exe">
              Download Agent
            </a>
          </Button>
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
            © {new Date().getFullYear()} Kudukuats Project
          </div>
        </div>
      </div >

      <ManageGroupsModal
        isOpen={showManageModal}
        onClose={() => setShowManageModal(false)}
        allPrinters={allPrinters}
      />
    </>
  );
}