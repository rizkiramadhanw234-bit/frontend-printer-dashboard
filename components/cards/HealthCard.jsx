// components/cards/HealthCard.jsx
"use client";

import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
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
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastChecked, setLastChecked] = useState(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const fetchHealth = async () => {
  setLoading(true);
  try {
    const res = await fetch(`${API_URL}/api/health`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
      }
    });
    
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    setHealth(data);
    setLastChecked(new Date());
  } catch (error) {
    console.error('Failed to fetch health:', error);
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!health) {
    return (
      <Card className="border border-gray-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="h-5 w-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const isOnline = health.status === "ok";
  const connectedAgents = health.agents?.connected || 0;
  const totalAgents = health.agents?.total || 0;

  return (
    <Card className="border border-gray-200">
      <CardHeader className="border-b border-gray-100 pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Server className="h-4 w-4 text-gray-500" />
            System Health
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs gap-1.5"
            onClick={fetchHealth}
            disabled={loading}
          >
            <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
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
                {connectedAgents}/{totalAgents}
              </span>
              <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                {totalAgents > 0 ? Math.round((connectedAgents / totalAgents) * 100) : 0}%
              </Badge>
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

        <Separator className="my-3" />

        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-gray-400">
              Version {health.version || '1.0.0'}
            </span>
            <span className="text-[10px] text-gray-300">•</span>
            <span className="text-[10px] text-gray-400">
              {health.server || 'Printer Dashboard'}
            </span>
          </div>
          {lastChecked && (
            <span className="text-[10px] text-gray-400">
              Updated {lastChecked.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}