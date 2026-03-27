"use client";

import { useEffect, useState, Fragment } from "react";
import { useParams, useRouter } from "next/navigation";
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
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    ArrowLeft,
    Monitor,
    Building2,
    Printer,
    Wifi,
    Clock,
    Calendar,
    HardDrive,
    AlertCircle,
    FileText,
    MapPin,
    Server,
    Cpu,
    Network,
    Activity,
    Palette,
    ScanLine,
} from "lucide-react";
import { api } from "@/services/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

export default function AgentDetailPage() {
    const params = useParams();
    const router = useRouter();
    const agentId = params.id;

    const [agent, setAgent] = useState(null);
    const [printers, setPrinters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const loadAgentDetail = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await api.getAgent(agentId);
            console.log('✅ Agent detail loaded:', data.agent?.name);
            setAgent(data.agent);
            setPrinters(data.printers || []);
        } catch (error) {
            console.error('❌ Failed to load agent detail:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (agentId) loadAgentDetail();
    }, [agentId]);

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleString('id-ID', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit'
        });
    };

    const getStatusColor = (status) => {
        const s = status?.toLowerCase();
        if (s === 'online' || s === 'ready') return 'bg-gray-900';
        if (s === 'offline') return 'bg-gray-400';
        if (s === 'error') return 'bg-red-500';
        if (s === 'paused') return 'bg-gray-500';
        return 'bg-gray-300';
    };

    const getStatusText = (status) => {
        const s = status?.toLowerCase();
        if (s === 'online' || s === 'ready') return 'Online';
        if (s === 'offline') return 'Offline';
        if (s === 'error') return 'Error';
        if (s === 'paused') return 'Paused';
        return status || 'Unknown';
    };

    // ─── Printer Card ─────────────────────────────────────────────────────────
    const PrinterCard = ({ printer }) => {
        const hasInkData = printer.inkLevels && Object.keys(printer.inkLevels).length > 0;
        const isOnline = printer.status === 'ready' || printer.status === 'online';

        // Normalize field names (camelCase from new API, snake_case fallback)
        const pagesToday = printer.pagesToday ?? printer.pages_today ?? 0;
        const totalPages = printer.totalPages ?? printer.total_pages ?? 0;
        const colorPagesToday = printer.colorPagesToday ?? printer.color_pages_today ?? 0;
        const bwPagesToday = printer.bwPagesToday ?? printer.bw_pages_today ?? 0;
        const colorPagesTotal = printer.colorPagesTotal ?? printer.color_pages_total ?? 0;
        const bwPagesTotal = printer.bwPagesTotal ?? printer.bw_pages_total ?? 0;

        // Ratios
        const colorRatioToday = pagesToday > 0 ? Math.round((colorPagesToday / pagesToday) * 100) : 0;
        const bwRatioToday = pagesToday > 0 ? 100 - colorRatioToday : 0;
        const colorRatioTotal = totalPages > 0 ? Math.round((colorPagesTotal / totalPages) * 100) : 0;
        const bwRatioTotal = totalPages > 0 ? 100 - colorRatioTotal : 0;

        const hasColorData = colorPagesToday > 0 || bwPagesToday > 0 || colorPagesTotal > 0 || bwPagesTotal > 0;

        return (
            <Card className="border border-gray-200 hover:border-gray-300 transition-colors">
                <CardContent className="p-4">

                    {/* ── Header ── */}
                    <div className="flex items-start justify-between mb-3">
                        <div className="flex items-start gap-3">
                            <div className={`h-8 w-8 rounded-full ${isOnline ? 'bg-gray-100' : 'bg-gray-50'} flex items-center justify-center`}>
                                <Printer className={`h-4 w-4 ${isOnline ? 'text-gray-700' : 'text-gray-400'}`} />
                            </div>
                            <div>
                                <h4 className="text-sm font-medium text-gray-900">
                                    {printer.displayName || printer.name}
                                </h4>
                                <div className="flex items-center gap-2 mt-1">
                                    <div className="flex items-center gap-1">
                                        <div className={`h-1.5 w-1.5 rounded-full ${getStatusColor(printer.status)}`} />
                                        <span className="text-xs text-gray-500">{getStatusText(printer.status)}</span>
                                    </div>
                                    {printer.isNetwork && (
                                        <Badge variant="outline" className="text-[10px] h-4 px-1.5 gap-0.5">
                                            <Wifi className="h-2.5 w-2.5" />Network
                                        </Badge>
                                    )}
                                    {printer.vendor && (
                                        <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                                            {printer.vendor}
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </div>
                        {printer.hasCriticalInk && (
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger>
                                        <AlertCircle className="h-4 w-4 text-gray-600" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p className="text-xs">Critical ink level</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        )}
                    </div>

                    {/* ── Stats Row ── */}
                    <div className="grid grid-cols-3 gap-2 mb-3 text-xs">
                        <div className="bg-gray-50 rounded p-2 text-center">
                            <FileText className="h-3.5 w-3.5 text-gray-400 mx-auto mb-1" />
                            <span className="text-gray-700 font-medium">{pagesToday.toLocaleString()}</span>
                            <span className="text-gray-500 ml-1">today</span>
                        </div>
                        <div className="bg-gray-50 rounded p-2 text-center">
                            <Activity className="h-3.5 w-3.5 text-gray-400 mx-auto mb-1" />
                            <span className="text-gray-700 font-medium">{totalPages.toLocaleString()}</span>
                            <span className="text-gray-500 ml-1">total</span>
                        </div>
                        <div className="bg-gray-50 rounded p-2 text-center">
                            <Clock className="h-3.5 w-3.5 text-gray-400 mx-auto mb-1" />
                            <span className="text-gray-700 font-medium">
                                {printer.lastPrintTime
                                    ? new Date(printer.lastPrintTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                    : 'Never'}
                            </span>
                        </div>
                    </div>

                    {/* ── IP Address ── */}
                    {printer.ipAddress && (
                        <div className="flex items-center gap-1.5 mb-3 text-xs">
                            <Network className="h-3 w-3 text-gray-400" />
                            <span className="text-gray-600 font-mono text-[10px]">{printer.ipAddress}</span>
                        </div>
                    )}

                    {/* ── Color vs B&W Breakdown ── */}
                    {hasColorData && (
                        <div className="border-t border-gray-100 mt-2 pt-3 space-y-3">
                            <div className="flex items-center gap-1.5">
                                <Palette className="h-3.5 w-3.5 text-gray-500" />
                                <span className="text-xs font-medium text-gray-700">Color vs B&W</span>
                            </div>

                            {/* Today breakdown */}
                            {pagesToday > 0 && (
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between text-[10px] text-gray-500">
                                        <span className="font-medium text-gray-600">Today</span>
                                        <span>{pagesToday.toLocaleString()} pages</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-1.5">
                                        <div className="flex items-center gap-1.5 bg-indigo-50 rounded px-2 py-1.5">
                                            <Palette className="h-3 w-3 text-indigo-400 flex-shrink-0" />
                                            <div>
                                                <div className="text-xs font-semibold text-indigo-700">{colorPagesToday.toLocaleString()}</div>
                                                <div className="text-[10px] text-indigo-400">Color {colorRatioToday}%</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1.5 bg-gray-50 rounded px-2 py-1.5">
                                            <ScanLine className="h-3 w-3 text-gray-400 flex-shrink-0" />
                                            <div>
                                                <div className="text-xs font-semibold text-gray-700">{bwPagesToday.toLocaleString()}</div>
                                                <div className="text-[10px] text-gray-400">B&W {bwRatioToday}%</div>
                                            </div>
                                        </div>
                                    </div>
                                    {/* Ratio bar */}
                                    <div className="h-1.5 w-full rounded-full overflow-hidden bg-gray-100 flex">
                                        <div style={{ width: `${colorRatioToday}%`, backgroundColor: "#6366f1", transition: "width 0.4s ease" }} className="h-full" />
                                        <div style={{ width: `${bwRatioToday}%`, backgroundColor: "#9ca3af", transition: "width 0.4s ease" }} className="h-full" />
                                    </div>
                                </div>
                            )}

                            {/* Lifetime breakdown */}
                            {totalPages > 0 && (
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between text-[10px] text-gray-500">
                                        <span className="font-medium text-gray-600">Lifetime</span>
                                        <span>{totalPages.toLocaleString()} pages</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-1.5">
                                        <div className="flex items-center gap-1.5 bg-indigo-50 rounded px-2 py-1.5">
                                            <Palette className="h-3 w-3 text-indigo-400 flex-shrink-0" />
                                            <div>
                                                <div className="text-xs font-semibold text-indigo-700">{colorPagesTotal.toLocaleString()}</div>
                                                <div className="text-[10px] text-indigo-400">Color {colorRatioTotal}%</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1.5 bg-gray-50 rounded px-2 py-1.5">
                                            <ScanLine className="h-3 w-3 text-gray-400 flex-shrink-0" />
                                            <div>
                                                <div className="text-xs font-semibold text-gray-700">{bwPagesTotal.toLocaleString()}</div>
                                                <div className="text-[10px] text-gray-400">B&W {bwRatioTotal}%</div>
                                            </div>
                                        </div>
                                    </div>
                                    {/* Ratio bar */}
                                    <div className="h-1.5 w-full rounded-full overflow-hidden bg-gray-100 flex">
                                        <div style={{ width: `${colorRatioTotal}%`, backgroundColor: "#6366f1", transition: "width 0.4s ease" }} className="h-full" />
                                        <div style={{ width: `${bwRatioTotal}%`, backgroundColor: "#9ca3af", transition: "width 0.4s ease" }} className="h-full" />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── Ink Levels ── */}
                    {hasInkData && (
                        <div className="space-y-2 pt-2 border-t border-gray-100 mt-3">
                            <div className="flex items-center gap-1.5 mb-2">
                                <HardDrive className="h-3.5 w-3.5 text-gray-500" />
                                <span className="text-xs font-medium text-gray-700">Ink Levels</span>
                            </div>
                            {Object.entries(printer.inkLevels).map(([color, level]) => {
                                const colorName = color.charAt(0).toUpperCase() + color.slice(1);
                                const isLow = level < 20;
                                const isCritical = level < 10;
                                const inkColorHex = {
                                    black: "#1a1a1a", cyan: "#06b6d4", magenta: "#ec4899",
                                    yellow: "#eab308", photoBlack: "#4b5563", gray: "#9ca3af",
                                }[color] || "#6b7280";
                                const barColor = isCritical ? "#dc2626" : isLow ? "#f97316" : inkColorHex;

                                return (
                                    <div key={color} className="space-y-1">
                                        <div className="flex justify-between text-xs">
                                            <div className="flex items-center gap-1.5">
                                                <span className="inline-block h-2 w-2 rounded-full flex-shrink-0"
                                                    style={{ backgroundColor: inkColorHex }} />
                                                <span className="text-gray-600">{colorName}</span>
                                            </div>
                                            <span className="font-medium"
                                                style={{ color: isCritical ? "#dc2626" : isLow ? "#f97316" : "#374151" }}>
                                                {level}%
                                            </span>
                                        </div>
                                        <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                                            <div style={{
                                                width: `${level}%`, backgroundColor: barColor,
                                                height: "100%", borderRadius: "9999px", transition: "width 0.3s ease"
                                            }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {!hasInkData && (
                        <div className="text-center py-2 mt-1">
                            <span className="text-[10px] text-gray-400">Ink monitoring not available</span>
                        </div>
                    )}
                </CardContent>
            </Card>
        );
    };

    // ─── Loading State ────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="p-6 max-w-7xl mx-auto">
                <div className="flex items-center gap-4 mb-6">
                    <Button variant="ghost" size="sm" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4 mr-1" />Back
                    </Button>
                    <div className="h-8 w-32 bg-gray-200 animate-pulse rounded" />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1">
                        <div className="h-96 bg-gray-100 animate-pulse rounded-lg" />
                    </div>
                    <div className="lg:col-span-2 space-y-4">
                        <div className="h-48 bg-gray-100 animate-pulse rounded-lg" />
                        <div className="h-48 bg-gray-100 animate-pulse rounded-lg" />
                    </div>
                </div>
            </div>
        );
    }

    // ─── Error State ──────────────────────────────────────────────────────────
    if (error || !agent) {
        return (
            <div className="p-6 max-w-7xl mx-auto">
                <Button variant="ghost" size="sm" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4 mr-1" />Back
                </Button>
                <Card className="mt-6 border border-gray-200">
                    <CardContent className="p-12 text-center">
                        <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Agent Not Found</h3>
                        <p className="text-sm text-gray-500">
                            {error || 'The agent you are looking for does not exist or has been removed.'}
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // ─── Main Render ──────────────────────────────────────────────────────────
    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4 mr-1" />Back
                    </Button>
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-900">{agent.name}</h1>
                        <p className="text-sm text-gray-500 mt-1">{agent.hostname}</p>
                    </div>
                </div>
                <Button variant="outline" size="sm" onClick={loadAgentDetail} disabled={loading}>
                    Refresh
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* ── Left Column ── */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Status Card */}
                    <Card className="border border-gray-200">
                        <CardHeader className="border-b border-gray-100 pb-3">
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                <Activity className="h-4 w-4 text-gray-500" />Status
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">Status</span>
                                    <div className="flex items-center gap-2">
                                        <div className={`h-2 w-2 rounded-full ${getStatusColor(agent.status)}`} />
                                        <span className="text-sm font-medium text-gray-900">{getStatusText(agent.status)}</span>
                                    </div>
                                </div>
                                <Separator />
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">Last Seen</span>
                                    <span className="text-sm text-gray-900">{formatDate(agent.lastSeen)}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">Registered</span>
                                    <span className="text-sm text-gray-900">{formatDate(agent.registeredAt)}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Company Info */}
                    <Card className="border border-gray-200">
                        <CardHeader className="border-b border-gray-100 pb-3">
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                <Building2 className="h-4 w-4 text-gray-500" />Company Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4">
                            <div className="space-y-4">
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">Company</p>
                                    <p className="text-sm font-medium text-gray-900">{agent.company}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">Department</p>
                                    <p className="text-sm text-gray-900">{agent.department}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">Contact Person</p>
                                    <p className="text-sm text-gray-900">{agent.contactPerson}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* System Info */}
                    <Card className="border border-gray-200">
                        <CardHeader className="border-b border-gray-100 pb-3">
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                <Server className="h-4 w-4 text-gray-500" />System Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4">
                            <div className="space-y-4">
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">Platform</p>
                                    <p className="text-sm text-gray-900">{agent.platform}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">IP Address</p>
                                    <p className="text-sm font-mono text-gray-900">{agent.ip}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">MAC Address</p>
                                    <p className="text-sm font-mono text-gray-900">{agent.macAddress}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Agent ID */}
                    <Card className="border border-gray-200 bg-gray-50">
                        <CardContent className="p-4">
                            <p className="text-xs text-gray-500 mb-1">Agent ID</p>
                            <p className="text-xs font-mono text-gray-900 break-all">{agent.id}</p>
                        </CardContent>
                    </Card>
                </div>

                {/* ── Right Column — Printers ── */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="border border-gray-200">
                        <CardHeader className="border-b border-gray-100 pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-medium flex items-center gap-2">
                                    <Printer className="h-4 w-4 text-gray-500" />
                                    Connected Printers
                                    <Badge variant="secondary" className="ml-2 text-xs">{printers.length}</Badge>
                                </CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-4">
                            {printers.length === 0 ? (
                                <div className="text-center py-8">
                                    <Printer className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                                    <p className="text-sm text-gray-500">No printers connected to this agent</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-4">
                                    {printers.map((printer, index) => (
                                        <PrinterCard key={printer.id || printer.name || index} printer={printer} />
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}