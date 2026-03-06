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
import { Progress } from "@/components/ui/progress";
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
    Activity
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

    // Load agent detail
    const loadAgentDetail = async () => {
        setLoading(true);
        setError(null);

        try {
            // LANGSUNG PAKE API.GETAGENT (YANG UDAH DI SET FALSE = JWT)
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
        if (agentId) {
            loadAgentDetail();
        }
    }, [agentId]);

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleString('id-ID', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    const getStatusColor = (status) => {
        const statusLower = status?.toLowerCase();
        if (statusLower === 'online' || statusLower === 'ready') return 'bg-gray-900';
        if (statusLower === 'offline') return 'bg-gray-400';
        if (statusLower === 'error') return 'bg-red-500';
        if (statusLower === 'paused') return 'bg-gray-500';
        return 'bg-gray-300';
    };

    const getStatusText = (status) => {
        const statusLower = status?.toLowerCase();
        if (statusLower === 'online' || statusLower === 'ready') return 'Online';
        if (statusLower === 'offline') return 'Offline';
        if (statusLower === 'error') return 'Error';
        if (statusLower === 'paused') return 'Paused';
        return status || 'Unknown';
    };

    // Printer Card Component
    const PrinterCard = ({ printer }) => {
        const hasInkData = printer.inkLevels && Object.keys(printer.inkLevels).length > 0;
        const isOnline = printer.status === 'ready' || printer.status === 'online';

        return (
            <Card className="border border-gray-200 hover:border-gray-300 transition-colors">
                <CardContent className="p-4">
                    {/* Printer Header - SAMA */}
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
                                        <span className="text-xs text-gray-500">
                                            {getStatusText(printer.status)}
                                        </span>
                                    </div>
                                    {printer.isNetwork && (
                                        <Badge variant="outline" className="text-[10px] h-4 px-1.5 gap-0.5">
                                            <Wifi className="h-2.5 w-2.5" />
                                            Network
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

                        {/* Ink Alert */}
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

                    {/* Printer Stats - SAMA */}
                    <div className="grid grid-cols-3 gap-2 mb-3 text-xs">
                        <div className="bg-gray-50 rounded p-2 text-center">
                            <FileText className="h-3.5 w-3.5 text-gray-400 mx-auto mb-1" />
                            <span className="text-gray-700 font-medium">{printer.pagesToday || 0}</span>
                            <span className="text-gray-500 ml-1">today</span>
                        </div>
                        <div className="bg-gray-50 rounded p-2 text-center">
                            <Activity className="h-3.5 w-3.5 text-gray-400 mx-auto mb-1" />
                            <span className="text-gray-700 font-medium">{printer.totalPages || 0}</span>
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

                    {/* IP Address */}
                    {printer.ipAddress && (
                        <div className="flex items-center gap-1.5 mb-3 text-xs">
                            <Network className="h-3 w-3 text-gray-400" />
                            <span className="text-gray-600 font-mono text-[10px]">{printer.ipAddress}</span>
                        </div>
                    )}

                    {hasInkData && (
                        <div className="space-y-2 pt-2 border-t border-gray-100 mt-2">
                            <div className="flex items-center gap-1.5 mb-2">
                                <HardDrive className="h-3.5 w-3.5 text-gray-500" />
                                <span className="text-xs font-medium text-gray-700">Ink Levels</span>
                            </div>
                            {Object.entries(printer.inkLevels).map(([color, level]) => {
                                const colorName = color.charAt(0).toUpperCase() + color.slice(1);
                                const isLow = level < 20;
                                const isCritical = level < 10;

                                return (
                                    <Fragment key={`${printer.id}-${color}`}>
                                        <div key={color} className="space-y-1">
                                            <div className="flex justify-between text-xs">
                                                <span className="text-gray-600">{colorName}</span>
                                                <span className={`font-medium ${isCritical ? 'text-red-600' :
                                                    isLow ? 'text-orange-600' :
                                                        'text-gray-700'
                                                    }`}>
                                                    {level}%
                                                </span>
                                            </div>
                                            <Progress
                                                value={level}
                                                className={`
                                            h-1.5 bg-gray-100
                                            ${isCritical ? '[&>div]:bg-red-600' : ''}
                                            ${isLow && !isCritical ? '[&>div]:bg-orange-500' : ''}
                                            ${!isLow && !isCritical ? '[&>div]:bg-green-600' : ''}
                                        `}
                                            />
                                        </div>
                                    </Fragment>
                                );
                            })}
                        </div>
                    )}

                    {/* No Ink Data */}
                    {!hasInkData && (
                        <div className="text-center py-2">
                            <span className="text-[10px] text-gray-400">
                                Ink monitoring not available
                            </span>
                        </div>
                    )}
                </CardContent>
            </Card>
        );
    };

    if (loading) {
        return (
            <div className="p-6 max-w-7xl mx-auto">
                <div className="flex items-center gap-4 mb-6">
                    <Button variant="ghost" size="sm" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4 mr-1" />
                        Back
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

    if (error || !agent) {
        return (
            <div className="p-6 max-w-7xl mx-auto">
                <Button variant="ghost" size="sm" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Back
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

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4 mr-1" />
                        Back
                    </Button>
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-900">{agent.name}</h1>
                        <p className="text-sm text-gray-500 mt-1">{agent.hostname}</p>
                    </div>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={loadAgentDetail}
                    disabled={loading}
                >
                    Refresh
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Agent Info */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Status Card */}
                    <Card className="border border-gray-200">
                        <CardHeader className="border-b border-gray-100 pb-3">
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                <Activity className="h-4 w-4 text-gray-500" />
                                Status
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">Status</span>
                                    <div className="flex items-center gap-2">
                                        <div className={`h-2 w-2 rounded-full ${getStatusColor(agent.status)}`} />
                                        <span className="text-sm font-medium text-gray-900">
                                            {getStatusText(agent.status)}
                                        </span>
                                    </div>
                                </div>
                                <Separator />
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">Last Seen</span>
                                    <span className="text-sm text-gray-900">
                                        {formatDate(agent.lastSeen)}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">Registered</span>
                                    <span className="text-sm text-gray-900">
                                        {formatDate(agent.registeredAt)}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Company Info Card */}
                    <Card className="border border-gray-200">
                        <CardHeader className="border-b border-gray-100 pb-3">
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                <Building2 className="h-4 w-4 text-gray-500" />
                                Company Information
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

                    {/* System Info Card */}
                    <Card className="border border-gray-200">
                        <CardHeader className="border-b border-gray-100 pb-3">
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                <Server className="h-4 w-4 text-gray-500" />
                                System Information
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

                    {/* Agent ID Card */}
                    <Card className="border border-gray-200 bg-gray-50">
                        <CardContent className="p-4">
                            <p className="text-xs text-gray-500 mb-1">Agent ID</p>
                            <p className="text-xs font-mono text-gray-900 break-all">{agent.id}</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column - Printers */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="border border-gray-200">
                        <CardHeader className="border-b border-gray-100 pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-medium flex items-center gap-2">
                                    <Printer className="h-4 w-4 text-gray-500" />
                                    Connected Printers
                                    <Badge variant="secondary" className="ml-2 text-xs">
                                        {printers.length}
                                    </Badge>
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