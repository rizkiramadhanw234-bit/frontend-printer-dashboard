// components/cards/AgentCard.jsx
"use client";

import React from "react";
import { 
  Monitor, Building, Users, Wifi, Clock, Printer 
} from "lucide-react";

export default function AgentCard({ agent, onClick }) {
  if (!agent) return null;
  
  return (
    <div 
      className="border border-gray-200 rounded-lg hover:shadow-lg transition-shadow cursor-pointer"
      onClick={() => onClick?.(agent)}
    >
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${
              agent.isOnline ? 'bg-green-100' : 'bg-gray-100'
            }`}>
              <Monitor className={`h-5 w-5 ${
                agent.isOnline ? 'text-green-600' : 'text-gray-400'
              }`} />
            </div>
            
            <div>
              <h3 className="font-semibold">{agent.name}</h3>
              <p className="text-sm text-gray-500">{agent.hostname}</p>
            </div>
          </div>
          
          <span className={`px-2 py-1 text-xs rounded ${
            agent.isOnline 
              ? 'bg-green-100 text-green-800' 
              : 'bg-gray-100 text-gray-800'
          }`}>
            {agent.status}
          </span>
        </div>
        
        <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <Building className="h-4 w-4 text-gray-400" />
            <span>{agent.company}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-gray-400" />
            <span>{agent.department}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Printer className="h-4 w-4 text-gray-400" />
            <span>{agent.printerCount} printers</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-gray-400" />
            <span>Last: {new Date(agent.lastSeen).toLocaleTimeString()}</span>
          </div>
        </div>
        
        {agent.ip && (
          <div className="flex items-center gap-2 mt-3 text-sm">
            <Wifi className="h-4 w-4 text-gray-400" />
            <span className="font-mono">{agent.ip}</span>
          </div>
        )}
      </div>
    </div>
  );
}