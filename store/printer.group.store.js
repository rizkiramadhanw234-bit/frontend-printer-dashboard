import { create } from "zustand";
import { api } from "@/services/api";

export const usePrinterGroupStore = create((set, get) => ({
    groups: [],
    isLoading: false,

    //  Fetch all groups from DB 
    fetchGroups: async () => {
        set({ isLoading: true });
        try {
            const res = await api.getGroups();
            set({ groups: res.groups || [], isLoading: false });
        } catch (error) {
            console.error("fetchGroups error:", error);
            set({ isLoading: false });
        }
    },

    addGroup: async (name) => {
        try {
            const res = await api.createGroup(name);
            set((state) => ({ groups: [...state.groups, res.group] }));
            return res.group.id;
        } catch (error) {
            console.error("addGroup error:", error);
        }
    },

    //  Rename group 
    renameGroup: async (groupId, newName) => {
        try {
            await api.renameGroup(groupId, newName);
            set((state) => ({
                groups: state.groups.map((g) =>
                    g.id === groupId ? { ...g, name: newName } : g
                ),
            }));
        } catch (error) {
            console.error("renameGroup error:", error);
        }
    },

    //  Delete group 
    deleteGroup: async (groupId) => {
        try {
            await api.deleteGroup(groupId);
            set((state) => ({
                groups: state.groups.filter((g) => g.id !== groupId),
            }));
        } catch (error) {
            console.error("deleteGroup error:", error);
        }
    },

    //  Assign printer ke group 
    assignPrinter: async (printerId, groupId) => {
        try {
            await api.assignPrinterToGroup(groupId, printerId);
            set((state) => ({
                groups: state.groups.map((g) => {
                    if (g.id === groupId) {
                        return {
                            ...g,
                            printerIds: g.printerIds.includes(printerId)
                                ? g.printerIds
                                : [...g.printerIds, printerId],
                        };
                    }
                    return {
                        ...g,
                        printerIds: g.printerIds.filter((id) => id !== printerId),
                    };
                }),
            }));
        } catch (error) {
            console.error("assignPrinter error:", error);
        }
    },

    //  Unassign printer dari semua group 
    unassignPrinter: async (printerId) => {
        const currentGroup = get().groups.find((g) =>
            g.printerIds.includes(printerId)
        );
        if (!currentGroup) return;

        try {
            await api.unassignPrinterFromGroup(currentGroup.id, printerId);
            set((state) => ({
                groups: state.groups.map((g) => ({
                    ...g,
                    printerIds: g.printerIds.filter((id) => id !== printerId),
                })),
            }));
        } catch (error) {
            console.error("unassignPrinter error:", error);
        }
    },

    //  Helpers (sync, no API call) 
    getGroupForPrinter: (printerId) => {
        return get().groups.find((g) => g.printerIds.includes(printerId)) ?? null;
    },

    getUngroupedIds: (allPrinterIds) => {
        const assigned = new Set(get().groups.flatMap((g) => g.printerIds));
        return allPrinterIds.filter((id) => !assigned.has(id));
    },
}));