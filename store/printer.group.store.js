import { create } from "zustand";
import { persist } from "zustand/middleware";

export const usePrinterGroupStore = create(
    persist(
        (set, get) => ({
            groups: [],

            // Create a new group
            addGroup: (name, color = "gray") => {
                const id = `group_${Date.now()}`;
                set((state) => ({
                    groups: [...state.groups, { id, name, color, printerIds: [] }],
                }));
                return id;
            },

            // Rename a group
            renameGroup: (groupId, newName) =>
                set((state) => ({
                    groups: state.groups.map((g) =>
                        g.id === groupId ? { ...g, name: newName } : g
                    ),
                })),

            // Change group color
            setGroupColor: (groupId, color) =>
                set((state) => ({
                    groups: state.groups.map((g) =>
                        g.id === groupId ? { ...g, color } : g
                    ),
                })),

            // Delete a group (printers are NOT deleted, just unassigned)
            deleteGroup: (groupId) =>
                set((state) => ({
                    groups: state.groups.filter((g) => g.id !== groupId),
                })),

            // Assign a printer to a group (removes from any previous group first)
            assignPrinter: (printerId, groupId) =>
                set((state) => ({
                    groups: state.groups.map((g) => {
                        if (g.id === groupId) {
                            // Add to target group (avoid duplicates)
                            return {
                                ...g,
                                printerIds: g.printerIds.includes(printerId)
                                    ? g.printerIds
                                    : [...g.printerIds, printerId],
                            };
                        }
                        // Remove from all other groups
                        return {
                            ...g,
                            printerIds: g.printerIds.filter((id) => id !== printerId),
                        };
                    }),
                })),

            // Remove a printer from all groups
            unassignPrinter: (printerId) =>
                set((state) => ({
                    groups: state.groups.map((g) => ({
                        ...g,
                        printerIds: g.printerIds.filter((id) => id !== printerId),
                    })),
                })),

            // Move multiple printers to a group at once
            assignMultiple: (printerIds, groupId) =>
                set((state) => ({
                    groups: state.groups.map((g) => {
                        if (g.id === groupId) {
                            const merged = Array.from(
                                new Set([...g.printerIds, ...printerIds])
                            );
                            return { ...g, printerIds: merged };
                        }
                        // Remove these printers from all other groups
                        return {
                            ...g,
                            printerIds: g.printerIds.filter((id) => !printerIds.includes(id)),
                        };
                    }),
                })),

            // Get which group a printer belongs to (returns group or null)
            getGroupForPrinter: (printerId) => {
                const { groups } = get();
                return groups.find((g) => g.printerIds.includes(printerId)) ?? null;
            },

            // Get all printer IDs that have no group assigned
            getUngroupedIds: (allPrinterIds) => {
                const { groups } = get();
                const assigned = new Set(groups.flatMap((g) => g.printerIds));
                return allPrinterIds.filter((id) => !assigned.has(id));
            },

            reorderGroups: (fromIndex, toIndex) =>
                set((state) => {
                    const arr = [...state.groups];
                    const [moved] = arr.splice(fromIndex, 1);
                    arr.splice(toIndex, 0, moved);
                    return { groups: arr };
                }),
        }),
        {
            name: "printer-groups-storage",
            version: 1,
        }
    )
);
