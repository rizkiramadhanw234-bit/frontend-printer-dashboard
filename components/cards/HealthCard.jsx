// components/cards/HealthCard.jsx
"use client";

import React, { useEffect } from "react";
import { useSystemStore } from "@/store/system.store";
import { 
  Server, 
  RefreshCw, 
  Wifi, 
  WifiOff,
  Activity,
  Users,
  Clock
} from "lucide-react";

export default function HealthCard() {
  const {
    health,
    isLoading,
    fetchHealth
  } = useSystemStore();

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 30000);
    return () => clearInterval(interval);
  }, [fetchHealth]);

  if (!health) {
    return (
      <div className="border border-gray-200 rounded-lg">
        <div className="p-6">
          <div className="flex items-center justify-center">
            <div className="h-5 w-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  const isOnline = health.status === "ok";
  const connectedAgents = health.connections?.agents || 0;
  const totalDashboards = health.connections?.dashboards || 0;

  return (
    <div className="border border-gray-200 rounded-lg">
      <div className="border-b border-gray-100 pb-3 p-4">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium flex items-center gap-2">
            <Server className="h-4 w-4 text-gray-500" />
            System Health
          </div>
          <button
            onClick={fetchHealth}
            disabled={isLoading}
            className="h-7 px-3 text-xs border rounded-md hover:bg-gray-50 flex items-center gap-1.5"
          >
            <RefreshCw className={`h-3 w-3 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>
      
      <div className="pt-4 p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <Activity className="h-3.5 w-3.5" />
              Status
            </div>
            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${isOnline ? 'bg-gray-900' : 'bg-gray-300'}`} />
              <span className="text-sm font-medium text-gray-900">
                {isOnline ? 'Operational' : 'Offline'}
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <Users className="h-3.5 w-3.5" />
              Agents
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-900">
                {connectedAgents}
              </span>
              <span className="text-xs px-1.5 py-0.5 bg-gray-100 rounded">
                connected
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <Wifi className="h-3.5 w-3.5" />
              Connection
            </div>
            <div className="flex items-center gap-1.5">
              {isOnline ? (
                <>
                  <Wifi className="h-3.5 w-3.5 text-gray-600" />
                  <span className="text-xs text-gray-700">Connected</span>
                </>
              ) : (
                <>
                  <WifiOff className="h-3.5 w-3.5 text-gray-400" />
                  <span className="text-xs text-gray-500">Disconnected</span>
                </>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <Clock className="h-3.5 w-3.5" />
              Uptime
            </div>
            <div className="text-sm font-medium text-gray-900">
              {health.uptime 
                ? `${Math.floor(health.uptime / 3600)}h ${Math.floor((health.uptime % 3600) / 60)}m`
                : 'N/A'}
            </div>
          </div>
        </div>

        <div className="my-3 border-t border-gray-100"></div>

        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-gray-400">
              Version {health.version || '1.3.0'}
            </span>
            <span className="text-[10px] text-gray-300">•</span>
            <span className="text-[10px] text-gray-400">
              {health.server || 'Printer Dashboard Backend'}
            </span>
          </div>
          <span className="text-[10px] text-gray-400">
            Updated {new Date(health.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </div>
  );
}