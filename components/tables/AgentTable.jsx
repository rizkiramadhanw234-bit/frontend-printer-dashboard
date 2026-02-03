// components/TestAgentStore.jsx
"use client";

import { useEffect } from "react";
import { useAgentStore } from "@/store/agent.store";

export default function TestAgentStore() {
    const {
        agents,
        selectedAgentId,
        agentsLoading,
        fetchAllAgents,
        selectAgent,
        getSelectedAgent
    } = useAgentStore();

    useEffect(() => {
        fetchAllAgents();
    }, [fetchAllAgents]);

    const selectedAgent = getSelectedAgent();

    return (
        <div className="p-4 border rounded-lg">
            <h2 className="text-lg font-bold mb-4">Agent Store Test</h2>

            <div className="mb-4">
                <p>Loading: {agentsLoading ? "Yes" : "No"}</p>
                <p>Total Agents: {agents.length}</p>
                <p>Selected Agent: {selectedAgentId || "None"}</p>
            </div>

            <div className="space-y-2">
                {agents.map(agent => (
                    <div
                        key={agent.agentId}
                        className={`p-2 border rounded ${selectedAgentId === agent.agentId ? "bg-blue-100" : ""}`}
                        onClick={() => selectAgent(agent.agentId)}
                    >
                        <p><strong>{agent.name}</strong> ({agent.agentId})</p>
                        <p className="text-sm">Status: {agent.status} | Printers: {agent.printerCount}</p>
                    </div>
                ))}
            </div>

            {selectedAgent && (
                <div className="mt-4 p-3 bg-gray-50 rounded">
                    <h3 className="font-bold">Selected Agent:</h3>
                    <pre className="text-xs overflow-auto">
                        {JSON.stringify(selectedAgent, null, 2)}
                    </pre>
                </div>
            )}
        </div>
    );
}