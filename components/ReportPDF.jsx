/**
 * ReportPDF.jsx
 * PDF generator using @react-pdf/renderer
 */

import React from "react";
import {
    Document,
    Page,
    Text,
    View,
    StyleSheet,
    pdf,
} from "@react-pdf/renderer";

// ─── Color Palette ─────────────────────────────────────────────────────────────
const C = {
    black: "#0f172a",
    darkBg: "#1e293b",
    white: "#ffffff",
    grayLight: "#f8fafc",
    grayBorder: "#e2e8f0",
    grayText: "#64748b",
    grayMuted: "#94a3b8",
    blue: "#2563eb",
    blueSoft: "#eff6ff",
    blueText: "#1d4ed8",
    indigo: "#6366f1",
    indigoSoft: "#eef2ff",
    indigoText: "#4338ca",
    green: "#16a34a",
    greenSoft: "#f0fdf4",
    greenText: "#15803d",
    orange: "#ea580c",
    orangeSoft: "#fff7ed",
    orangeText: "#c2410c",
    purple: "#9333ea",
    purpleSoft: "#faf5ff",
    purpleText: "#7e22ce",
};

// ─── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
    page: {
        fontFamily: "Helvetica",
        fontSize: 9,
        color: C.black,
        backgroundColor: C.white,
        padding: 32,
        paddingBottom: 48,
    },

    // Header
    header: {
        backgroundColor: C.darkBg,
        borderRadius: 8,
        padding: 20,
        marginBottom: 16,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
    },
    headerLabel: {
        fontSize: 7,
        color: C.grayMuted,
        textTransform: "uppercase",
        letterSpacing: 1.5,
        marginBottom: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontFamily: "Helvetica-Bold",
        color: C.white,
        marginBottom: 4,
    },
    headerSub: {
        fontSize: 8,
        color: C.grayMuted,
    },
    headerPagesLabel: {
        fontSize: 8,
        color: C.grayMuted,
        textAlign: "right",
        marginBottom: 2,
    },
    headerPages: {
        fontSize: 32,
        fontFamily: "Helvetica-Bold",
        color: C.white,
        textAlign: "right",
    },

    // Agent badge
    agentBadge: {
        backgroundColor: C.indigo,
        borderRadius: 4,
        paddingHorizontal: 8,
        paddingVertical: 3,
        alignSelf: "flex-start",
        marginBottom: 12,
    },
    agentBadgeText: {
        color: C.white,
        fontSize: 8,
        fontFamily: "Helvetica-Bold",
    },

    // Stat cards row
    statsRow: {
        flexDirection: "row",
        gap: 8,
        marginBottom: 12,
    },
    statCard: {
        flex: 1,
        borderRadius: 6,
        border: "1pt solid",
        padding: 10,
    },
    statLabel: {
        fontSize: 7,
        textTransform: "uppercase",
        letterSpacing: 1,
        marginBottom: 4,
        fontFamily: "Helvetica-Bold",
    },
    statValue: {
        fontSize: 16,
        fontFamily: "Helvetica-Bold",
        marginBottom: 2,
    },
    statSub: {
        fontSize: 7,
        opacity: 0.6,
    },

    // Color vs BW card
    colorBwCard: {
        backgroundColor: C.white,
        border: "1pt solid",
        borderColor: C.grayBorder,
        borderRadius: 6,
        padding: 12,
        marginBottom: 12,
    },
    colorBwHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 8,
    },
    colorBwTitle: {
        fontSize: 9,
        fontFamily: "Helvetica-Bold",
        color: C.black,
    },
    colorBwTotal: {
        fontSize: 8,
        color: C.grayText,
    },
    colorBwGrid: {
        flexDirection: "row",
        gap: 8,
        marginBottom: 8,
    },
    colorBwBox: {
        flex: 1,
        borderRadius: 4,
        padding: 8,
    },
    colorBwNum: {
        fontSize: 13,
        fontFamily: "Helvetica-Bold",
        marginBottom: 2,
    },
    colorBwSub: {
        fontSize: 7,
    },
    progressBarBg: {
        height: 6,
        backgroundColor: "#e5e7eb",
        borderRadius: 3,
        overflow: "hidden",
        marginBottom: 6,
    },
    progressBarFill: {
        height: 6,
        borderRadius: 3,
        backgroundColor: C.indigo,
    },
    progressLegend: {
        flexDirection: "row",
        gap: 12,
    },
    legendItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 3,
    },
    legendDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    legendText: {
        fontSize: 7,
        color: C.grayText,
    },

    // Section header
    sectionHeader: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: C.grayLight,
        borderTopLeftRadius: 6,
        borderTopRightRadius: 6,
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderBottom: "1pt solid",
        borderBottomColor: C.grayBorder,
    },
    sectionTitle: {
        fontSize: 9,
        fontFamily: "Helvetica-Bold",
        color: C.black,
    },

    // Table
    tableWrapper: {
        border: "1pt solid",
        borderColor: C.grayBorder,
        borderRadius: 6,
        marginBottom: 12,
        overflow: "hidden",
    },
    tableRow: {
        flexDirection: "row",
        borderBottom: "1pt solid",
        borderBottomColor: C.grayBorder,
    },
    tableRowLast: {
        flexDirection: "row",
    },
    tableHeadRow: {
        flexDirection: "row",
        backgroundColor: C.grayLight,
        borderBottom: "1pt solid",
        borderBottomColor: C.grayBorder,
    },
    th: {
        fontSize: 7,
        fontFamily: "Helvetica-Bold",
        color: C.grayText,
        textTransform: "uppercase",
        letterSpacing: 0.5,
        paddingHorizontal: 10,
        paddingVertical: 6,
    },
    thRight: {
        fontSize: 7,
        fontFamily: "Helvetica-Bold",
        color: C.grayText,
        textTransform: "uppercase",
        letterSpacing: 0.5,
        paddingHorizontal: 10,
        paddingVertical: 6,
        textAlign: "right",
    },
    td: {
        fontSize: 8,
        paddingHorizontal: 10,
        paddingVertical: 6,
        color: C.black,
    },
    tdRight: {
        fontSize: 8,
        paddingHorizontal: 10,
        paddingVertical: 6,
        textAlign: "right",
    },
    tdBold: {
        fontSize: 8,
        fontFamily: "Helvetica-Bold",
        paddingHorizontal: 10,
        paddingVertical: 6,
    },

    // Footer
    footer: {
        position: "absolute",
        bottom: 20,
        left: 32,
        right: 32,
        flexDirection: "row",
        justifyContent: "space-between",
        borderTop: "1pt solid",
        borderTopColor: C.grayBorder,
        paddingTop: 6,
    },
    footerText: {
        fontSize: 7,
        color: C.grayMuted,
    },

    // Chart
    chartWrapper: {
        border: "1pt solid",
        borderColor: C.grayBorder,
        borderRadius: 6,
        padding: 12,
        marginBottom: 12,
    },
    chartTitle: {
        fontSize: 9,
        fontFamily: "Helvetica-Bold",
        color: C.black,
        marginBottom: 10,
    },
    chartArea: {
        flexDirection: "row",
        alignItems: "flex-end",
        height: 80,
    },
    chartBarGroup: {
        flex: 1,
        alignItems: "center",
        flexDirection: "column",
        justifyContent: "flex-end",
        height: 80,
    },
    chartLabel: {
        fontSize: 6,
        color: C.grayMuted,
        textAlign: "center",
        marginTop: 3,
    },
});

// ─── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (n) => Number(n || 0).toLocaleString("id-ID");
const pct = (a, total) => total > 0 ? Math.round((a / total) * 100) : 0;
const fmtDate = (d) =>
    d
        ? new Date(d).toLocaleDateString("id-ID", {
            day: "numeric", month: "long", year: "numeric",
        })
        : "-";
const fmtShort = (d) =>
    d
        ? new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "short" })
        : "";
const nowStr = () =>
    new Date().toLocaleString("id-ID", {
        day: "numeric", month: "long", year: "numeric",
        hour: "2-digit", minute: "2-digit",
    });

const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];

// ─── Sub-components ────────────────────────────────────────────────────────────

function ColorBwBlock({ colorPages, bwPages, label }) {
    const total = (colorPages || 0) + (bwPages || 0);
    const colorRatio = pct(colorPages, total);
    const bwRatio = 100 - colorRatio;
    return (
        <View style={s.colorBwCard}>
            <View style={s.colorBwHeader}>
                <Text style={s.colorBwTitle}>{label}</Text>
                <Text style={s.colorBwTotal}>{fmt(total)} pages</Text>
            </View>
            <View style={s.colorBwGrid}>
                <View style={[s.colorBwBox, { backgroundColor: C.indigoSoft }]}>
                    <Text style={[s.colorBwNum, { color: C.indigoText }]}>{fmt(colorPages)}</Text>
                    <Text style={[s.colorBwSub, { color: C.indigo }]}>Color — {colorRatio}%</Text>
                </View>
                <View style={[s.colorBwBox, { backgroundColor: C.grayLight }]}>
                    <Text style={[s.colorBwNum, { color: C.grayText }]}>{fmt(bwPages)}</Text>
                    <Text style={[s.colorBwSub, { color: C.grayMuted }]}>B&W — {bwRatio}%</Text>
                </View>
            </View>
            {total > 0 && (
                <>
                    <View style={s.progressBarBg}>
                        <View style={[s.progressBarFill, { width: `${colorRatio}%` }]} />
                    </View>
                    <View style={s.progressLegend}>
                        <View style={s.legendItem}>
                            <View style={[s.legendDot, { backgroundColor: C.indigo }]} />
                            <Text style={s.legendText}>Color</Text>
                        </View>
                        <View style={s.legendItem}>
                            <View style={[s.legendDot, { backgroundColor: "#d1d5db" }]} />
                            <Text style={s.legendText}>B&W</Text>
                        </View>
                    </View>
                </>
            )}
        </View>
    );
}

function StatCards({ cards }) {
    return (
        <View style={s.statsRow}>
            {cards.map((c, i) => (
                <View
                    key={i}
                    style={[
                        s.statCard,
                        {
                            backgroundColor: c.bgColor || C.grayLight,
                            borderColor: c.borderColor || C.grayBorder,
                        },
                    ]}
                >
                    <Text style={[s.statLabel, { color: c.labelColor || C.grayText }]}>{c.label}</Text>
                    <Text style={[s.statValue, { color: c.valueColor || C.black }]}>{c.value ?? "-"}</Text>
                    {c.sub && <Text style={s.statSub}>{c.sub}</Text>}
                </View>
            ))}
        </View>
    );
}

function SimpleBarChart({ data, title }) {
    if (!data || data.length === 0) return null;
    const maxVal = Math.max(...data.map((d) => d.total || 0), 1);
    const barW = Math.max(4, Math.floor(400 / data.length) - 3);

    return (
        <View style={s.chartWrapper}>
            <Text style={s.chartTitle}>{title}</Text>
            <View style={[s.chartArea, { gap: data.length > 20 ? 1 : 3 }]}>
                {data.map((d, i) => {
                    const colorH = Math.round(((d.color || 0) / maxVal) * 76);
                    const bwH = Math.round(((d.bw || 0) / maxVal) * 76);
                    return (
                        <View key={i} style={[s.chartBarGroup, { maxWidth: barW + 8 }]}>
                            {colorH > 0 && (
                                <View
                                    style={{
                                        width: barW,
                                        height: colorH,
                                        backgroundColor: C.indigo,
                                        borderTopLeftRadius: 1,
                                        borderTopRightRadius: 1,
                                    }}
                                />
                            )}
                            {bwH > 0 && (
                                <View
                                    style={{
                                        width: barW,
                                        height: bwH,
                                        backgroundColor: "#9ca3af",
                                        borderTopLeftRadius: colorH === 0 ? 1 : 0,
                                        borderTopRightRadius: colorH === 0 ? 1 : 0,
                                    }}
                                />
                            )}
                            {data.length <= 14 && (
                                <Text style={s.chartLabel}>{d.label}</Text>
                            )}
                        </View>
                    );
                })}
            </View>
            <View style={[s.progressLegend, { marginTop: 6 }]}>
                <View style={s.legendItem}>
                    <View style={[s.legendDot, { backgroundColor: C.indigo }]} />
                    <Text style={s.legendText}>Color</Text>
                </View>
                <View style={s.legendItem}>
                    <View style={[s.legendDot, { backgroundColor: "#9ca3af" }]} />
                    <Text style={s.legendText}>B&W</Text>
                </View>
            </View>
        </View>
    );
}

function PDFFooter({ label }) {
    return (
        <View style={s.footer} fixed>
            <Text style={s.footerText}>Generated {nowStr()} • Printer Dashboard</Text>
            <Text style={s.footerText}>{label}</Text>
        </View>
    );
}

// ─── DAILY REPORT — SINGLE DAY ─────────────────────────────────────────────────
function DailySingleDoc({ report, date, agentName, agentHostname }) {
    const totalPages = Number(report?.totalPages || 0);
    const colorPages = Number(report?.totalColorPages || report?.colorPages || 0);
    const bwPages = Number(report?.totalBwPages || report?.bwPages || 0);
    const byAgent = report?.byAgent || [];
    const byPrinter = report?.byPrinter || [];
    const isPerAgent = !!agentName;

    return (
        <Document title={`Daily Report — ${date}`} author="Printer Dashboard">
            <Page size="A4" style={s.page}>
                {isPerAgent && (
                    <View style={s.agentBadge}>
                        <Text style={s.agentBadgeText}>Agent: {agentName}{agentHostname ? ` (${agentHostname})` : ""}</Text>
                    </View>
                )}

                <View style={s.header}>
                    <View>
                        <Text style={s.headerLabel}>Daily Print Report</Text>
                        <Text style={s.headerTitle}>{fmtDate(date)}</Text>
                        <Text style={s.headerSub}>Source: {report?.source || "—"}</Text>
                    </View>
                    <View>
                        <Text style={s.headerPagesLabel}>Total Pages</Text>
                        <Text style={s.headerPages}>{fmt(totalPages)}</Text>
                    </View>
                </View>

                <StatCards
                    cards={[
                        {
                            label: "Total Pages",
                            value: fmt(totalPages),
                            bgColor: C.blueSoft,
                            borderColor: "#bfdbfe",
                            labelColor: C.blueText,
                            valueColor: C.blue,
                        },
                        {
                            label: "Active Agents",
                            value: report?.agentCount ?? "-",
                            bgColor: C.greenSoft,
                            borderColor: "#bbf7d0",
                            labelColor: C.greenText,
                            valueColor: C.green,
                        },
                        {
                            label: "Active Printers",
                            value: report?.printerCount ?? "-",
                            bgColor: C.orangeSoft,
                            borderColor: "#fed7aa",
                            labelColor: C.orangeText,
                            valueColor: C.orange,
                        },
                        {
                            label: "Data Source",
                            value: report?.source || "—",
                            bgColor: C.purpleSoft,
                            borderColor: "#e9d5ff",
                            labelColor: C.purpleText,
                            valueColor: C.purple,
                        },
                    ]}
                />

                <ColorBwBlock
                    colorPages={colorPages}
                    bwPages={bwPages}
                    label="Color vs B&W Breakdown"
                />

                {byAgent.length > 0 && (
                    <View style={s.tableWrapper}>
                        <View style={s.sectionHeader}>
                            <Text style={s.sectionTitle}>By Agent</Text>
                        </View>
                        <View style={s.tableHeadRow}>
                            <Text style={[s.th, { flex: 2 }]}>Agent</Text>
                            <Text style={[s.thRight, { flex: 1 }]}>Pages</Text>
                            <Text style={[s.thRight, { flex: 1, color: C.indigoText }]}>Color</Text>
                            <Text style={[s.thRight, { flex: 1 }]}>B&W</Text>
                            <Text style={[s.thRight, { flex: 1 }]}>Printers</Text>
                        </View>
                        {byAgent.map((a, i) => {
                            const isLast = i === byAgent.length - 1;
                            const total = Number(a.pages || a.total_pages || 0);
                            const color = Number(a.colorPages || a.color_pages || 0);
                            const bw = Number(a.bwPages || a.bw_pages || 0);
                            return (
                                <View key={i} style={isLast ? s.tableRowLast : s.tableRow}>
                                    <Text style={[s.tdBold, { flex: 2 }]}>{a.agentName || a.agent_name}</Text>
                                    <Text style={[s.tdRight, { flex: 1, color: C.blue, fontFamily: "Helvetica-Bold" }]}>{fmt(total)}</Text>
                                    <Text style={[s.tdRight, { flex: 1, color: C.indigo }]}>{fmt(color)}</Text>
                                    <Text style={[s.tdRight, { flex: 1, color: C.grayText }]}>{fmt(bw)}</Text>
                                    <Text style={[s.tdRight, { flex: 1, color: C.grayText }]}>{a.printers?.length || "-"}</Text>
                                </View>
                            );
                        })}
                    </View>
                )}

                {byPrinter.length > 0 && (
                    <View style={s.tableWrapper}>
                        <View style={s.sectionHeader}>
                            <Text style={s.sectionTitle}>By Printer</Text>
                        </View>
                        <View style={s.tableHeadRow}>
                            <Text style={[s.th, { flex: 2.5 }]}>Printer</Text>
                            <Text style={[s.th, { flex: 1.5 }]}>Agent</Text>
                            <Text style={[s.thRight, { flex: 1 }]}>Total</Text>
                            <Text style={[s.thRight, { flex: 1, color: C.indigoText }]}>Color</Text>
                            <Text style={[s.thRight, { flex: 1 }]}>B&W</Text>
                        </View>
                        {byPrinter.map((p, i) => {
                            const isLast = i === byPrinter.length - 1;
                            const total = Number(p.pages || p.total_pages || 0);
                            const color = Number(p.colorPages || p.color_pages || 0);
                            const bw = Number(p.bwPages || p.bw_pages || 0);
                            const cRatio = pct(color, total);
                            return (
                                <View key={i} style={isLast ? s.tableRowLast : s.tableRow}>
                                    <Text style={[s.tdBold, { flex: 2.5 }]} numberOfLines={1}>{p.name || p.printer_name}</Text>
                                    <Text style={[s.td, { flex: 1.5, color: C.grayText }]}>{p.agentName || p.agent_name}</Text>
                                    <Text style={[s.tdRight, { flex: 1, color: C.blue, fontFamily: "Helvetica-Bold" }]}>{fmt(total)}</Text>
                                    <Text style={[s.tdRight, { flex: 1, color: C.indigo }]}>
                                        {fmt(color)}{cRatio > 0 ? ` (${cRatio}%)` : ""}
                                    </Text>
                                    <Text style={[s.tdRight, { flex: 1, color: C.grayText }]}>{fmt(bw)}</Text>
                                </View>
                            );
                        })}
                    </View>
                )}

                <PDFFooter label={`Daily Report — ${date}`} />
            </Page>
        </Document>
    );
}

// ─── DAILY REPORT — DATE RANGE ─────────────────────────────────────────────────
function DailyRangeDoc({ rangeReports, summary, startDate, endDate, agentName, agentHostname }) {
    const isPerAgent = !!agentName;

    const chartData = (rangeReports || []).map((r) => ({
        label: fmtShort(r.date),
        color: r.colorPages || 0,
        bw: r.bwPages || 0,
        total: r.totalPages || 0,
    }));

    const activeDays = (rangeReports || []).filter((r) => r.totalPages > 0);

    return (
        <Document title={`Daily Report — ${startDate} to ${endDate}`} author="Printer Dashboard">
            <Page size="A4" style={s.page}>
                {isPerAgent && (
                    <View style={s.agentBadge}>
                        <Text style={s.agentBadgeText}>Agent: {agentName}{agentHostname ? ` (${agentHostname})` : ""}</Text>
                    </View>
                )}

                <View style={s.header}>
                    <View>
                        <Text style={s.headerLabel}>Daily Report</Text>
                        <Text style={s.headerTitle}>
                            {fmtShort(startDate)} – {fmtShort(endDate)}
                        </Text>
                        <Text style={s.headerSub}>
                            {summary?.daysWithData || 0} of {summary?.totalDays || 0} days with activity
                        </Text>
                    </View>
                    <View>
                        <Text style={s.headerPagesLabel}>Total Pages</Text>
                        <Text style={s.headerPages}>{fmt(summary?.totalPages)}</Text>
                    </View>
                </View>

                <StatCards
                    cards={[
                        { label: "Total Pages", value: fmt(summary?.totalPages), bgColor: C.grayLight, borderColor: C.grayBorder },
                        { label: "Avg / Day", value: fmt(summary?.averagePages), bgColor: C.grayLight, borderColor: C.grayBorder, sub: "Pages per active day" },
                        { label: "Peak Day", value: fmt(summary?.maxPages), bgColor: C.grayLight, borderColor: C.grayBorder, sub: "Highest volume" },
                        { label: "Lowest Day", value: fmt(summary?.minPages), bgColor: C.grayLight, borderColor: C.grayBorder, sub: "Lowest volume" },
                    ]}
                />

                <ColorBwBlock
                    colorPages={summary?.colorPages || 0}
                    bwPages={summary?.bwPages || 0}
                    label="Color vs B&W Breakdown (Range)"
                />

                <SimpleBarChart data={chartData} title="Color vs B&W Volume Trend" />

                {activeDays.length > 0 && (
                    <View style={s.tableWrapper}>
                        <View style={s.sectionHeader}>
                            <Text style={s.sectionTitle}>Daily Breakdown</Text>
                        </View>
                        <View style={s.tableHeadRow}>
                            <Text style={[s.th, { flex: 2.5 }]}>Date</Text>
                            <Text style={[s.thRight, { flex: 1 }]}>Total</Text>
                            <Text style={[s.thRight, { flex: 1, color: C.indigoText }]}>Color</Text>
                            <Text style={[s.thRight, { flex: 1 }]}>B&W</Text>
                            <Text style={[s.thRight, { flex: 0.8 }]}>Agents</Text>
                            <Text style={[s.thRight, { flex: 0.8 }]}>Printers</Text>
                        </View>
                        {activeDays.map((r, i) => {
                            const isLast = i === activeDays.length - 1;
                            const cRatio = pct(r.colorPages, r.totalPages);
                            return (
                                <View key={i} style={isLast ? s.tableRowLast : s.tableRow}>
                                    <Text style={[s.tdBold, { flex: 2.5 }]}>
                                        {new Date(r.date).toLocaleDateString("id-ID", {
                                            weekday: "short", day: "numeric", month: "long", year: "numeric",
                                        })}
                                    </Text>
                                    <Text style={[s.tdRight, { flex: 1, color: C.blue, fontFamily: "Helvetica-Bold" }]}>{fmt(r.totalPages)}</Text>
                                    <Text style={[s.tdRight, { flex: 1, color: C.indigo }]}>
                                        {fmt(r.colorPages)}{cRatio > 0 ? ` (${cRatio}%)` : ""}
                                    </Text>
                                    <Text style={[s.tdRight, { flex: 1, color: C.grayText }]}>{fmt(r.bwPages)}</Text>
                                    <Text style={[s.tdRight, { flex: 0.8, color: C.grayText }]}>{r.agentCount || 0}</Text>
                                    <Text style={[s.tdRight, { flex: 0.8, color: C.grayText }]}>{r.printerCount || 0}</Text>
                                </View>
                            );
                        })}
                    </View>
                )}

                <PDFFooter label={`Range Report — ${startDate} → ${endDate}`} />
            </Page>
        </Document>
    );
}

// ─── MONTHLY REPORT ────────────────────────────────────────────────────────────
function MonthlyDoc({ report, year, month, agentName, agentHostname }) {
    const summary = report?.summary || {};
    const dailyBreakdown = report?.dailyBreakdown || [];
    const byPrinter = report?.byPrinter || [];
    const byAgent = report?.byAgent || [];
    const isPerAgent = !!agentName;

    const totalPages = Number(summary.totalPages || 0);
    const colorPagesM = Number(summary.totalColorPages || summary.colorPages || 0);
    const bwPagesM = Number(summary.totalBwPages || summary.bwPages || 0);

    const peakDate = summary.peakDay?.date
        ? fmtShort(summary.peakDay.date)
        : "-";

    const chartData = dailyBreakdown.map((d) => ({
        label: fmtShort(d.print_date),
        color: Number(d.color_pages || 0),
        bw: Number(d.bw_pages || 0),
        total: Number(d.total_pages || 0),
    }));

    return (
        <Document title={`Monthly Report — ${MONTHS[month - 1]} ${year}`} author="Printer Dashboard">
            <Page size="A4" style={s.page}>
                {isPerAgent && (
                    <View style={s.agentBadge}>
                        <Text style={s.agentBadgeText}>Agent: {agentName}{agentHostname ? ` (${agentHostname})` : ""}</Text>
                    </View>
                )}

                <View style={s.header}>
                    <View>
                        <Text style={s.headerLabel}>Monthly Print Report</Text>
                        <Text style={s.headerTitle}>{MONTHS[month - 1]} {year}</Text>
                        <Text style={s.headerSub}>
                            {dailyBreakdown.length} active days • Peak: {peakDate} ({fmt(summary.peakDay?.pages)} pages)
                        </Text>
                    </View>
                    <View>
                        <Text style={s.headerPagesLabel}>Total Pages</Text>
                        <Text style={s.headerPages}>{fmt(totalPages)}</Text>
                    </View>
                </View>

                <StatCards
                    cards={[
                        {
                            label: "Total Pages", value: fmt(totalPages),
                            bgColor: C.blueSoft, borderColor: "#bfdbfe", labelColor: C.blueText, valueColor: C.blue,
                        },
                        {
                            label: "Avg / Day", value: fmt(Math.round(summary.averageDailyPages || 0)),
                            bgColor: C.greenSoft, borderColor: "#bbf7d0", labelColor: C.greenText, valueColor: C.green,
                        },
                        {
                            label: "Print Jobs", value: fmt(summary.totalPrintJobs || 0),
                            bgColor: C.orangeSoft, borderColor: "#fed7aa", labelColor: C.orangeText, valueColor: C.orange,
                        },
                        {
                            label: "Active Printers", value: summary.activePrinters || 0,
                            sub: `${summary.activeAgents || 0} agents`,
                            bgColor: C.purpleSoft, borderColor: "#e9d5ff", labelColor: C.purpleText, valueColor: C.purple,
                        },
                    ]}
                />

                <ColorBwBlock
                    colorPages={colorPagesM}
                    bwPages={bwPagesM}
                    label={`Color vs B&W — ${MONTHS[month - 1]} ${year}`}
                />

                <SimpleBarChart data={chartData} title="Daily Color vs B&W Volume" />

                {byPrinter.length > 0 && (
                    <View style={s.tableWrapper} wrap={false}>
                        <View style={s.sectionHeader}>
                            <Text style={s.sectionTitle}>By Printer</Text>
                        </View>
                        <View style={s.tableHeadRow}>
                            <Text style={[s.th, { flex: 2 }]}>Printer</Text>
                            <Text style={[s.th, { flex: 1 }]}>Vendor</Text>
                            <Text style={[s.th, { flex: 1.2 }]}>Agent</Text>
                            <Text style={[s.thRight, { flex: 0.7 }]}>Jobs</Text>
                            <Text style={[s.thRight, { flex: 1 }]}>Total</Text>
                            <Text style={[s.thRight, { flex: 1, color: C.indigoText }]}>Color</Text>
                            <Text style={[s.thRight, { flex: 1 }]}>B&W</Text>
                        </View>
                        {byPrinter.map((p, i) => {
                            const isLast = i === byPrinter.length - 1;
                            const total = Number(p.pages || p.total_pages || 0);
                            const color = Number(p.colorPages || p.color_pages || 0);
                            const bw = Number(p.bwPages || p.bw_pages || 0);
                            const cRatio = pct(color, total);
                            return (
                                <View key={i} style={isLast ? s.tableRowLast : s.tableRow}>
                                    <Text style={[s.tdBold, { flex: 2 }]} numberOfLines={1}>
                                        {p.name || p.display_name || p.printerName || p.printer_name}
                                    </Text>
                                    <Text style={[s.td, { flex: 1, color: C.grayText }]}>{p.vendor && p.vendor !== "Unknown" ? p.vendor : "-"}</Text>
                                    <Text style={[s.td, { flex: 1.2, color: C.grayText }]}>{p.agentName || p.agent_name}</Text>
                                    <Text style={[s.tdRight, { flex: 0.7, color: C.grayText }]}>{p.printCount || p.print_count}</Text>
                                    <Text style={[s.tdRight, { flex: 1, color: C.blue, fontFamily: "Helvetica-Bold" }]}>{fmt(total)}</Text>
                                    <Text style={[s.tdRight, { flex: 1, color: C.indigo }]}>
                                        {fmt(color)}{cRatio > 0 ? ` (${cRatio}%)` : ""}
                                    </Text>
                                    <Text style={[s.tdRight, { flex: 1, color: C.grayText }]}>{fmt(bw)}</Text>
                                </View>
                            );
                        })}
                    </View>
                )}

                {byAgent.length > 0 && (
                    <View style={s.tableWrapper} wrap={false}>
                        <View style={s.sectionHeader}>
                            <Text style={s.sectionTitle}>By Agent</Text>
                        </View>
                        <View style={s.tableHeadRow}>
                            <Text style={[s.th, { flex: 1.5 }]}>Agent</Text>
                            <Text style={[s.th, { flex: 1.2 }]}>Department</Text>
                            <Text style={[s.th, { flex: 1 }]}>Company</Text>
                            <Text style={[s.thRight, { flex: 0.7 }]}>Jobs</Text>
                            <Text style={[s.thRight, { flex: 0.9 }]}>Total</Text>
                            <Text style={[s.thRight, { flex: 0.9, color: C.indigoText }]}>Color</Text>
                            <Text style={[s.thRight, { flex: 0.9 }]}>B&W</Text>
                            <Text style={[s.thRight, { flex: 1.2 }]}>Last Print</Text>
                        </View>
                        {byAgent.map((a, i) => {
                            const isLast = i === byAgent.length - 1;
                            const total = Number(a.pages || a.total_pages || 0);
                            const color = Number(a.colorPages || a.color_pages || 0);
                            const bw = Number(a.bwPages || a.bw_pages || 0);
                            const lastPrint = a.lastPrint || a.last_print;
                            return (
                                <View key={i} style={isLast ? s.tableRowLast : s.tableRow}>
                                    <Text style={[s.tdBold, { flex: 1.5 }]}>{a.agentName || a.agent_name}</Text>
                                    <Text style={[s.td, { flex: 1.2, color: C.grayText }]}>{a.departmentName || a.department_name || "-"}</Text>
                                    <Text style={[s.td, { flex: 1, color: C.grayText }]}>{a.companyName || a.company_name || "-"}</Text>
                                    <Text style={[s.tdRight, { flex: 0.7, color: C.grayText }]}>{a.printCount || a.print_count}</Text>
                                    <Text style={[s.tdRight, { flex: 0.9, color: C.blue, fontFamily: "Helvetica-Bold" }]}>{fmt(total)}</Text>
                                    <Text style={[s.tdRight, { flex: 0.9, color: C.indigo }]}>{fmt(color)}</Text>
                                    <Text style={[s.tdRight, { flex: 0.9, color: C.grayText }]}>{fmt(bw)}</Text>
                                    <Text style={[s.tdRight, { flex: 1.2, color: C.grayMuted }]}>
                                        {lastPrint ? new Date(lastPrint).toLocaleDateString("id-ID") : "-"}
                                    </Text>
                                </View>
                            );
                        })}
                    </View>
                )}

                <PDFFooter label={`Monthly Report — ${MONTHS[month - 1]} ${year}`} />
            </Page>
        </Document>
    );
}

// ─── Public download helpers ────────────────────────────────────────────────────

export async function downloadDailyPDF({ mode, report, date, startDate, endDate, summary, agentId, agentName, agentHostname } = {}) {
    let doc;
    let filename;

    if (mode === "range") {
        doc = (
            <DailyRangeDoc
                rangeReports={report}
                summary={summary}
                startDate={startDate}
                endDate={endDate}
                agentName={agentName}
                agentHostname={agentHostname}
            />
        );
        const agentSuffix = agentName ? `-${agentName.replace(/\s+/g, "_")}` : "";
        filename = `daily-report-${startDate}-to-${endDate}${agentSuffix}.pdf`;
    } else {
        doc = (
            <DailySingleDoc
                report={report}
                date={date}
                agentName={agentName}
                agentHostname={agentHostname}
            />
        );
        const agentSuffix = agentName ? `-${agentName.replace(/\s+/g, "_")}` : "";
        filename = `daily-report-${date}${agentSuffix}.pdf`;
    }

    const blob = await pdf(doc).toBlob();
    _triggerDownload(blob, filename);
}

export async function downloadMonthlyPDF({ report, year, month, agentId, agentName, agentHostname } = {}) {
    const doc = (
        <MonthlyDoc
            report={report}
            year={year}
            month={month}
            agentName={agentName}
            agentHostname={agentHostname}
        />
    );
    const agentSuffix = agentName ? `-${agentName.replace(/\s+/g, "_")}` : "";
    const filename = `monthly-report-${year}-${String(month).padStart(2, "0")}${agentSuffix}.pdf`;
    const blob = await pdf(doc).toBlob();
    _triggerDownload(blob, filename);
}

function _triggerDownload(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}