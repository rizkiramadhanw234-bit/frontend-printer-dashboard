import { create } from "zustand";
import { persist } from "zustand/middleware";
import wsService from "@/services/ws";
import { usePrinterStore } from "./printer.store";

export const useAlertStore = create(
    persist(
        (set, get) => ({
            alerts: [],
            alertHistory: [],
            unreadCount: 0,
            criticalCount: 0,
            warningCount: 0,
            lastChecked: null,
            unsubscribeFromPrinters: null,
            unsubscribeFromPrinterStore: null,

            settings: {
                enableAlerts: true,
                enableSound: false,
                enableDesktopNotification: false,
                thresholds: {
                    offlineMinutes: 5,
                    inkLow: 15,
                    inkCritical: 10,
                    paperLow: 10,
                },
                autoResolve: {
                    enabled: true,
                    offlineReturn: true,
                    inkRefilled: true,
                }
            },

            syncWithPrinterStore: () => {
                const printerStore = usePrinterStore.getState();
                const allPrinters = printerStore.allPrinters;

                if (allPrinters && allPrinters.length > 0) {
                    get().generateAlertsFromPrinters(allPrinters, 'sync');
                }

                const unsubscribe = usePrinterStore.subscribe((state) => {
                    if (state.allPrinters) {
                        get().generateAlertsFromPrinters(state.allPrinters, 'printer_store_update');
                    }
                });

                set({ unsubscribeFromPrinterStore: unsubscribe });
            },

            generateAlertsFromPrinters: (printers, source = 'manual') => {
                const { settings, alerts } = get();
                const newAlerts = [];
                const now = new Date().toISOString();

                printers.forEach(printer => {
                    if (!printer || !printer.id) return;

                    const printerId = printer.id;
                    const printerName = printer.display_name || printer.name || 'Unknown Printer';
                    const agentId = printer.agent_id;

                    const existingAlerts = alerts.filter(
                        a => a.printerId === printerId && a.status === 'active'
                    );

                    if (printer.printer_status_detail === 'no_ink' ||
                        (printer.lowInkColors && printer.lowInkColors.length > 0 &&
                            printer.lowInkColors.some(color => {
                                const inkLevels = typeof printer.ink_levels === 'string'
                                    ? JSON.parse(printer.ink_levels)
                                    : printer.ink_levels || {};
                                return inkLevels[color] === 0;
                            }))) {

                        const colors = printer.lowInkColors?.join(', ') || 'ink';
                        const existingNoInk = existingAlerts.find(a => a.type === 'no_ink');

                        if (!existingNoInk) {
                            newAlerts.push({
                                id: `no-ink-${printerId}-${Date.now()}`,
                                printerId,
                                printerName,
                                agentId,
                                type: 'no_ink',
                                severity: 'critical',
                                message: `${printerName}: No ink (${colors})`,
                                details: {
                                    colors: printer.lowInkColors,
                                    inkLevels: printer.ink_levels
                                },
                                timestamp: now,
                                status: 'active',
                                read: false,
                                source
                            });
                        }
                    }

                    else if (printer.printer_status_detail === 'low_ink' ||
                        (printer.lowInkColors && printer.lowInkColors.length > 0)) {

                        const colors = printer.lowInkColors?.join(', ') || 'ink';
                        const existingLowInk = existingAlerts.find(a => a.type === 'low_ink');

                        if (!existingLowInk) {
                            newAlerts.push({
                                id: `low-ink-${printerId}-${Date.now()}`,
                                printerId,
                                printerName,
                                agentId,
                                type: 'low_ink',
                                severity: 'warning',
                                message: `${printerName}: Low ink (${colors})`,
                                details: {
                                    colors: printer.lowInkColors,
                                    inkLevels: printer.ink_levels
                                },
                                timestamp: now,
                                status: 'active',
                                read: false,
                                source
                            });
                        }
                    }

                    if (printer.printer_status_detail === 'paper_jam') {
                        const existingPaperJam = existingAlerts.find(a => a.type === 'paper_jam');

                        if (!existingPaperJam) {
                            newAlerts.push({
                                id: `paper-jam-${printerId}-${Date.now()}`,
                                printerId,
                                printerName,
                                agentId,
                                type: 'paper_jam',
                                severity: 'critical',
                                message: `${printerName}: Paper jam detected`,
                                details: { status: printer.status },
                                timestamp: now,
                                status: 'active',
                                read: false,
                                source
                            });
                        }
                    }

                    if (printer.printer_status_detail === 'out_of_paper') {
                        const existingOutOfPaper = existingAlerts.find(a => a.type === 'out_of_paper');

                        if (!existingOutOfPaper) {
                            newAlerts.push({
                                id: `out-of-paper-${printerId}-${Date.now()}`,
                                printerId,
                                printerName,
                                agentId,
                                type: 'out_of_paper',
                                severity: 'warning',
                                message: `${printerName}: Out of paper`,
                                details: { status: printer.status },
                                timestamp: now,
                                status: 'active',
                                read: false,
                                source
                            });
                        }
                    }

                    if (printer.printer_status_detail === 'door_open') {
                        const existingDoorOpen = existingAlerts.find(a => a.type === 'door_open');

                        if (!existingDoorOpen) {
                            newAlerts.push({
                                id: `door-open-${printerId}-${Date.now()}`,
                                printerId,
                                printerName,
                                agentId,
                                type: 'door_open',
                                severity: 'warning',
                                message: `${printerName}: Door open`,
                                details: { status: printer.status },
                                timestamp: now,
                                status: 'active',
                                read: false,
                                source
                            });
                        }
                    }

                    const isOffline = printer.status === 'OFFLINE' ||
                        printer.status === 'DISCONNECTED' ||
                        printer.printer_status_detail === 'offline';

                    if (isOffline) {
                        const lastSeen = printer.updated_at ? new Date(printer.updated_at) : new Date();
                        const offlineMinutes = Math.floor((new Date() - lastSeen) / (1000 * 60));

                        if (offlineMinutes >= settings.thresholds.offlineMinutes) {
                            const existingOfflineAlert = existingAlerts.find(a => a.type === 'offline');

                            if (!existingOfflineAlert) {
                                newAlerts.push({
                                    id: `offline-${printerId}-${Date.now()}`,
                                    printerId,
                                    printerName,
                                    agentId,
                                    type: 'offline',
                                    severity: 'critical',
                                    message: `${printerName} offline (${offlineMinutes}m)`,
                                    details: {
                                        status: printer.status,
                                        lastSeen: printer.updated_at,
                                        offlineMinutes
                                    },
                                    timestamp: now,
                                    status: 'active',
                                    read: false,
                                    source
                                });
                            }
                        }
                    }
                });

                if (newAlerts.length > 0) {
                    set(state => {
                        const existingIds = new Set(state.alerts.map(a => a.id));
                        const uniqueNewAlerts = newAlerts.filter(a => !existingIds.has(a.id));

                        const updatedAlerts = [...uniqueNewAlerts, ...state.alerts].slice(0, 100);

                        const unreadCount = updatedAlerts.filter(a => !a.read).length;
                        const criticalCount = updatedAlerts.filter(a => a.severity === 'critical').length;
                        const warningCount = updatedAlerts.filter(a => a.severity === 'warning').length;

                        return {
                            alerts: updatedAlerts,
                            unreadCount,
                            criticalCount,
                            warningCount
                        };
                    });
                }

                return newAlerts;
            },

            resolveOfflineAlert: (printerId) => {
                set(state => {
                    const offlineAlerts = state.alerts.filter(
                        a => a.printerId === printerId &&
                            a.type === 'offline' &&
                            a.status === 'active'
                    );

                    if (offlineAlerts.length === 0) return state;

                    const now = new Date().toISOString();
                    const resolvedAlerts = offlineAlerts.map(alert => ({
                        ...alert,
                        status: 'resolved',
                        resolvedAt: now,
                        resolvedBy: 'auto'
                    }));

                    return {
                        alerts: state.alerts.filter(a => !offlineAlerts.find(o => o.id === a.id)),
                        alertHistory: [...resolvedAlerts, ...state.alertHistory].slice(0, 500),
                        unreadCount: state.unreadCount - offlineAlerts.filter(a => !a.read).length,
                        criticalCount: state.criticalCount - offlineAlerts.filter(a => a.severity === 'critical').length,
                        warningCount: state.warningCount - offlineAlerts.filter(a => a.severity === 'warning').length
                    };
                });
            },

            markAsRead: (alertId) => {
                set(state => {
                    const alert = state.alerts.find(a => a.id === alertId);
                    if (!alert || alert.read) return state;

                    return {
                        alerts: state.alerts.map(a =>
                            a.id === alertId ? { ...a, read: true } : a
                        ),
                        unreadCount: Math.max(0, state.unreadCount - 1)
                    };
                });
            },

            markAllAsRead: () => {
                set(state => ({
                    alerts: state.alerts.map(a => ({ ...a, read: true })),
                    unreadCount: 0,
                    lastChecked: new Date().toISOString()
                }));
            },

            resolveAlert: (alertId) => {
                set(state => {
                    const alert = state.alerts.find(a => a.id === alertId);
                    if (!alert) return state;

                    const resolvedAlert = {
                        ...alert,
                        status: 'resolved',
                        resolvedAt: new Date().toISOString()
                    };

                    return {
                        alerts: state.alerts.filter(a => a.id !== alertId),
                        alertHistory: [resolvedAlert, ...state.alertHistory].slice(0, 500),
                        unreadCount: alert.read ? state.unreadCount : Math.max(0, state.unreadCount - 1),
                        criticalCount: alert.severity === 'critical' ? state.criticalCount - 1 : state.criticalCount,
                        warningCount: alert.severity === 'warning' ? state.warningCount - 1 : state.warningCount
                    };
                });
            },

            resolveAllAlerts: () => {
                set(state => {
                    const now = new Date().toISOString();
                    const resolvedAlerts = state.alerts.map(alert => ({
                        ...alert,
                        status: 'resolved',
                        resolvedAt: now
                    }));

                    return {
                        alerts: [],
                        alertHistory: [...resolvedAlerts, ...state.alertHistory].slice(0, 500),
                        unreadCount: 0,
                        criticalCount: 0,
                        warningCount: 0,
                        lastChecked: now
                    };
                });
            },

            resolvePrinterAlerts: (printerId, conditions = {}) => {
                const { settings, alerts } = get();

                const printerAlerts = alerts.filter(
                    a => a.printerId === printerId && a.status === 'active'
                );

                const resolvedAlerts = [];
                const now = new Date().toISOString();

                printerAlerts.forEach(alert => {
                    let shouldResolve = false;

                    switch (alert.type) {
                        case 'offline':
                            if (conditions.isOnline === true && settings.autoResolve.offlineReturn) {
                                shouldResolve = true;
                            }
                            break;

                        case 'no_ink':
                        case 'low_ink':
                            if (conditions.inkLevels && settings.autoResolve.inkRefilled) {
                                const hasInk = alert.details?.colors?.every(
                                    color => conditions.inkLevels[color] > 0
                                );
                                if (hasInk) shouldResolve = true;
                            }
                            break;
                    }

                    if (shouldResolve) {
                        resolvedAlerts.push({
                            ...alert,
                            status: 'resolved',
                            resolvedAt: now
                        });
                    }
                });

                if (resolvedAlerts.length > 0) {
                    set(state => ({
                        alerts: state.alerts.filter(a => !resolvedAlerts.find(r => r.id === a.id)),
                        alertHistory: [...resolvedAlerts, ...state.alertHistory].slice(0, 500),
                        unreadCount: state.unreadCount - resolvedAlerts.filter(a => !a.read).length,
                        criticalCount: state.criticalCount - resolvedAlerts.filter(a => a.severity === 'critical').length,
                        warningCount: state.warningCount - resolvedAlerts.filter(a => a.severity === 'warning').length
                    }));
                }

                return resolvedAlerts;
            },

            initWebSocket: () => {
                if (get().unsubscribeFromPrinters) {
                    get().unsubscribeFromPrinters();
                }

                const unsubscribe = wsService.subscribeToPrinters((data) => {
                    if (!get().settings.enableAlerts) return;

                    if (data.type === 'printer_update' && data.printers) {
                        get().generateAlertsFromPrinters(data.printers, 'websocket');
                    }

                    if (data.printer) {
                        get().generateAlertsFromPrinters([data.printer], 'websocket');

                        if (data.printer.status === 'READY' || data.printer.status === 'ONLINE') {
                            get().resolvePrinterAlerts(data.printer.id, { isOnline: true });
                        }

                        if (data.printer.ink_levels) {
                            get().resolvePrinterAlerts(data.printer.id, {
                                inkLevels: data.printer.ink_levels
                            });
                        }
                    }
                });

                set({ unsubscribeFromPrinters: unsubscribe });
            },

            cleanup: () => {
                if (get().unsubscribeFromPrinters) {
                    get().unsubscribeFromPrinters();
                    set({ unsubscribeFromPrinters: null });
                }
                if (get().unsubscribeFromPrinterStore) {
                    get().unsubscribeFromPrinterStore();
                    set({ unsubscribeFromPrinterStore: null });
                }
            },

            getAlertStats: () => {
                const alerts = get().alerts;

                return {
                    total: alerts.length,
                    critical: alerts.filter(a => a.severity === 'critical').length,
                    warning: alerts.filter(a => a.severity === 'warning').length,
                    info: alerts.filter(a => a.severity === 'info').length,
                    byType: {
                        no_ink: alerts.filter(a => a.type === 'no_ink').length,
                        low_ink: alerts.filter(a => a.type === 'low_ink').length,
                        paper_jam: alerts.filter(a => a.type === 'paper_jam').length,
                        out_of_paper: alerts.filter(a => a.type === 'out_of_paper').length,
                        door_open: alerts.filter(a => a.type === 'door_open').length,
                        offline: alerts.filter(a => a.type === 'offline').length,
                    }
                };
            },

            updateSettings: (newSettings) => {
                set(state => ({
                    settings: { ...state.settings, ...newSettings }
                }));
            },
        }),
        {
            name: "alert-storage",
            getStorage: () => localStorage,
            partialize: (state) => ({
                settings: state.settings,
                alertHistory: state.alertHistory.slice(0, 100),
            })
        }
    )
);