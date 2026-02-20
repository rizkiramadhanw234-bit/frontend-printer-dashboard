// components/cards/DailyReport.jsx
"use client";

import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, FileText } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://192.168.18.60:5000';

export default function DailyReport({ agentId }) {
  const [reports, setReports] = useState([]);
  const [summary, setSummary] = useState({ totalPages: 0, daysWithData: 0 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!agentId) return;

    const loadReports = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('jwt_token');
        const agentKey = localStorage.getItem(`agent_key_${agentId}`);
        
        const res = await fetch(`${API_URL}/api/agents/${agentId}/daily-reports`, {
          headers: {
            'Authorization': `Bearer ${agentKey}`
          }
        });
        
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        
        const data = await res.json();
        setReports(data.reports?.slice(0, 5) || []);
        setSummary(data.summary || { totalPages: 0, daysWithData: 0 });
      } catch (error) {
        console.error('Failed to load daily reports:', error);
      } finally {
        setLoading(false);
      }
    };

    // loadReports();
  }, [agentId]);

  if (!agentId) {
    return (
      <Card className="border border-gray-200">
        <CardContent className="p-6 text-center">
          <div className="flex flex-col items-center gap-2">
            <Calendar className="h-8 w-8 text-gray-300" />
            <p className="text-sm text-gray-500">No agent selected</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-gray-200">
      <CardHeader className="border-b border-gray-100 pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            Daily Reports
          </CardTitle>
          <div className="flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5 text-gray-400" />
            <span className="text-sm font-medium text-gray-900">
              {summary.totalPages.toLocaleString()}
            </span>
            <span className="text-xs text-gray-500">pages</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex justify-between items-center">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-12" />
              </div>
            ))}
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-xs text-gray-500">No reports available</p>
          </div>
        ) : (
          <div className="space-y-2">
            {reports.map((report) => (
              <div 
                key={report.id} 
                className="flex justify-between items-center py-1.5 border-b border-gray-100 last:border-0"
              >
                <span className="text-xs text-gray-600">
                  {new Date(report.report_date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </span>
                <span className="text-xs font-medium text-gray-900">
                  {report.total_pages.toLocaleString()} pages
                </span>
              </div>
            ))}
            
            {summary.daysWithData > 5 && (
              <div className="text-center pt-2">
                <span className="text-[10px] text-gray-400">
                  +{summary.daysWithData - 5} more days
                </span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}