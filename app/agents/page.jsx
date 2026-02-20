"use client";

import React, { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Monitor,
  Wifi,
  WifiOff,
  Building,
  MapPin,
  Printer,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Eye,
} from "lucide-react";
import { useAppStore } from "@/store/agent.store";
import { usePrinterStore } from "@/store/printer.store";

export default function AgentTable({ onAgentSelect }) {
  const {
    agents,
    selectedAgentId,
    agentsLoading,
    fetchAllAgents,
    selectAgent,
    getOnlineAgentsCount,
    getOfflineAgentsCount,
  } = useAppStore();

  const { setSelectedAgent } = usePrinterStore();

  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  // Load agents on mount
  useEffect(() => {
    fetchAllAgents();
  }, [fetchAllAgents]);

  // Filter and sort agents
  const filteredAgents = agents
    .filter(agent => {
      // Search filter
      if (searchText) {
        const searchLower = searchText.toLowerCase();
        return (
          agent.name?.toLowerCase().includes(searchLower) ||
          agent.company?.toLowerCase().includes(searchLower) ||
          agent.location?.toLowerCase().includes(searchLower) ||
          agent.agentId?.toLowerCase().includes(searchLower)
        );
      }
      return true;
    })
    .filter(agent => {
      // Status filter
      if (statusFilter === "all") return true;
      return agent.status === statusFilter;
    })
    .sort((a, b) => {
      // Sorting
      if (!sortConfig.key) return 0;

      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      // Special handling for dates
      if (sortConfig.key === 'lastSeen') {
        aValue = new Date(a.lastSeen || 0);
        bValue = new Date(b.lastSeen || 0);
      }

      if (sortConfig.key === 'printerCount') {
        aValue = a.printerCount || 0;
        bValue = b.printerCount || 0;
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

  const handleSelectAgent = (agentId) => {
    selectAgent(agentId);
    setSelectedAgent(agentId);
    if (onAgentSelect) onAgentSelect(agentId);
  };

  const handleRefresh = () => {
    fetchAllAgents();
  };

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const SortIcon = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) return null;
    return sortConfig.direction === 'asc' ?
      <ChevronUp className="h-3 w-3 ml-1" /> :
      <ChevronDown className="h-3 w-3 ml-1" />;
  };

  // const getStatusVariant = (status) => {
  //   switch (status?.toLowerCase()) {
  //     case 'online': return 'default';
  //     case 'offline': return 'secondary';
  //     case 'error': return 'destructive';
  //     default: return 'outline';
  //   }
  // };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            Agents ({agents.length})
          </CardTitle>

          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative">
              <Input
                placeholder="Search agents..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="pl-3 pr-9 w-full sm:w-[200px]"
              />
              {searchText && (
                <button
                  onClick={() => setSearchText("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  ✕
                </button>
              )}
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="online">Online</SelectItem>
                <SelectItem value="offline">Offline</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="icon"
              onClick={handleRefresh}
              disabled={agentsLoading}
            >
              <RefreshCw className={`h-4 w-4 ${agentsLoading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>

        <div className="text-sm text-muted-foreground flex flex-wrap gap-4">
          <span className="flex items-center gap-1">
            <Wifi className="h-3 w-3 text-green-500" />
            {getOnlineAgentsCount?.()} online
          </span>
          <span className="flex items-center gap-1">
            <WifiOff className="h-3 w-3 text-gray-400" />
            {getOfflineAgentsCount?.()} offline
          </span>
          <span className="flex items-center gap-1">
            <Printer className="h-3 w-3 text-blue-500" />
            {(agents || []).reduce((sum, agent) => sum + (agent.printerCount || 0), 0)} total printers
          </span>
        </div>
      </CardHeader>

      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">Status</TableHead>
                <TableHead
                  className="cursor-pointer"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center">
                    Agent
                    <SortIcon columnKey="name" />
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer"
                  onClick={() => handleSort('company')}
                >
                  <div className="flex items-center">
                    Company
                    <SortIcon columnKey="company" />
                  </div>
                </TableHead>
                <TableHead>Location</TableHead>
                <TableHead
                  className="cursor-pointer"
                  onClick={() => handleSort('printerCount')}
                >
                  <div className="flex items-center">
                    Printers
                    <SortIcon columnKey="printerCount" />
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer"
                  onClick={() => handleSort('lastSeen')}
                >
                  <div className="flex items-center">
                    Last Seen
                    <SortIcon columnKey="lastSeen" />
                  </div>
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {agentsLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-4 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-8 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : filteredAgents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="text-muted-foreground">
                      {agents.length === 0 ? "No agents connected" : "No agents match your search"}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredAgents.map((agent) => {
                  const isSelected = selectedAgentId === agent.agentId;
                  const lastSeen = agent.lastSeen ? new Date(agent.lastSeen) : null;
                  const timeAgo = lastSeen
                    // eslint-disable-next-line react-hooks/purity
                    ? `${Math.floor((Date.now() - lastSeen.getTime()) / (1000 * 60))}m ago`
                    : "Unknown";

                  console.log('Agent:', agent.agentId, 'Last seen:', timeAgo);
                  console.log('Agent lastSeen:', agent.lastSeen);
                  console.log('Agent lastSeen type:', typeof agent.lastSeen);

                  return (
                    <TableRow
                      key={agent.agentId}
                      className={`cursor-pointer hover:bg-muted/50 ${isSelected ? "bg-blue-50 dark:bg-blue-950/20" : ""
                        }`}
                      onClick={() => handleSelectAgent(agent.agentId)}
                    >
                      <TableCell>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div
                                className={`h-3 w-3 rounded-full ${agent.status === "online"
                                    ? "bg-green-500"
                                    : agent.status === "offline"
                                      ? "bg-gray-400"
                                      : "bg-red-500"
                                  }`}
                              />
                            </TooltipTrigger>
                            <TooltipContent>
                              {agent.status?.toUpperCase()}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                            <Monitor className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <div className="font-medium">{agent.name}</div>
                            <div className="text-xs text-muted-foreground truncate max-w-[150px]">
                              {agent.agentId}
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Building className="h-3 w-3 text-muted-foreground" />
                          <span className="truncate max-w-[120px]">
                            {agent.company}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          <span className="truncate max-w-[100px]">
                            {agent.location}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Printer className="h-4 w-4 text-blue-600" />
                          <span className="font-bold">{agent.printerCount || 0}</span>
                          <Badge variant="outline" className="text-xs">
                            printers
                          </Badge>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {timeAgo}
                        </div>
                      </TableCell>

                      <TableCell className="text-right">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSelectAgent(agent.agentId);
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              View Details
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Summary footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between mt-4 text-sm text-muted-foreground">
          <div>
            Showing {filteredAgents.length} of {agents.length} agents
          </div>
          <div className="flex items-center gap-2 mt-2 sm:mt-0">
            {selectedAgentId && (
              <Badge variant="outline" className="gap-1">
                <Monitor className="h-3 w-3" />
                Selected: {agents.find(a => a.agentId === selectedAgentId)?.name}
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}