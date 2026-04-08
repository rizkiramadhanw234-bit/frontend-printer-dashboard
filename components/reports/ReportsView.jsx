"use client";

import React, { useState, useEffect } from "react";
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    CartesianGrid, Legend
} from "recharts";
import {
    Calendar, FileText, Download, ChevronLeft, ChevronRight,
    Printer, Users, TrendingUp, AlertCircle, BarChart3, FileDown,
    Palette, ScanLine
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useReportStore } from "@/store/report.store";
import { useAppStore } from "@/store/app.store";
import { downloadDailyPDF, downloadMonthlyPDF } from "@/components/ReportPDF";

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, color = "gray" }) {
    const colors = {
        blue: "bg-blue-50   text-blue-700   border-blue-100",
        green: "bg-green-50  text-green-700  border-green-100",
        orange: "bg-orange-50 text-orange-700 border-orange-100",
        purple: "bg-purple-50 text-purple-700 border-purple-100",
        indigo: "bg-indigo-50 text-indigo-700 border-indigo-100",
        gray: "bg-gray-50   text-gray-700   border-gray-100",
    };
    return (
        <div className={`rounded-lg border p-4 ${colors[color]}`}>
            <div className="text-xs font-medium uppercase tracking-wide opacity-70">{label}</div>
            <div className="text-2xl font-bold mt-1">{value ?? "-"}</div>
            {sub && <div className="text-xs opacity-60 mt-0.5">{sub}</div>}
        </div>
    );
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm">
            <p className="font-medium text-gray-900 mb-2">{label}</p>
            {payload.map((p, i) => (
                <p key={i} className="text-xs flex items-center gap-1.5">
                    <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: p.fill }} />
                    <span style={{ color: p.fill }}>{p.name}:</span>
                    <span className="font-semibold text-gray-800">{Number(p.value).toLocaleString()}</span>
                </p>
            ))}
            {payload.length >= 2 && (
                <p className="text-xs text-gray-400 border-t mt-1 pt-1">
                    Total: {payload.reduce((s, p) => s + p.value, 0).toLocaleString()}
                </p>
            )}
        </div>
    );
}

// ─── Color vs BW Summary Bar ──────────────────────────────────────────────────
function ColorBwSummary({ colorPages, bwPages, label = "Breakdown" }) {
    const total = (colorPages || 0) + (bwPages || 0);
    const colorRatio = total > 0 ? Math.round((colorPages / total) * 100) : 0;
    const bwRatio = total > 0 ? 100 - colorRatio : 0;

    return (
        <div className="bg-white border rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700">{label}</span>
                <span className="text-xs text-gray-400">{total.toLocaleString()} pages</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 bg-indigo-50 rounded-lg px-3 py-2">
                    <Palette className="h-4 w-4 text-indigo-500 flex-shrink-0" />
                    <div>
                        <div className="text-base font-bold text-indigo-700">{(colorPages || 0).toLocaleString()}</div>
                        <div className="text-xs text-indigo-400">Color — {colorRatio}%</div>
                    </div>
                </div>
                <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                    <ScanLine className="h-4 w-4 text-gray-500 flex-shrink-0" />
                    <div>
                        <div className="text-base font-bold text-gray-700">{(bwPages || 0).toLocaleString()}</div>
                        <div className="text-xs text-gray-400">B&W — {bwRatio}%</div>
                    </div>
                </div>
            </div>
            {total > 0 && (
                <div className="space-y-1">
                    <div className="h-2.5 w-full rounded-full overflow-hidden bg-gray-100 flex">
                        <div style={{ width: `${colorRatio}%`, backgroundColor: "#6366f1", transition: "width 0.5s ease" }} className="h-full" />
                        <div style={{ width: `${bwRatio}%`, backgroundColor: "#d1d5db", transition: "width 0.5s ease" }} className="h-full" />
                    </div>
                    <div className="flex items-center gap-4 text-[10px] text-gray-400">
                        <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-indigo-400" />Color</span>
                        <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-gray-300" />B&W</span>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getDatesBetween(start, end) {
    const dates = [];
    const cur = new Date(start);
    const last = new Date(end);
    while (cur <= last) { dates.push(cur.toISOString().split("T")[0]); cur.setDate(cur.getDate() + 1); }
    return dates;
}

// ─── DAILY REPORT ─────────────────────────────────────────────────────────────
function DailyReportView({ agents }) {
    const { fetchDailyReport, dailyReport, isLoading, error } = useReportStore();

    const today = new Date().toISOString().split("T")[0];
    const defaultStart = (() => { const d = new Date(); d.setDate(d.getDate() - 6); return d.toISOString().split("T")[0]; })();

    const [mode, setMode] = useState("range");
    const [selectedDate, setSelectedDate] = useState(today);
    const [startDate, setStartDate] = useState(defaultStart);
    const [endDate, setEndDate] = useState(today);
    const [appliedStart, setAppliedStart] = useState(defaultStart);
    const [appliedEnd, setAppliedEnd] = useState(today);
    const [selectedAgentId, setSelectedAgentId] = useState("");
    const [isExporting, setIsExporting] = useState(false);
    const [rangeReports, setRangeReports] = useState([]);
    const [rangeLoading, setRangeLoading] = useState(false);
    const [rangeSummary, setRangeSummary] = useState(null);
    const [exportScope, setExportScope] = useState("global"); // "global" | "per-agent"

    useEffect(() => {
        if (mode === "single") fetchDailyReport({ date: selectedDate, agentId: selectedAgentId || undefined });
    }, [selectedDate, selectedAgentId, mode]);

    const handleApplyRange = async () => {
        if (!appliedStart || !appliedEnd || appliedStart > appliedEnd) return;
        setRangeLoading(true);
        setRangeSummary(null);
        const dates = getDatesBetween(appliedStart, appliedEnd);
        const fetchFn = useReportStore.getState().fetchDailyReport;
        const responses = await Promise.allSettled(
            dates.map((date) => fetchFn({ date, agentId: selectedAgentId || undefined }))
        );
        const normalized = responses.map((res, i) => {
            const date = dates[i];
            if (res.status === "rejected" || !res.value)
                return { date, totalPages: 0, colorPages: 0, bwPages: 0, agentCount: 0, printerCount: 0 };
            const v = res.value;
            return {
                date,
                totalPages: parseInt(v.totalPages || 0),
                colorPages: parseInt(v.totalColorPages || v.colorPages || 0),
                bwPages: parseInt(v.totalBwPages || v.bwPages || 0),
                agentCount: v.agentCount || 0,
                printerCount: v.printerCount || 0,
            };
        });
        const totalPages = normalized.reduce((s, r) => s + r.totalPages, 0);
        const colorPages = normalized.reduce((s, r) => s + r.colorPages, 0);
        const bwPages = normalized.reduce((s, r) => s + r.bwPages, 0);
        const daysWithData = normalized.filter((r) => r.totalPages > 0).length;
        const pagesArr = normalized.map((r) => r.totalPages);
        setRangeReports(normalized);
        setRangeSummary({
            totalPages, colorPages, bwPages,
            averagePages: daysWithData ? Math.round(totalPages / daysWithData) : 0,
            maxPages: Math.max(...pagesArr, 0),
            minPages: daysWithData ? Math.min(...pagesArr.filter((v) => v > 0)) : 0,
            daysWithData,
            totalDays: dates.length,
        });
        setRangeLoading(false);
    };

    useEffect(() => { if (mode === "range") handleApplyRange(); }, [mode, selectedAgentId]);

    const handleExport = async () => {
        setIsExporting(true);
        try {
            const shouldUseAgent = exportScope === "per-agent" && selectedAgentId;
            const targetAgent = shouldUseAgent
                ? agents.find((a) => String(a.id) === String(selectedAgentId))
                : null;
            const agentName = targetAgent?.name;
            const agentHostname = targetAgent?.hostname;

            if (mode === "range") {
                await downloadDailyPDF({
                    mode: "range",
                    report: rangeReports,
                    summary: rangeSummary,
                    startDate: appliedStart,
                    endDate: appliedEnd,
                    agentName,
                    agentHostname,
                });
            } else {
                await downloadDailyPDF({
                    mode: "single",
                    report: dailyReport,
                    date: selectedDate,
                    agentName,
                    agentHostname,
                });
            }
        } finally {
            setIsExporting(false);
        }
    };

    const byPrinter = dailyReport?.byPrinter || [];
    const byAgent = dailyReport?.byAgent || [];
    const totalPagesSingle = Number(dailyReport?.totalPages) || 0;
    const colorPagesSingle = Number(dailyReport?.totalColorPages || dailyReport?.colorPages) || 0;
    const bwPagesSingle = Number(dailyReport?.totalBwPages || dailyReport?.bwPages) || 0;

    const chartData = rangeReports.map((r) => ({
        date: new Date(r.date).toLocaleDateString("id-ID", { day: "numeric", month: "short" }),
        color: r.colorPages,
        bw: r.bwPages,
        total: r.totalPages,
    }));

    const showLoading = mode === "range" ? rangeLoading : isLoading;

    return (
        <div className="space-y-4">
            {/* Controls */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="flex bg-gray-100 p-1 rounded-lg">
                    {["single", "range"].map((m) => (
                        <button key={m} onClick={() => setMode(m)}
                            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${mode === m ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                            {m === "single" ? "Single Date" : "Date Range"}
                        </button>
                    ))}
                </div>

                {mode === "single" && (
                    <div className="flex items-center gap-2 bg-white border rounded-lg px-3 py-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <input type="date" value={selectedDate} max={today}
                            onChange={(e) => setSelectedDate(e.target.value)} className="text-sm outline-none bg-transparent" />
                    </div>
                )}

                {mode === "range" && (
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2 bg-white border rounded-lg px-3 py-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <input type="date" value={startDate} max={endDate}
                                onChange={(e) => setStartDate(e.target.value)} className="text-sm outline-none bg-transparent" />
                        </div>
                        <span className="text-gray-400 text-sm">–</span>
                        <div className="flex items-center gap-2 bg-white border rounded-lg px-3 py-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <input type="date" value={endDate} min={startDate} max={today}
                                onChange={(e) => setEndDate(e.target.value)} className="text-sm outline-none bg-transparent" />
                        </div>
                        <Button onClick={() => { setAppliedStart(startDate); setAppliedEnd(endDate); setTimeout(handleApplyRange, 0); }}
                            size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                            Apply
                        </Button>
                    </div>
                )}

                <select value={selectedAgentId} onChange={(e) => setSelectedAgentId(e.target.value)}
                    className="text-sm border rounded-lg px-3 py-2 bg-white outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">All Agents</option>
                    {agents.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>

                {/* Export Scope + Button */}
                <div className="flex items-center gap-2 ml-auto">
                    <div className="flex bg-gray-100 rounded-lg p-0.5 text-xs">
                        <button
                            onClick={() => setExportScope("global")}
                            className={`px-2.5 py-1 rounded-md transition-all ${exportScope === "global"
                                    ? "bg-white text-gray-900 shadow-sm font-medium"
                                    : "text-gray-500"
                                }`}
                        >
                            Global
                        </button>
                        <button
                            onClick={() => setExportScope("per-agent")}
                            disabled={!selectedAgentId}
                            className={`px-2.5 py-1 rounded-md transition-all ${exportScope === "per-agent" && selectedAgentId
                                    ? "bg-white text-gray-900 shadow-sm font-medium"
                                    : "text-gray-500 disabled:opacity-40"
                                }`}
                        >
                            Per Agent
                        </button>
                    </div>
                    <Button
                        onClick={handleExport}
                        disabled={isExporting || showLoading || (mode === "single" ? !dailyReport : !rangeSummary)}
                        className="gap-2 bg-gray-900 hover:bg-gray-700 text-white"
                        size="sm"
                    >
                        <FileDown className="h-4 w-4" />
                        {isExporting ? "Exporting..." : "Export PDF"}
                    </Button>
                </div>
            </div>

            {/* Loading */}
            {showLoading && (
                <div className="flex items-center justify-center py-16">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                </div>
            )}

            {/* Error */}
            {error && !showLoading && mode === "single" && (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-lg p-4 text-sm">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />{error}
                </div>
            )}

            {/* ── RANGE MODE ── */}
            {!showLoading && mode === "range" && rangeSummary && (
                <div className="space-y-5 bg-white p-1 rounded-xl">
                    {/* Header */}
                    <div className="bg-gray-900 text-white rounded-xl p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-1">Daily Report</div>
                                <div className="text-2xl font-bold">
                                    {new Date(appliedStart).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                                    {" – "}
                                    {new Date(appliedEnd).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                                </div>
                                <div className="text-xs text-gray-400 mt-1">
                                    {rangeSummary.daysWithData} of {rangeSummary.totalDays} days with activity
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-xs text-gray-400">Total Pages</div>
                                <div className="text-4xl font-black">{rangeSummary.totalPages.toLocaleString()}</div>
                            </div>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <StatCard label="Total Pages" value={rangeSummary.totalPages.toLocaleString()} />
                        <StatCard label="Avg / Day" value={rangeSummary.averagePages.toLocaleString()} sub="Pages per day" />
                        <StatCard label="Peak Day" value={rangeSummary.maxPages.toLocaleString()} sub="Highest volume" />
                        <StatCard label="Lowest Day" value={rangeSummary.minPages.toLocaleString()} sub="Lowest volume" />
                    </div>

                    {/* Color vs BW Summary */}
                    <ColorBwSummary
                        colorPages={rangeSummary.colorPages}
                        bwPages={rangeSummary.bwPages}
                        label="Color vs B&W Breakdown (Range)"
                    />

                    {/* Stacked Bar Chart */}
                    {chartData.length > 0 && (
                        <div className="bg-white border rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-4">
                                <BarChart3 className="h-4 w-4 text-gray-500" />
                                <span className="text-sm font-semibold text-gray-700">Color vs B&W Volume Trend</span>
                            </div>
                            <ResponsiveContainer width="100%" height={240}>
                                <BarChart data={chartData} barCategoryGap="30%">
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} width={40} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend
                                        wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }}
                                        formatter={(value) => value === "color" ? "Color" : "B&W"}
                                    />
                                    <Bar dataKey="color" name="color" stackId="a" fill="#6366f1" radius={[0, 0, 0, 0]}
                                        barSize={chartData.length > 20 ? 8 : 20} />
                                    <Bar dataKey="bw" name="bw" stackId="a" fill="#9ca3af" radius={[4, 4, 0, 0]}
                                        barSize={chartData.length > 20 ? 8 : 20} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                    {/* Table per day */}
                    <div className="bg-white border rounded-xl overflow-hidden">
                        <div className="px-4 py-3 border-b bg-gray-50 flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-500" />
                            <span className="text-sm font-semibold text-gray-700">Daily Breakdown</span>
                        </div>
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b">
                                    <th className="px-4 py-2 text-left  text-xs text-gray-400 font-medium">Date</th>
                                    <th className="px-4 py-2 text-right text-xs text-gray-400 font-medium">Total</th>
                                    <th className="px-4 py-2 text-right text-xs text-indigo-400 font-medium">
                                        <span className="flex items-center justify-end gap-1"><Palette className="h-3 w-3" />Color</span>
                                    </th>
                                    <th className="px-4 py-2 text-right text-xs text-gray-400 font-medium">
                                        <span className="flex items-center justify-end gap-1"><ScanLine className="h-3 w-3" />B&W</span>
                                    </th>
                                    <th className="px-4 py-2 text-right text-xs text-gray-400 font-medium">Agents</th>
                                    <th className="px-4 py-2 text-right text-xs text-gray-400 font-medium">Printers</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {rangeReports.filter((r) => r.totalPages > 0).map((r, i) => {
                                    const cRatio = r.totalPages > 0 ? Math.round((r.colorPages / r.totalPages) * 100) : 0;
                                    return (
                                        <tr key={i} className="hover:bg-gray-50">
                                            <td className="px-4 py-2.5 font-medium text-gray-800">
                                                {new Date(r.date).toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "long", year: "numeric" })}
                                            </td>
                                            <td className="px-4 py-2.5 text-right font-semibold text-blue-600">{r.totalPages.toLocaleString()}</td>
                                            <td className="px-4 py-2.5 text-right">
                                                <span className="text-indigo-600 font-medium">{r.colorPages.toLocaleString()}</span>
                                                <span className="text-xs text-gray-400 ml-1">({cRatio}%)</span>
                                            </td>
                                            <td className="px-4 py-2.5 text-right text-gray-600">{r.bwPages.toLocaleString()}</td>
                                            <td className="px-4 py-2.5 text-right text-gray-500">{r.agentCount}</td>
                                            <td className="px-4 py-2.5 text-right text-gray-500">{r.printerCount}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    <div className="text-xs text-gray-400 text-right pt-1">
                        Generated {new Date().toLocaleString("id-ID")} • Printer Dashboard
                    </div>
                </div>
            )}

            {/* ── SINGLE DAY MODE ── */}
            {!showLoading && mode === "single" && dailyReport && (
                <div className="space-y-5 bg-white p-1 rounded-xl">
                    <div className="bg-gray-900 text-white rounded-xl p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-1">Daily Print Report</div>
                                <div className="text-2xl font-bold">
                                    {new Date(selectedDate).toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-xs text-gray-400">Total Pages</div>
                                <div className="text-4xl font-black text-white">{totalPagesSingle.toLocaleString()}</div>
                            </div>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <StatCard label="Total Pages" value={totalPagesSingle.toLocaleString()} color="blue" />
                        <StatCard label="Active Agents" value={dailyReport.agentCount} color="green" />
                        <StatCard label="Active Printers" value={dailyReport.printerCount} color="orange" />
                        <StatCard label="Data Source" value={dailyReport.source} color="purple" />
                    </div>

                    {/* Color vs BW Summary */}
                    <ColorBwSummary
                        colorPages={colorPagesSingle}
                        bwPages={bwPagesSingle}
                        label="Color vs B&W Breakdown"
                    />

                    {/* By Agent */}
                    {byAgent.length > 0 && (
                        <div className="bg-white border rounded-xl overflow-hidden">
                            <div className="px-4 py-3 border-b bg-gray-50 flex items-center gap-2">
                                <Users className="h-4 w-4 text-gray-500" />
                                <span className="text-sm font-semibold text-gray-700">By Agent</span>
                            </div>
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b">
                                        <th className="px-4 py-2 text-left  text-xs text-gray-400 font-medium">Agent</th>
                                        <th className="px-4 py-2 text-right text-xs text-gray-400 font-medium">Pages</th>
                                        <th className="px-4 py-2 text-right text-xs text-indigo-400 font-medium">Color</th>
                                        <th className="px-4 py-2 text-right text-xs text-gray-400 font-medium">B&W</th>
                                        <th className="px-4 py-2 text-right text-xs text-gray-400 font-medium">Printers</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {byAgent.map((a, i) => (
                                        <tr key={i} className="hover:bg-gray-50">
                                            <td className="px-4 py-2.5 font-medium text-gray-800">
                                                {a.agentName || a.agent_name}
                                            </td>
                                            <td className="px-4 py-2.5 text-right font-semibold text-blue-600">
                                                {Number(a.pages || a.total_pages || 0).toLocaleString()}
                                            </td>
                                            <td className="px-4 py-2.5 text-right text-indigo-600">
                                                {Number(a.colorPages || a.color_pages || 0).toLocaleString()}
                                            </td>
                                            <td className="px-4 py-2.5 text-right text-gray-600">
                                                {Number(a.bwPages || a.bw_pages || 0).toLocaleString()}
                                            </td>
                                            <td className="px-4 py-2.5 text-right text-gray-500">
                                                {a.printers?.length || "-"}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* By Printer */}
                    {byPrinter.length > 0 && (
                        <div className="bg-white border rounded-xl overflow-hidden">
                            <div className="px-4 py-3 border-b bg-gray-50 flex items-center gap-2">
                                <Printer className="h-4 w-4 text-gray-500" />
                                <span className="text-sm font-semibold text-gray-700">By Printer</span>
                            </div>
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b">
                                        <th className="px-4 py-2 text-left  text-xs text-gray-400 font-medium">Printer</th>
                                        <th className="px-4 py-2 text-left  text-xs text-gray-400 font-medium">Agent</th>
                                        <th className="px-4 py-2 text-right text-xs text-gray-400 font-medium">Total</th>
                                        <th className="px-4 py-2 text-right text-xs text-indigo-400 font-medium">
                                            <span className="flex items-center justify-end gap-1"><Palette className="h-3 w-3" />Color</span>
                                        </th>
                                        <th className="px-4 py-2 text-right text-xs text-gray-400 font-medium">
                                            <span className="flex items-center justify-end gap-1"><ScanLine className="h-3 w-3" />B&W</span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {byPrinter.map((p, i) => (
                                        <tr key={i} className="hover:bg-gray-50">
                                            <td className="px-4 py-2.5 font-medium text-gray-800 max-w-[200px] truncate">
                                                {p.name || p.printer_name}
                                            </td>
                                            <td className="px-4 py-2.5 text-gray-500 text-xs">
                                                {p.agentName || p.agent_name}
                                            </td>
                                            <td className="px-4 py-2.5 text-right font-semibold text-blue-600">
                                                {Number(p.pages || p.total_pages || 0).toLocaleString()}
                                            </td>
                                            <td className="px-4 py-2.5 text-right text-indigo-600">
                                                {Number(p.colorPages || p.color_pages || 0).toLocaleString()}
                                            </td>
                                            <td className="px-4 py-2.5 text-right text-gray-600">
                                                {Number(p.bwPages || p.bw_pages || 0).toLocaleString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    <div className="text-xs text-gray-400 text-right pt-1">
                        Generated {new Date().toLocaleString("id-ID")} • Printer Dashboard
                    </div>
                </div>
            )}

            {!showLoading && !error && !dailyReport && mode === "single" && (
                <div className="text-center py-16 text-gray-400">
                    <FileText className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p>No data for this date</p>
                </div>
            )}
        </div>
    );
}

// ─── MONTHLY REPORT ───────────────────────────────────────────────────────────
function MonthlyReportView({ agents }) {
    const { fetchMonthlyReport, monthlyReport, isLoading, error } = useReportStore();

    const now = new Date();
    const [year, setYear] = useState(now.getFullYear());
    const [month, setMonth] = useState(now.getMonth() + 1);
    const [selectedAgentId, setSelectedAgentId] = useState("");
    const [isExporting, setIsExporting] = useState(false);
    const [exportScope, setExportScope] = useState("global");

    const MONTHS = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"];

    useEffect(() => {
        fetchMonthlyReport(year, month, { agentId: selectedAgentId || undefined });
    }, [year, month, selectedAgentId]);

    const handlePrevMonth = () => { if (month === 1) { setMonth(12); setYear((y) => y - 1); } else setMonth((m) => m - 1); };
    const handleNextMonth = () => {
        const isCurrent = year === now.getFullYear() && month === now.getMonth() + 1;
        if (isCurrent) return;
        if (month === 12) { setMonth(1); setYear((y) => y + 1); } else setMonth((m) => m + 1);
    };
    const handleExport = async () => {
        setIsExporting(true);
        try {
            const shouldUseAgent = exportScope === "per-agent" && selectedAgentId;
            const targetAgent = shouldUseAgent
                ? agents.find((a) => String(a.id) === String(selectedAgentId))
                : null;
            const agentName = targetAgent?.name;
            const agentHostname = targetAgent?.hostname;

            await downloadMonthlyPDF({
                report: monthlyReport,
                year,
                month,
                agentName,
                agentHostname,
            });
        } finally {
            setIsExporting(false);
        }
    };

    const summary = monthlyReport?.summary || {};
    const dailyBreakdown = monthlyReport?.dailyBreakdown || [];
    const byPrinter = monthlyReport?.byPrinter || [];
    const byAgent = monthlyReport?.byAgent || [];

    const totalPages = Number(summary.totalPages) || 0;
    const colorPagesM = Number(summary.totalColorPages || summary.colorPages) || 0;
    const bwPagesM = Number(summary.totalBwPages || summary.bwPages) || 0;

    const peakDate = summary.peakDay?.date
        ? new Date(summary.peakDay.date).toLocaleDateString("id-ID", { day: "numeric", month: "short" })
        : "-";
    const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;

    const chartData = dailyBreakdown.map((d) => ({
        date: new Date(d.print_date).toLocaleDateString("id-ID", { day: "numeric", month: "short" }),
        color: Number(d.color_pages || 0),
        bw: Number(d.bw_pages || 0),
        total: Number(d.total_pages || 0),
    }));

    return (
        <div className="space-y-4">
            {/* Controls */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1 bg-white border rounded-lg overflow-hidden">
                    <button onClick={handlePrevMonth} className="px-3 py-2 hover:bg-gray-50 transition-colors">
                        <ChevronLeft className="h-4 w-4 text-gray-500" />
                    </button>
                    <div className="px-4 py-2 text-sm font-semibold text-gray-800 min-w-[140px] text-center">
                        {MONTHS[month - 1]} {year}
                    </div>
                    <button onClick={handleNextMonth} disabled={isCurrentMonth} className="px-3 py-2 hover:bg-gray-50 disabled:opacity-30">
                        <ChevronRight className="h-4 w-4 text-gray-500" />
                    </button>
                </div>

                <div className="flex items-center gap-2 bg-white border rounded-lg px-3 py-2">
                    <span className="text-xs text-gray-400">Year</span>
                    <input type="number" value={year} min={2020} max={now.getFullYear()}
                        onChange={(e) => setYear(Number(e.target.value))}
                        className="text-sm outline-none bg-transparent w-16 font-medium" />
                </div>

                <select value={selectedAgentId} onChange={(e) => setSelectedAgentId(e.target.value)}
                    className="text-sm border rounded-lg px-3 py-2 bg-white outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">All Agents</option>
                    {agents.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>

                {/* Export Scope + Button */}
                <div className="flex items-center gap-2 ml-auto">
                    <div className="flex bg-gray-100 rounded-lg p-0.5 text-xs">
                        <button
                            onClick={() => setExportScope("global")}
                            className={`px-2.5 py-1 rounded-md transition-all ${exportScope === "global"
                                    ? "bg-white text-gray-900 shadow-sm font-medium"
                                    : "text-gray-500"
                                }`}
                        >
                            Global
                        </button>
                        <button
                            onClick={() => setExportScope("per-agent")}
                            disabled={!selectedAgentId}
                            className={`px-2.5 py-1 rounded-md transition-all ${exportScope === "per-agent" && selectedAgentId
                                    ? "bg-white text-gray-900 shadow-sm font-medium"
                                    : "text-gray-500 disabled:opacity-40"
                                }`}
                        >
                            Per Agent
                        </button>
                    </div>
                    <Button
                        onClick={handleExport}
                        disabled={isExporting || isLoading || !monthlyReport}
                        className="gap-2 bg-gray-900 hover:bg-gray-700 text-white"
                        size="sm"
                    >
                        <FileDown className="h-4 w-4" />
                        {isExporting ? "Exporting..." : "Export PDF"}
                    </Button>
                </div>
            </div>

            {isLoading && (
                <div className="flex items-center justify-center py-16">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                </div>
            )}

            {error && !isLoading && (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-lg p-4 text-sm">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />{error}
                </div>
            )}

            {!isLoading && monthlyReport && (
                <div className="space-y-5 bg-white p-1 rounded-xl">
                    {/* Header */}
                    <div className="bg-gray-900 text-white rounded-xl p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-1">Monthly Print Report</div>
                                <div className="text-2xl font-bold">{MONTHS[month - 1]} {year}</div>
                                <div className="text-xs text-gray-400 mt-1">
                                    {dailyBreakdown.length} active days • Peak: {peakDate} ({Number(summary.peakDay?.pages || 0).toLocaleString()} pages)
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-xs text-gray-400">Total Pages</div>
                                <div className="text-4xl font-black">{totalPages.toLocaleString()}</div>
                            </div>
                        </div>
                    </div>

                    {/* Stats Row */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <StatCard label="Total Pages" value={totalPages.toLocaleString()} color="blue" />
                        <StatCard label="Avg / Day" value={Math.round(summary.averageDailyPages || 0).toLocaleString()} color="green" />
                        <StatCard label="Print Jobs" value={summary.totalPrintJobs || 0} color="orange" />
                        <StatCard label="Active Printers" value={summary.activePrinters || 0} sub={`${summary.activeAgents || 0} agents`} color="purple" />
                    </div>

                    {/* Color vs BW Summary */}
                    <ColorBwSummary
                        colorPages={colorPagesM}
                        bwPages={bwPagesM}
                        label={`Color vs B&W — ${MONTHS[month - 1]} ${year}`}
                    />

                    {/* Stacked Chart */}
                    {chartData.length > 0 && (
                        <div className="bg-white border rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-4">
                                <BarChart3 className="h-4 w-4 text-gray-500" />
                                <span className="text-sm font-semibold text-gray-700">Daily Color vs B&W Volume</span>
                            </div>
                            <ResponsiveContainer width="100%" height={240}>
                                <BarChart data={chartData} barCategoryGap="30%">
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} width={40} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend
                                        wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }}
                                        formatter={(value) => value === "color" ? "Color" : "B&W"}
                                    />
                                    <Bar dataKey="color" name="color" stackId="a" fill="#6366f1" radius={[0, 0, 0, 0]} />
                                    <Bar dataKey="bw" name="bw" stackId="a" fill="#9ca3af" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                    {/* By Printer Table */}
                    {byPrinter.length > 0 && (
                        <div className="bg-white border rounded-xl overflow-hidden">
                            <div className="px-4 py-3 border-b bg-gray-50 flex items-center gap-2">
                                <Printer className="h-4 w-4 text-gray-500" />
                                <span className="text-sm font-semibold text-gray-700">By Printer</span>
                            </div>
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b">
                                        <th className="px-4 py-2 text-left  text-xs text-gray-400 font-medium">Printer</th>
                                        <th className="px-4 py-2 text-left  text-xs text-gray-400 font-medium">Vendor</th>
                                        <th className="px-4 py-2 text-left  text-xs text-gray-400 font-medium">Agent</th>
                                        <th className="px-4 py-2 text-right text-xs text-gray-400 font-medium">Jobs</th>
                                        <th className="px-4 py-2 text-right text-xs text-gray-400 font-medium">Total</th>
                                        <th className="px-4 py-2 text-right text-xs text-indigo-400 font-medium">
                                            <span className="flex items-center justify-end gap-1"><Palette className="h-3 w-3" />Color</span>
                                        </th>
                                        <th className="px-4 py-2 text-right text-xs text-gray-400 font-medium">
                                            <span className="flex items-center justify-end gap-1"><ScanLine className="h-3 w-3" />B&W</span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {byPrinter.map((p, i) => {
                                        const total = Number(p.pages || p.total_pages || 0);
                                        const color = Number(p.colorPages || p.color_pages || 0);
                                        const bw = Number(p.bwPages || p.bw_pages || 0);
                                        const cRat = total > 0 ? Math.round((color / total) * 100) : 0;
                                        return (
                                            <tr key={i} className="hover:bg-gray-50">
                                                <td className="px-4 py-2.5 font-medium text-gray-800 max-w-[180px]">
                                                    <div className="truncate">{p.name || p.display_name || p.printerName || p.printer_name}</div>
                                                </td>
                                                <td className="px-4 py-2.5">
                                                    {p.vendor && p.vendor !== "Unknown"
                                                        ? <Badge variant="outline" className="text-xs">{p.vendor}</Badge>
                                                        : <span className="text-gray-400 text-xs">-</span>}
                                                </td>
                                                <td className="px-4 py-2.5 text-gray-500 text-xs">{p.agentName || p.agent_name}</td>
                                                <td className="px-4 py-2.5 text-right text-gray-600">{p.printCount || p.print_count}</td>
                                                <td className="px-4 py-2.5 text-right font-semibold text-blue-600">{total.toLocaleString()}</td>
                                                <td className="px-4 py-2.5 text-right">
                                                    <span className="text-indigo-600 font-medium">{color.toLocaleString()}</span>
                                                    <span className="text-xs text-gray-400 ml-1">({cRat}%)</span>
                                                </td>
                                                <td className="px-4 py-2.5 text-right text-gray-600">{bw.toLocaleString()}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* By Agent Table */}
                    {byAgent.length > 0 && (
                        <div className="bg-white border rounded-xl overflow-hidden">
                            <div className="px-4 py-3 border-b bg-gray-50 flex items-center gap-2">
                                <Users className="h-4 w-4 text-gray-500" />
                                <span className="text-sm font-semibold text-gray-700">By Agent</span>
                            </div>
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b">
                                        <th className="px-4 py-2 text-left  text-xs text-gray-400 font-medium">Agent</th>
                                        <th className="px-4 py-2 text-left  text-xs text-gray-400 font-medium">Department</th>
                                        <th className="px-4 py-2 text-left  text-xs text-gray-400 font-medium">Company</th>
                                        <th className="px-4 py-2 text-right text-xs text-gray-400 font-medium">Jobs</th>
                                        <th className="px-4 py-2 text-right text-xs text-gray-400 font-medium">Total</th>
                                        <th className="px-4 py-2 text-right text-xs text-indigo-400 font-medium">Color</th>
                                        <th className="px-4 py-2 text-right text-xs text-gray-400 font-medium">B&W</th>
                                        <th className="px-4 py-2 text-right text-xs text-gray-400 font-medium">Last Print</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {byAgent.map((a, i) => (
                                        <tr key={i} className="hover:bg-gray-50">
                                            <td className="px-4 py-2.5 font-medium text-gray-800">
                                                {a.agentName || a.agent_name}
                                            </td>
                                            <td className="px-4 py-2.5 text-gray-500 text-xs">
                                                {a.departmentName || a.department_name || "-"}
                                            </td>
                                            <td className="px-4 py-2.5 text-gray-500 text-xs">
                                                {a.companyName || a.company_name || "-"}
                                            </td>
                                            <td className="px-4 py-2.5 text-right text-gray-600">
                                                {a.printCount || a.print_count}
                                            </td>
                                            <td className="px-4 py-2.5 text-right font-semibold text-blue-600">
                                                {Number(a.pages || a.total_pages || 0).toLocaleString()}
                                            </td>
                                            <td className="px-4 py-2.5 text-right text-indigo-600">
                                                {Number(a.colorPages || a.color_pages || 0).toLocaleString()}
                                            </td>
                                            <td className="px-4 py-2.5 text-right text-gray-600">
                                                {Number(a.bwPages || a.bw_pages || 0).toLocaleString()}
                                            </td>
                                            <td className="px-4 py-2.5 text-right text-xs text-gray-500">
                                                {a.lastPrint || a.last_print
                                                    ? new Date(a.lastPrint || a.last_print).toLocaleDateString("id-ID")
                                                    : "-"}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    <div className="text-xs text-gray-400 text-right pt-1">
                        Generated {new Date().toLocaleString("id-ID")} • Printer Dashboard
                    </div>
                </div>
            )}

            {!isLoading && !error && !monthlyReport && (
                <div className="text-center py-16 text-gray-400">
                    <BarChart3 className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p>No data for this period</p>
                </div>
            )}
        </div>
    );
}

// ─── MAIN EXPORT ──────────────────────────────────────────────────────────────
export default function ReportView() {
    const { agents } = useAppStore();
    const [activeReport, setActiveReport] = useState("daily");

    return (
        <div className="space-y-5">
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 w-fit">
                {[
                    { id: "daily", icon: <Calendar className="h-3.5 w-3.5" />, label: "Daily" },
                    { id: "monthly", icon: <TrendingUp className="h-3.5 w-3.5" />, label: "Monthly" },
                ].map(({ id, icon, label }) => (
                    <button key={id} onClick={() => setActiveReport(id)}
                        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeReport === id ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                        <span className="flex items-center gap-1.5">{icon}{label}</span>
                    </button>
                ))}
            </div>

            {activeReport === "daily" && <DailyReportView agents={agents} />}
            {activeReport === "monthly" && <MonthlyReportView agents={agents} />}
        </div>
    );
}