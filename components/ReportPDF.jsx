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
    black: "#111827",
    white: "#ffffff",
    grayLight: "#f9fafb",
    grayBg: "#f3f4f6",
    grayBorder: "#e5e7eb",
    grayText: "#6b7280",
    grayMuted: "#9ca3af",
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
        fontSize: 8,
        color: C.black,
        backgroundColor: C.white,
        paddingTop: 32,
        paddingHorizontal: 28,
        paddingBottom: 44,
    },

    // ── Page Header ──
    pageHeader: {
        marginBottom: 14,
        paddingBottom: 12,
        borderBottom: "2pt solid",
        borderBottomColor: C.black,
    },
    pageTitle: {
        fontSize: 22,
        fontFamily: "Helvetica-Bold",
        color: C.black,
        marginBottom: 2,
    },
    pageSubtitle: {
        fontSize: 10,
        fontFamily: "Helvetica-Bold",
        color: C.black,
        marginBottom: 4,
    },
    pageMetaRow: {
        flexDirection: "row",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 6,
        marginBottom: 3,
    },
    metaChip: {
        backgroundColor: C.grayBg,
        borderRadius: 3,
        paddingHorizontal: 6,
        paddingVertical: 2,
        flexDirection: "row",
        alignItems: "center",
        gap: 3,
    },
    metaChipLabel: {
        fontSize: 7,
        color: C.grayText,
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    metaChipValue: {
        fontSize: 7,
        fontFamily: "Helvetica-Bold",
        color: C.black,
    },
    agentChip: {
        backgroundColor: C.indigoSoft,
        border: "1pt solid",
        borderColor: "#c7d2fe",
        borderRadius: 3,
        paddingHorizontal: 7,
        paddingVertical: 2,
        flexDirection: "row",
        alignItems: "center",
        gap: 3,
        alignSelf: "flex-start",
        marginTop: 5,
    },
    agentChipLabel: {
        fontSize: 7,
        color: C.indigoText,
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    agentChipValue: {
        fontSize: 7,
        fontFamily: "Helvetica-Bold",
        color: C.indigo,
    },

    // ── Summary Cards ──
    summaryRow: {
        flexDirection: "row",
        gap: 6,
        marginBottom: 12,
    },
    summaryCard: {
        flex: 1,
        backgroundColor: C.grayLight,
        border: "1pt solid",
        borderColor: C.grayBorder,
        borderRadius: 4,
        padding: 8,
    },
    summaryCardLabel: {
        fontSize: 6.5,
        color: C.grayText,
        textTransform: "uppercase",
        letterSpacing: 0.8,
        marginBottom: 3,
    },
    summaryCardValue: {
        fontSize: 14,
        fontFamily: "Helvetica-Bold",
        color: C.black,
        marginBottom: 1,
    },
    summaryCardSub: {
        fontSize: 6.5,
        color: C.grayMuted,
    },

    // ── Color/BW split ──
    splitRow: {
        flexDirection: "row",
        gap: 6,
        marginBottom: 6,
    },
    splitBox: {
        flex: 1,
        borderRadius: 4,
        padding: 8,
        border: "1pt solid",
    },
    splitNum: {
        fontSize: 13,
        fontFamily: "Helvetica-Bold",
        marginBottom: 1,
    },
    splitLabel: {
        fontSize: 7,
    },
    progressBg: {
        height: 5,
        backgroundColor: C.grayBorder,
        borderRadius: 3,
        overflow: "hidden",
        marginBottom: 4,
    },
    progressFill: {
        height: 5,
        borderRadius: 3,
    },
    splitLegend: {
        flexDirection: "row",
        gap: 10,
    },
    legendItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 3,
    },
    legendDot: {
        width: 5,
        height: 5,
        borderRadius: 2.5,
    },
    legendText: {
        fontSize: 6.5,
        color: C.grayText,
    },

    // ── Section label ──
    sectionLabel: {
        fontSize: 7.5,
        fontFamily: "Helvetica-Bold",
        color: C.black,
        textTransform: "uppercase",
        letterSpacing: 0.8,
        marginBottom: 4,
        marginTop: 10,
    },

    // ── Records Table ──
    tableWrap: {
        border: "1pt solid",
        borderColor: C.grayBorder,
        borderRadius: 4,
        overflow: "hidden",
        marginBottom: 12,
    },
    thead: {
        flexDirection: "row",
        backgroundColor: C.grayBg,
        borderBottom: "1.5pt solid",
        borderBottomColor: "#d1d5db",
    },
    tr: {
        flexDirection: "row",
        borderBottom: "1pt solid",
        borderBottomColor: C.grayBorder,
    },
    trLast: {
        flexDirection: "row",
    },
    trAlt: {
        flexDirection: "row",
        borderBottom: "1pt solid",
        borderBottomColor: C.grayBorder,
        backgroundColor: "#fafafa",
    },
    th: {
        fontSize: 7,
        fontFamily: "Helvetica-Bold",
        color: C.grayText,
        textTransform: "uppercase",
        letterSpacing: 0.4,
        paddingHorizontal: 8,
        paddingVertical: 5,
    },
    thR: {
        fontSize: 7,
        fontFamily: "Helvetica-Bold",
        color: C.grayText,
        textTransform: "uppercase",
        letterSpacing: 0.4,
        paddingHorizontal: 8,
        paddingVertical: 5,
        textAlign: "right",
    },
    td: {
        fontSize: 7.5,
        color: C.black,
        paddingHorizontal: 8,
        paddingVertical: 5,
    },
    tdR: {
        fontSize: 7.5,
        color: C.black,
        paddingHorizontal: 8,
        paddingVertical: 5,
        textAlign: "right",
    },
    tdBold: {
        fontSize: 7.5,
        fontFamily: "Helvetica-Bold",
        color: C.black,
        paddingHorizontal: 8,
        paddingVertical: 5,
    },
    tdMuted: {
        fontSize: 7.5,
        color: C.grayText,
        paddingHorizontal: 8,
        paddingVertical: 5,
    },
    tdMutedR: {
        fontSize: 7.5,
        color: C.grayText,
        paddingHorizontal: 8,
        paddingVertical: 5,
        textAlign: "right",
    },
    cellSub: {
        fontSize: 6.5,
        color: C.grayMuted,
        marginTop: 1,
    },

    // ── Bar chart ──
    chartWrap: {
        border: "1pt solid",
        borderColor: C.grayBorder,
        borderRadius: 4,
        padding: 10,
        marginBottom: 12,
    },
    chartTitle: {
        fontSize: 8,
        fontFamily: "Helvetica-Bold",
        color: C.black,
        marginBottom: 8,
    },
    chartArea: {
        flexDirection: "row",
        alignItems: "flex-end",
        height: 70,
    },
    chartBarGroup: {
        flex: 1,
        alignItems: "center",
        flexDirection: "column",
        justifyContent: "flex-end",
        height: 70,
    },
    chartLabel: {
        fontSize: 5.5,
        color: C.grayMuted,
        textAlign: "center",
        marginTop: 2,
    },

    // ── Footer ──
    footer: {
        position: "absolute",
        bottom: 16,
        left: 28,
        right: 28,
        flexDirection: "row",
        justifyContent: "space-between",
        borderTop: "1pt solid",
        borderTopColor: C.grayBorder,
        paddingTop: 5,
    },
    footerText: {
        fontSize: 6.5,
        color: C.grayMuted,
    },
});

// ─── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (n) => Number(n || 0).toLocaleString("id-ID");
const pct = (a, total) => (total > 0 ? Math.round((a / total) * 100) : 0);
const fmtDate = (d) =>
    d
        ? new Date(d).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
        })
        : "-";
const fmtShort = (d) =>
    d
        ? new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "short" })
        : "";
const nowStr = () =>
    new Date().toLocaleString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });

const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];

// ─── Shared Sub-components ─────────────────────────────────────────────────────

function PageHeader({ title, subtitle, agentName, agentHostname, meta = [] }) {
    return (
        <View style={s.pageHeader}>
            <Text style={s.pageTitle}>{title}</Text>
            {subtitle && <Text style={s.pageSubtitle}>{subtitle}</Text>}
            <View style={s.pageMetaRow}>
                {meta.map((m, i) => (
                    <View key={i} style={s.metaChip}>
                        <Text style={s.metaChipLabel}>{m.label}</Text>
                        <Text style={s.metaChipValue}>{m.value}</Text>
                    </View>
                ))}
            </View>
            {(agentName || agentHostname) && (
                <View style={s.agentChip}>
                    <Text style={s.agentChipLabel}>Agent:</Text>
                    <Text style={s.agentChipValue}>
                        {agentHostname || agentName}
                        {agentName && agentHostname ? ` (${agentName})` : ""}
                    </Text>
                </View>
            )}
        </View>
    );
}

function SummaryCards({ cards }) {
    return (
        <View style={s.summaryRow}>
            {cards.map((c, i) => (
                <View
                    key={i}
                    style={[s.summaryCard, c.border ? { borderColor: c.border } : {}]}
                >
                    <Text
                        style={[
                            s.summaryCardLabel,
                            c.labelColor ? { color: c.labelColor } : {},
                        ]}
                    >
                        {c.label}
                    </Text>
                    <Text
                        style={[
                            s.summaryCardValue,
                            c.valueColor ? { color: c.valueColor } : {},
                        ]}
                    >
                        {c.value ?? "-"}
                    </Text>
                    {c.sub && <Text style={s.summaryCardSub}>{c.sub}</Text>}
                </View>
            ))}
        </View>
    );
}

function ColorBwSplit({ colorPages, bwPages }) {
    const total = (colorPages || 0) + (bwPages || 0);
    const colorRatio = pct(colorPages, total);
    const bwRatio = 100 - colorRatio;
    return (
        <View style={{ marginBottom: 12 }}>
            <View style={s.splitRow}>
                <View
                    style={[
                        s.splitBox,
                        { backgroundColor: C.indigoSoft, borderColor: "#c7d2fe" },
                    ]}
                >
                    <Text style={[s.splitNum, { color: C.indigo }]}>{fmt(colorPages)}</Text>
                    <Text style={[s.splitLabel, { color: C.indigoText }]}>
                        Color — {colorRatio}%
                    </Text>
                </View>
                <View
                    style={[
                        s.splitBox,
                        { backgroundColor: C.grayLight, borderColor: C.grayBorder },
                    ]}
                >
                    <Text style={[s.splitNum, { color: C.grayText }]}>{fmt(bwPages)}</Text>
                    <Text style={[s.splitLabel, { color: C.grayText }]}>
                        B&W — {bwRatio}%
                    </Text>
                </View>
            </View>
            {total > 0 && (
                <>
                    <View style={s.progressBg}>
                        <View
                            style={[
                                s.progressFill,
                                { width: `${colorRatio}%`, backgroundColor: C.indigo },
                            ]}
                        />
                    </View>
                    <View style={s.splitLegend}>
                        <View style={s.legendItem}>
                            <View style={[s.legendDot, { backgroundColor: C.indigo }]} />
                            <Text style={s.legendText}>Color ({colorRatio}%)</Text>
                        </View>
                        <View style={s.legendItem}>
                            <View style={[s.legendDot, { backgroundColor: "#d1d5db" }]} />
                            <Text style={s.legendText}>B&W ({bwRatio}%)</Text>
                        </View>
                    </View>
                </>
            )}
        </View>
    );
}

function BarChart({ data, title }) {
    if (!data || data.length === 0) return null;
    const maxVal = Math.max(...data.map((d) => d.total || 0), 1);
    const barW = Math.max(3, Math.floor(380 / data.length) - 2);
    return (
        <View style={s.chartWrap}>
            <Text style={s.chartTitle}>{title}</Text>
            <View style={[s.chartArea, { gap: data.length > 20 ? 1 : 2 }]}>
                {data.map((d, i) => {
                    const colorH = Math.round(((d.color || 0) / maxVal) * 64);
                    const bwH = Math.round(((d.bw || 0) / maxVal) * 64);
                    return (
                        <View key={i} style={[s.chartBarGroup, { maxWidth: barW + 6 }]}>
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
                            {data.length <= 16 && (
                                <Text style={s.chartLabel}>{d.label}</Text>
                            )}
                        </View>
                    );
                })}
            </View>
            <View style={[s.splitLegend, { marginTop: 6 }]}>
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

function Footer({ label }) {
    return (
        <View style={s.footer} fixed>
            <Text style={s.footerText}>Generated {nowStr()} · Printer Dashboard</Text>
            <Text
                render={({ pageNumber, totalPages }) =>
                    `${label}  ·  Page ${pageNumber} / ${totalPages}`
                }
                style={s.footerText}
            />
        </View>
    );
}

// ─── Agent cell helper ─────────────────────────────────────────────────────────
function AgentCell({ name, hostname, flex = 2 }) {
    const primary = hostname || name || "-";
    const secondary = hostname ? name : null;
    return (
        <View style={{ flex, paddingHorizontal: 8, paddingVertical: 5 }}>
            <Text style={{ fontSize: 7.5, color: C.grayText }}>{primary}</Text>
            {secondary && <Text style={s.cellSub}>{secondary}</Text>}
        </View>
    );
}

// ─── DAILY — SINGLE DAY ────────────────────────────────────────────────────────
function DailySingleDoc({ report, date, agentName, agentHostname }) {
    const totalPages = Number(report?.totalPages || 0);
    const colorPages = Number(report?.totalColorPages || report?.colorPages || 0);
    const bwPages = Number(report?.totalBwPages || report?.bwPages || 0);
    const byAgent = report?.byAgent || [];
    const byPrinter = report?.byPrinter || [];

    return (
        <Document title={`Records — ${date}`} author="Printer Dashboard">
            <Page size="A4" style={s.page}>
                <PageHeader
                    title="Records"
                    subtitle={fmtDate(date)}
                    agentName={agentName}
                    agentHostname={agentHostname}
                    meta={[
                        { label: "Total Pages", value: fmt(totalPages) },
                        { label: "Source", value: report?.source || "—" },
                        { label: "Agents", value: String(report?.agentCount ?? "-") },
                        { label: "Printers", value: String(report?.printerCount ?? "-") },
                    ]}
                />

                <SummaryCards
                    cards={[
                        {
                            label: "Total Pages",
                            value: fmt(totalPages),
                            valueColor: C.blue,
                            labelColor: C.blueText,
                            border: "#bfdbfe",
                        },
                        {
                            label: "Color Pages",
                            value: fmt(colorPages),
                            valueColor: C.indigo,
                            labelColor: C.indigoText,
                            border: "#c7d2fe",
                        },
                        { label: "B&W Pages", value: fmt(bwPages), valueColor: C.grayText },
                        {
                            label: "Active Agents",
                            value: String(report?.agentCount ?? "-"),
                            valueColor: C.green,
                            labelColor: C.greenText,
                            border: "#bbf7d0",
                        },
                        {
                            label: "Active Printers",
                            value: String(report?.printerCount ?? "-"),
                            valueColor: C.orange,
                            labelColor: C.orangeText,
                            border: "#fed7aa",
                        },
                    ]}
                />

                <ColorBwSplit colorPages={colorPages} bwPages={bwPages} />

                {byAgent.length > 0 && (
                    <>
                        <Text style={s.sectionLabel}>
                            By Agent — {byAgent.length} result{byAgent.length !== 1 ? "s" : ""}
                        </Text>
                        <View style={s.tableWrap}>
                            <View style={s.thead}>
                                <Text style={[s.th, { flex: 2 }]}>Agent / Hostname</Text>
                                <Text style={[s.thR, { flex: 1 }]}>Pages</Text>
                                <Text style={[s.thR, { flex: 1 }]}>Color</Text>
                                <Text style={[s.thR, { flex: 1 }]}>B&W</Text>
                                <Text style={[s.thR, { flex: 0.8 }]}>Printers</Text>
                            </View>
                            {byAgent.map((a, i) => {
                                const isLast = i === byAgent.length - 1;
                                const total = Number(a.pages || a.total_pages || 0);
                                const color = Number(a.colorPages || a.color_pages || 0);
                                const bw = Number(a.bwPages || a.bw_pages || 0);
                                const aName = a.agentName || a.agent_name || agentName || "-";
                                const aHostname = a.agentHostname || a.hostname || agentHostname || "";
                                const rowStyle =
                                    i % 2 === 1
                                        ? isLast
                                            ? [s.trAlt, { borderBottomWidth: 0 }]
                                            : s.trAlt
                                        : isLast
                                            ? s.trLast
                                            : s.tr;
                                return (
                                    <View key={i} style={rowStyle}>
                                        <View style={{ flex: 2, paddingHorizontal: 8, paddingVertical: 5 }}>
                                            <Text style={{ fontSize: 7.5, fontFamily: "Helvetica-Bold", color: C.black }}>
                                                {aHostname || aName}
                                            </Text>
                                            {aHostname && <Text style={s.cellSub}>{aName}</Text>}
                                        </View>
                                        <Text
                                            style={[s.tdR, { flex: 1, fontFamily: "Helvetica-Bold", color: C.blue }]}
                                        >
                                            {fmt(total)}
                                        </Text>
                                        <Text style={[s.tdR, { flex: 1, color: C.indigo }]}>
                                            {fmt(color)}
                                        </Text>
                                        <Text style={[s.tdMutedR, { flex: 1 }]}>{fmt(bw)}</Text>
                                        <Text style={[s.tdMutedR, { flex: 0.8 }]}>
                                            {a.printers?.length || "-"}
                                        </Text>
                                    </View>
                                );
                            })}
                        </View>
                    </>
                )}

                {byPrinter.length > 0 && (
                    <>
                        <Text style={s.sectionLabel}>
                            By Printer — {byPrinter.length} result{byPrinter.length !== 1 ? "s" : ""}
                        </Text>
                        <View style={s.tableWrap}>
                            <View style={s.thead}>
                                <Text style={[s.th, { flex: 2.5 }]}>Printer Name</Text>
                                <Text style={[s.th, { flex: 2 }]}>Agent / Hostname</Text>
                                <Text style={[s.thR, { flex: 1 }]}>Total</Text>
                                <Text style={[s.thR, { flex: 1 }]}>Color</Text>
                                <Text style={[s.thR, { flex: 1 }]}>B&W</Text>
                            </View>
                            {byPrinter.map((p, i) => {
                                const isLast = i === byPrinter.length - 1;
                                const total = Number(p.pages || p.total_pages || 0);
                                const color = Number(p.colorPages || p.color_pages || 0);
                                const bw = Number(p.bwPages || p.bw_pages || 0);
                                const cRatio = pct(color, total);
                                const aName = p.agentName || p.agent_name || agentName || "-";
                                const aHostname = p.agentHostname || p.hostname || agentHostname || "";
                                const rowStyle =
                                    i % 2 === 1
                                        ? isLast
                                            ? [s.trAlt, { borderBottomWidth: 0 }]
                                            : s.trAlt
                                        : isLast
                                            ? s.trLast
                                            : s.tr;
                                return (
                                    <View key={i} style={rowStyle}>
                                        <Text style={[s.tdBold, { flex: 2.5 }]} numberOfLines={1}>
                                            {p.name || p.printer_name}
                                        </Text>
                                        <View style={{ flex: 2, paddingHorizontal: 8, paddingVertical: 5 }}>
                                            <Text style={{ fontSize: 7.5, color: C.grayText }}>
                                                {aHostname || aName}
                                            </Text>
                                            {aHostname && <Text style={s.cellSub}>{aName}</Text>}
                                        </View>
                                        <Text
                                            style={[s.tdR, { flex: 1, fontFamily: "Helvetica-Bold", color: C.blue }]}
                                        >
                                            {fmt(total)}
                                        </Text>
                                        <Text style={[s.tdR, { flex: 1, color: C.indigo }]}>
                                            {fmt(color)}
                                            {cRatio > 0 ? ` (${cRatio}%)` : ""}
                                        </Text>
                                        <Text style={[s.tdMutedR, { flex: 1 }]}>{fmt(bw)}</Text>
                                    </View>
                                );
                            })}
                        </View>
                    </>
                )}

                <Footer label={`Daily Records — ${date}`} />
            </Page>
        </Document>
    );
}

// ─── DAILY — DATE RANGE ────────────────────────────────────────────────────────
function DailyRangeDoc({ rangeReports, summary, startDate, endDate, agentName, agentHostname }) {
    const chartData = (rangeReports || []).map((r) => ({
        label: fmtShort(r.date),
        color: r.colorPages || 0,
        bw: r.bwPages || 0,
        total: r.totalPages || 0,
    }));
    const activeDays = (rangeReports || []).filter((r) => r.totalPages > 0);

    return (
        <Document title={`Records — ${startDate} to ${endDate}`} author="Printer Dashboard">
            <Page size="A4" style={s.page}>
                <PageHeader
                    title="Records"
                    subtitle={`${fmtDate(startDate)} – ${fmtDate(endDate)}`}
                    agentName={agentName}
                    agentHostname={agentHostname}
                    meta={[
                        { label: "Total Pages", value: fmt(summary?.totalPages) },
                        {
                            label: "Active Days",
                            value: `${summary?.daysWithData || 0} / ${summary?.totalDays || 0}`,
                        },
                        { label: "Avg / Day", value: fmt(summary?.averagePages) },
                        { label: "Peak Day", value: fmt(summary?.maxPages) },
                    ]}
                />

                <SummaryCards
                    cards={[
                        {
                            label: "Total Pages",
                            value: fmt(summary?.totalPages),
                            valueColor: C.blue,
                            labelColor: C.blueText,
                        },
                        {
                            label: "Color Pages",
                            value: fmt(summary?.colorPages),
                            valueColor: C.indigo,
                            labelColor: C.indigoText,
                        },
                        { label: "B&W Pages", value: fmt(summary?.bwPages), valueColor: C.grayText },
                        { label: "Avg / Day", value: fmt(summary?.averagePages), sub: "Active days only" },
                        { label: "Peak Day", value: fmt(summary?.maxPages), sub: "Highest volume" },
                    ]}
                />

                <ColorBwSplit
                    colorPages={summary?.colorPages || 0}
                    bwPages={summary?.bwPages || 0}
                />

                <BarChart data={chartData} title="Daily Volume — Color vs B&W" />

                {activeDays.length > 0 && (
                    <>
                        <Text style={s.sectionLabel}>
                            Daily Breakdown — {activeDays.length} active day
                            {activeDays.length !== 1 ? "s" : ""}
                        </Text>
                        <View style={s.tableWrap}>
                            <View style={s.thead}>
                                <Text style={[s.th, { flex: 2.5 }]}>Date</Text>
                                <Text style={[s.thR, { flex: 1 }]}>Total</Text>
                                <Text style={[s.thR, { flex: 1 }]}>Color</Text>
                                <Text style={[s.thR, { flex: 1 }]}>B&W</Text>
                                <Text style={[s.thR, { flex: 0.7 }]}>Agents</Text>
                                <Text style={[s.thR, { flex: 0.7 }]}>Printers</Text>
                            </View>
                            {activeDays.map((r, i) => {
                                const isLast = i === activeDays.length - 1;
                                const cRatio = pct(r.colorPages, r.totalPages);
                                const rowStyle =
                                    i % 2 === 1
                                        ? isLast
                                            ? [s.trAlt, { borderBottomWidth: 0 }]
                                            : s.trAlt
                                        : isLast
                                            ? s.trLast
                                            : s.tr;
                                return (
                                    <View key={i} style={rowStyle}>
                                        <Text style={[s.tdBold, { flex: 2.5 }]}>
                                            {new Date(r.date).toLocaleDateString("id-ID", {
                                                weekday: "short",
                                                day: "numeric",
                                                month: "long",
                                                year: "numeric",
                                            })}
                                        </Text>
                                        <Text
                                            style={[s.tdR, { flex: 1, fontFamily: "Helvetica-Bold", color: C.blue }]}
                                        >
                                            {fmt(r.totalPages)}
                                        </Text>
                                        <Text style={[s.tdR, { flex: 1, color: C.indigo }]}>
                                            {fmt(r.colorPages)}
                                            {cRatio > 0 ? ` (${cRatio}%)` : ""}
                                        </Text>
                                        <Text style={[s.tdMutedR, { flex: 1 }]}>{fmt(r.bwPages)}</Text>
                                        <Text style={[s.tdMutedR, { flex: 0.7 }]}>{r.agentCount || 0}</Text>
                                        <Text style={[s.tdMutedR, { flex: 0.7 }]}>{r.printerCount || 0}</Text>
                                    </View>
                                );
                            })}
                        </View>
                    </>
                )}

                <Footer label={`Range Records — ${startDate} → ${endDate}`} />
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

    const totalPages = Number(summary.totalPages || 0);
    const colorPagesM = Number(summary.totalColorPages || summary.colorPages || 0);
    const bwPagesM = Number(summary.totalBwPages || summary.bwPages || 0);
    const peakDate = summary.peakDay?.date ? fmtShort(summary.peakDay.date) : "-";

    const chartData = dailyBreakdown.map((d) => ({
        label: fmtShort(d.print_date),
        color: Number(d.color_pages || 0),
        bw: Number(d.bw_pages || 0),
        total: Number(d.total_pages || 0),
    }));

    return (
        <Document title={`Records — ${MONTHS[month - 1]} ${year}`} author="Printer Dashboard">
            <Page size="A4" style={s.page}>
                <PageHeader
                    title="Records"
                    subtitle={`${MONTHS[month - 1]} ${year}`}
                    agentName={agentName}
                    agentHostname={agentHostname}
                    meta={[
                        { label: "Total Pages", value: fmt(totalPages) },
                        { label: "Active Days", value: String(dailyBreakdown.length) },
                        {
                            label: "Peak Day",
                            value: `${peakDate} (${fmt(summary.peakDay?.pages)})`,
                        },
                        { label: "Print Jobs", value: fmt(summary.totalPrintJobs || 0) },
                    ]}
                />

                <SummaryCards
                    cards={[
                        {
                            label: "Total Pages",
                            value: fmt(totalPages),
                            valueColor: C.blue,
                            labelColor: C.blueText,
                            border: "#bfdbfe",
                        },
                        {
                            label: "Color Pages",
                            value: fmt(colorPagesM),
                            valueColor: C.indigo,
                            labelColor: C.indigoText,
                            border: "#c7d2fe",
                        },
                        { label: "B&W Pages", value: fmt(bwPagesM), valueColor: C.grayText },
                        {
                            label: "Avg / Day",
                            value: fmt(Math.round(summary.averageDailyPages || 0)),
                            valueColor: C.green,
                            labelColor: C.greenText,
                        },
                        {
                            label: "Active Printers",
                            value: String(summary.activePrinters || 0),
                            sub: `${summary.activeAgents || 0} agents`,
                            valueColor: C.purple,
                            labelColor: C.purpleText,
                        },
                    ]}
                />

                <ColorBwSplit colorPages={colorPagesM} bwPages={bwPagesM} />

                <BarChart
                    data={chartData}
                    title={`Daily Volume — ${MONTHS[month - 1]} ${year}`}
                />

                {byPrinter.length > 0 && (
                    <>
                        <Text style={s.sectionLabel}>
                            By Printer — {byPrinter.length} result{byPrinter.length !== 1 ? "s" : ""}, showing 1–{byPrinter.length}
                        </Text>
                        <View style={s.tableWrap} wrap={false}>
                            <View style={s.thead}>
                                <Text style={[s.th, { flex: 2 }]}>Printer Name</Text>
                                <Text style={[s.th, { flex: 1 }]}>Vendor</Text>
                                <Text style={[s.th, { flex: 2 }]}>Agent / Hostname</Text>
                                <Text style={[s.thR, { flex: 0.6 }]}>Jobs</Text>
                                <Text style={[s.thR, { flex: 0.9 }]}>Total</Text>
                                <Text style={[s.thR, { flex: 0.9 }]}>Color</Text>
                                <Text style={[s.thR, { flex: 0.9 }]}>B&W</Text>
                            </View>
                            {byPrinter.map((p, i) => {
                                const isLast = i === byPrinter.length - 1;
                                const total = Number(p.pages || p.total_pages || 0);
                                const color = Number(p.colorPages || p.color_pages || 0);
                                const bw = Number(p.bwPages || p.bw_pages || 0);
                                const cRatio = pct(color, total);
                                const aName = p.agentName || p.agent_name || agentName || "-";
                                const aHostname = p.agentHostname || p.hostname || agentHostname || "";
                                const rowStyle =
                                    i % 2 === 1
                                        ? isLast
                                            ? [s.trAlt, { borderBottomWidth: 0 }]
                                            : s.trAlt
                                        : isLast
                                            ? s.trLast
                                            : s.tr;
                                return (
                                    <View key={i} style={rowStyle}>
                                        <Text style={[s.tdBold, { flex: 2 }]} numberOfLines={1}>
                                            {p.name || p.display_name || p.printerName || p.printer_name}
                                        </Text>
                                        <Text style={[s.tdMuted, { flex: 1 }]}>
                                            {p.vendor && p.vendor !== "Unknown" ? p.vendor : "-"}
                                        </Text>
                                        <View style={{ flex: 2, paddingHorizontal: 8, paddingVertical: 5 }}>
                                            <Text style={{ fontSize: 7.5, color: C.grayText }}>
                                                {aHostname || aName}
                                            </Text>
                                            {aHostname && <Text style={s.cellSub}>{aName}</Text>}
                                        </View>
                                        <Text style={[s.tdMutedR, { flex: 0.6 }]}>
                                            {p.printCount || p.print_count}
                                        </Text>
                                        <Text
                                            style={[s.tdR, { flex: 0.9, fontFamily: "Helvetica-Bold", color: C.blue }]}
                                        >
                                            {fmt(total)}
                                        </Text>
                                        <Text style={[s.tdR, { flex: 0.9, color: C.indigo }]}>
                                            {fmt(color)}
                                            {cRatio > 0 ? ` (${cRatio}%)` : ""}
                                        </Text>
                                        <Text style={[s.tdMutedR, { flex: 0.9 }]}>{fmt(bw)}</Text>
                                    </View>
                                );
                            })}
                        </View>
                    </>
                )}

                {byAgent.length > 0 && (
                    <>
                        <Text style={s.sectionLabel}>
                            By Agent — {byAgent.length} result{byAgent.length !== 1 ? "s" : ""}, showing 1–{byAgent.length}
                        </Text>
                        <View style={s.tableWrap} wrap={false}>
                            <View style={s.thead}>
                                <Text style={[s.th, { flex: 2 }]}>Agent / Hostname</Text>
                                <Text style={[s.th, { flex: 1.2 }]}>Department</Text>
                                <Text style={[s.th, { flex: 1 }]}>Company</Text>
                                <Text style={[s.thR, { flex: 0.6 }]}>Jobs</Text>
                                <Text style={[s.thR, { flex: 0.9 }]}>Total</Text>
                                <Text style={[s.thR, { flex: 0.9 }]}>Color</Text>
                                <Text style={[s.thR, { flex: 0.9 }]}>B&W</Text>
                                <Text style={[s.thR, { flex: 1.2 }]}>Last Print</Text>
                            </View>
                            {byAgent.map((a, i) => {
                                const isLast = i === byAgent.length - 1;
                                const total = Number(a.pages || a.total_pages || 0);
                                const color = Number(a.colorPages || a.color_pages || 0);
                                const bw = Number(a.bwPages || a.bw_pages || 0);
                                const lastPrint = a.lastPrint || a.last_print;
                                const aName = a.agentName || a.agent_name || agentName || "-";
                                const aHostname = a.agentHostname || a.hostname || agentHostname || "";
                                const rowStyle =
                                    i % 2 === 1
                                        ? isLast
                                            ? [s.trAlt, { borderBottomWidth: 0 }]
                                            : s.trAlt
                                        : isLast
                                            ? s.trLast
                                            : s.tr;
                                return (
                                    <View key={i} style={rowStyle}>
                                        <View style={{ flex: 2, paddingHorizontal: 8, paddingVertical: 5 }}>
                                            <Text style={{ fontSize: 7.5, fontFamily: "Helvetica-Bold", color: C.black }}>
                                                {aHostname || aName}
                                            </Text>
                                            {aHostname && <Text style={s.cellSub}>{aName}</Text>}
                                        </View>
                                        <Text style={[s.tdMuted, { flex: 1.2 }]}>
                                            {a.departmentName || a.department_name || "-"}
                                        </Text>
                                        <Text style={[s.tdMuted, { flex: 1 }]}>
                                            {a.companyName || a.company_name || "-"}
                                        </Text>
                                        <Text style={[s.tdMutedR, { flex: 0.6 }]}>
                                            {a.printCount || a.print_count}
                                        </Text>
                                        <Text
                                            style={[s.tdR, { flex: 0.9, fontFamily: "Helvetica-Bold", color: C.blue }]}
                                        >
                                            {fmt(total)}
                                        </Text>
                                        <Text style={[s.tdR, { flex: 0.9, color: C.indigo }]}>{fmt(color)}</Text>
                                        <Text style={[s.tdMutedR, { flex: 0.9 }]}>{fmt(bw)}</Text>
                                        <Text style={[s.tdMutedR, { flex: 1.2 }]}>
                                            {lastPrint
                                                ? new Date(lastPrint).toLocaleDateString("id-ID")
                                                : "-"}
                                        </Text>
                                    </View>
                                );
                            })}
                        </View>
                    </>
                )}

                <Footer label={`Monthly Records — ${MONTHS[month - 1]} ${year}`} />
            </Page>
        </Document>
    );
}

// ─── Public download helpers ────────────────────────────────────────────────────

export async function downloadDailyPDF({
    mode,
    report,
    date,
    startDate,
    endDate,
    summary,
    agentId,
    agentName,
    agentHostname,
} = {}) {
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
        const agentSuffix = agentHostname
            ? `-${agentHostname.replace(/\s+/g, "_")}`
            : agentName
                ? `-${agentName.replace(/\s+/g, "_")}`
                : "";
        filename = `records-${startDate}-to-${endDate}${agentSuffix}.pdf`;
    } else {
        doc = (
            <DailySingleDoc
                report={report}
                date={date}
                agentName={agentName}
                agentHostname={agentHostname}
            />
        );
        const agentSuffix = agentHostname
            ? `-${agentHostname.replace(/\s+/g, "_")}`
            : agentName
                ? `-${agentName.replace(/\s+/g, "_")}`
                : "";
        filename = `records-${date}${agentSuffix}.pdf`;
    }

    const blob = await pdf(doc).toBlob();
    _triggerDownload(blob, filename);
}

export async function downloadMonthlyPDF({
    report,
    year,
    month,
    agentId,
    agentName,
    agentHostname,
} = {}) {
    const doc = (
        <MonthlyDoc
            report={report}
            year={year}
            month={month}
            agentName={agentName}
            agentHostname={agentHostname}
        />
    );
    const agentSuffix = agentHostname
        ? `-${agentHostname.replace(/\s+/g, "_")}`
        : agentName
            ? `-${agentName.replace(/\s+/g, "_")}`
            : "";
    const filename = `records-${year}-${String(month).padStart(2, "0")}${agentSuffix}.pdf`;
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