// components/tables/AgentTable.jsx
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Eye,
  Server,
  Building2,
  Trash2
} from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

export default function AgentTable({ onAgentSelect, mode = "dashboard" }) {
  const router = useRouter();
  const [agents, setAgents] = useState([]);
  const [selectedAgentId, setSelectedAgentId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  // Load agents list
  const loadAgents = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/agents`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
        }
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setAgents(data.agents || []);
    } catch (error) {
      console.error('Failed to load agents:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAgents();
  }, []);

  const handleSelect = (agentId) => {
    if (mode === "dashboard") {
      onAgentSelect?.(agentId);
      setSelectedAgentId(agentId);
    }
  };

  const handleViewDetails = (agentId, e) => {
    e.stopPropagation();
    router.push(`/agents/${agentId}`);
  };

  useEffect(() => {
    if (mode === "dashboard" && agents.length > 0 && !selectedAgentId) {
      handleSelect(agents[0].id);
    }
  }, [agents, mode]);

  const filteredAgents = agents
    .filter(agent => {
      if (searchText) {
        const search = searchText.toLowerCase();
        return (
          agent.name?.toLowerCase().includes(search) ||
          agent.company?.toLowerCase().includes(search) ||
          agent.department?.toLowerCase().includes(search) ||
          agent.id?.toLowerCase().includes(search)
        );
      }
      return true;
    })
    .filter(agent => {
      if (statusFilter === "all") return true;
      return agent.status === statusFilter;
    })
    .sort((a, b) => {
      if (!sortConfig.key) return 0;

      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];

      if (sortConfig.key === 'lastSeen') {
        aVal = new Date(a.lastSeen || 0);
        bVal = new Date(b.lastSeen || 0);
      }

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

  const handleDelete = async (agentId, e) => {
    e?.stopPropagation();
    setDeletingId(agentId);
    try {
      const token = localStorage.getItem('jwt_token');
      const res = await fetch(`${API_URL}/api/agents/${agentId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setAgents(prev => prev.filter(a => a.id !== agentId));
    } catch (error) {
      console.error('Failed to delete agent:', error);
    } finally {
      setDeletingId(null);
    }
  };

  const SortIcon = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) return null;
    return sortConfig.direction === 'asc'
      ? <ChevronUp className="h-3 w-3 ml-1 text-gray-400" />
      : <ChevronDown className="h-3 w-3 ml-1 text-gray-400" />;
  };

  return (
    <Card className="border border-gray-200 shadow-sm">
      <CardHeader className="border-b border-gray-100 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle className="flex items-center gap-2 text-base font-medium">
            <Server className="h-4 w-4 text-gray-500" />
            Agents
            <Badge variant="secondary" className="ml-2 text-xs">
              {agents.length}
            </Badge>
          </CardTitle>

          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              placeholder="Search agents..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="h-8 w-full sm:w-[200px] text-sm"
            />

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-8 w-full sm:w-[130px] text-sm">
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
              className="h-8 w-8"
              onClick={loadAgents}
              disabled={loading}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="relative">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/50 hover:bg-gray-50/50 border-y border-gray-100">
                <TableHead className="w-16 h-9 text-xs font-medium text-gray-500">Status</TableHead>
                <TableHead
                  className="h-9 text-xs font-medium text-gray-500 cursor-pointer"
                  onClick={() => setSortConfig({ key: 'name', direction: sortConfig.key === 'name' && sortConfig.direction === 'asc' ? 'desc' : 'asc' })}
                >
                  <div className="flex items-center">
                    Agent
                    <SortIcon columnKey="name" />
                  </div>
                </TableHead>
                <TableHead className="h-9 text-xs font-medium text-gray-500">Company</TableHead>
                <TableHead className="h-9 text-xs font-medium text-gray-500">Department</TableHead>
                <TableHead className="h-9 text-xs font-medium text-gray-500 text-center">Printers</TableHead>
                <TableHead className="h-9 text-xs font-medium text-gray-500">Last Seen</TableHead>
                <TableHead className="h-9 text-xs font-medium text-gray-500 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i} className="border-b border-gray-100">
                    <TableCell><Skeleton className="h-5 w-5 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-8 mx-auto" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-7 w-7 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : filteredAgents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-sm text-gray-500">
                    {agents.length === 0 ? "No agents connected" : "No agents match your search"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredAgents.map((agent) => {
                  const isSelected = selectedAgentId === agent.id;
                  const lastSeen = agent.lastSeen ? new Date(agent.lastSeen) : null;
                  const timeAgo = lastSeen
                    ? `${Math.floor((Date.now() - lastSeen.getTime()) / 60000)}m ago`
                    : "Never";

                  return (
                    <TableRow
                      key={agent.id}
                      className={`
                        border-b border-gray-100 cursor-pointer transition-colors
                        ${isSelected ? "bg-gray-50" : "hover:bg-gray-50/50"}
                      `}
                      onClick={() => handleSelect(agent.id)}
                    >
                      <TableCell>
                        <div className={`
                          h-2.5 w-2.5 rounded-full
                          ${agent.status === 'online' ? 'bg-gray-900' : 'bg-gray-300'}
                        `} />
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-7 w-7 rounded-full bg-gray-100 flex items-center justify-center">
                            <Monitor className="h-3.5 w-3.5 text-gray-600" />
                          </div>
                          <div>
                            <div className="text-sm font-medium">{agent.name}</div>
                            <div className="text-xs text-gray-500">{agent.hostname}</div>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Building2 className="h-3.5 w-3.5 text-gray-400" />
                          <span className="text-sm text-gray-700">{agent.company}</span>
                        </div>
                      </TableCell>

                      <TableCell>
                        <span className="text-sm text-gray-700">{agent.department}</span>
                      </TableCell>

                      <TableCell className="text-center">
                        <Badge variant="secondary" className="text-xs">
                          {agent.printerCount || 0}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <span className="text-xs text-gray-500">{timeAgo}</span>
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={(e) => handleViewDetails(agent.id, e)}
                                >
                                  <Eye className="h-3.5 w-3.5 text-gray-500" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="left" className="text-xs">View Details</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>

                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7"
                                      onClick={(e) => e.stopPropagation()}
                                      disabled={deletingId === agent.id}
                                    >
                                      {deletingId === agent.id
                                        ? <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                        : <Trash2 className="h-3.5 w-3.5 text-gray-500" />
                                      }
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete Agent</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to delete <strong>{agent.name}</strong>?
                                        This will permanently remove the agent and all associated data.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        className="bg-red-600 hover:bg-red-700"
                                        onClick={(e) => handleDelete(agent.id, e)}
                                      >
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>

                              </TooltipTrigger>
                              <TooltipContent side="left" className="text-xs">
                                {confirmDelete === agent.id ? 'Click again to confirm' : 'Delete Agent'}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}