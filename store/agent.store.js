import { create } from "zustand";
import { api } from "../services/api";

export const useAgentStore = create((set, get) => ({
    // ==================== STATE ====================
    agents: [],
    agentDetails: {},
    selectedAgentId: null,
    agentsLoading: false,
    agentsError: null,
    lastAgentsFetch: 0,

    // ==================== ACTIONS ====================

    // 1. Fetch lightweight agents list
    fetchAllAgents: async () => {
        try {
            const now = Date.now();
            if (now - get().lastAgentsFetch < 3000 && get().agents.length > 0) {
                console.log("⏸️ Skipping agents fetch - too soon");
                return get().agents;
            }

            console.log("🔄 Fetching all agents...");
            set({ agentsLoading: true, agentsError: null });

            const data = await api.getConnectedAgents();

            if (!data.success) {
                throw new Error(data.error || "Failed to fetch agents");
            }

            console.log(`✅ Fetched ${data.agents?.length || 0} agents`);

            // Simple normalization
            const normalizedAgents = (data.agents || []).map(agent => ({
                agentId: agent.id || agent.agentId,
                name: agent.name || "Unknown Agent",
                company: agent.company || "Unknown Company",
                status: agent.status || "unknown",
                printerCount: agent.printerCount || 0,
                lastSeen: agent.lastSeen,
                connectedAt: agent.connectedAt,
                connected: agent.connected || false,

                location: "Loading...",
                department: "Loading...",
            }));

            set({
                agents: normalizedAgents,
                agentsLoading: false,
                lastAgentsFetch: now,
            });

            return normalizedAgents;

        } catch (error) {
            console.error("❌ Failed to fetch agents:", error);
            set({
                agentsError: error.message,
                agentsLoading: false,
            });
            throw error;
        }
    },

    // 2. Fetch detailed agent data dan enrich agents list
    fetchAgentDetails: async (agentId) => {
        if (!agentId) {
            throw new Error("Agent ID is required");
        }

        try {
            console.log(`🔄 Fetching details for agent ${agentId}...`);
            set({ agentsLoading: true, agentsError: null });

            const data = await api.getAgent(agentId);

            if (!data.success) {
                throw new Error(data.error || "Failed to fetch agent details");
            }

            console.log(`✅ Agent ${agentId} details fetched (${data.printers?.length || 0} printers)`);

            // Simpan data detail ke cache
            set(state => ({
                agentDetails: {
                    ...state.agentDetails,
                    [agentId]: {
                        ...data.agent,
                        printers: data.printers || [],
                        summary: data.summary || {},
                        lastUpdated: data.timestamp,
                    }
                }
            }));

            // Enrich agents list dengan data detail
            set(state => ({
                agents: state.agents.map(agent =>
                    agent.agentId === agentId
                        ? {
                            ...agent,
                            // Update dengan data detail yang lebih lengkap
                            name: data.agent?.name || agent.name,
                            company: data.agent?.company || agent.company,
                            location: data.agent?.location || agent.location,
                            department: data.agent?.department || agent.department,
                            customerId: data.agent?.customerId,
                            printerCount: data.printers?.length || agent.printerCount,
                            summary: data.summary,
                            // Mark as enriched
                            enriched: true,
                        }
                        : agent
                ),
                agentsLoading: false,
            }));

            return data;

        } catch (error) {
            console.error(`❌ Failed to fetch agent ${agentId} details:`, error);
            set({
                agentsError: error.message,
                agentsLoading: false,
            });
            throw error;
        }
    },

    // 3. Select agent dan auto-fetch details
    selectAgent: async (agentId) => {
        if (!agentId) {
            console.error("❌ Agent ID is required");
            return;
        }

        console.log(`🔧 Selecting agent: ${agentId}`);
        set({ selectedAgentId: agentId });

        // Auto-fetch details jika belum ada
        const state = get();
        if (!state.agentDetails[agentId]) {
            setTimeout(() => {
                get().fetchAgentDetails(agentId);
            }, 100);
        }

        // Return agent info
        return state.agents.find(a => a.agentId === agentId);
    },

    // 4. Get merged agent data (lightweight + details)
    getAgent: (agentId) => {
        const state = get();
        const baseAgent = state.agents.find(a => a.agentId === agentId);
        const details = state.agentDetails[agentId];

        if (!baseAgent) return null;

        // Merge data
        return {
            ...baseAgent,
            ...details,
            // Ensure printerCount is accurate
            printerCount: details?.printers?.length || baseAgent.printerCount,
            // Summary from details
            summary: details?.summary,
        };
    },

    // 5. Get selected agent (merged)
    getSelectedAgent: () => {
        const { selectedAgentId } = get();
        if (!selectedAgentId) return null;
        return get().getAgent(selectedAgentId);
    },

    // 6. Get selected agent printers
    getSelectedAgentPrinters: () => {
        const { selectedAgentId, agentDetails } = get();
        if (!selectedAgentId) return [];
        return agentDetails[selectedAgentId]?.printers || [];
    },

    // 7. Get selected agent summary
    getSelectedAgentSummary: () => {
        const { selectedAgentId, agentDetails } = get();
        if (!selectedAgentId) return null;
        return agentDetails[selectedAgentId]?.summary;
    },

    // 8. Helper functions
    getOnlineAgentsCount: () => {
        return get().agents.filter(a => a.status === "online").length;
    },

    getOfflineAgentsCount: () => {
        return get().agents.filter(a => a.status === "offline").length;
    },

    // 9. Refresh semua data
    refreshAll: async () => {
        await get().fetchAllAgents();
        const selectedId = get().selectedAgentId;
        if (selectedId) {
            await get().fetchAgentDetails(selectedId);
        }
    },

    // 10. Sync dengan printer store (untuk compatibility)
    syncWithPrinterStore: (printerStore) => {
        const selectedAgent = get().getSelectedAgent();
        if (selectedAgent) {
            printerStore.setState({
                selectedAgent,
                printers: get().getSelectedAgentPrinters()
            });
        }
    },

    // 11. Reset
    reset: () => {
        set({
            agents: [],
            agentDetails: {},
            selectedAgentId: null,
            agentsLoading: false,
            agentsError: null,
            lastAgentsFetch: 0,
        });
    },
}));