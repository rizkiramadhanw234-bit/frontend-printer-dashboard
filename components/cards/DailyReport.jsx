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
import { Calendar, FileText, ChevronRight } from "lucide-react";
import { useDailyReportStore } from "@/store/daily.reports";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function DailyReport({ agentId, limit = 5, showViewAll = true }) {
  // Gunakan store
  const {
    reports,
    summary,
    isLoading,
    error,
    fetchAgentReports,
    getReportsForChart
  } = useDailyReportStore();

  const [showAll, setShowAll] = useState(false);

  // Fetch data ketika agentId berubah
  useEffect(() => {
    if (agentId) {
      fetchAgentReports(agentId, {
        limit: 30, // Ambil lebih banyak untuk keperluan view all
        sort: 'desc'
      });
    }
  }, [agentId, fetchAgentReports]);

  // Ambil reports terbatas
  const displayedReports = showAll ? reports : reports?.slice(0, limit);

  // Format summary
  const formattedSummary = {
    totalPages: summary?.totalPages?.toLocaleString() || '0',
    avgPages: summary?.averagePages?.toLocaleString() || '0',
    daysWithData: summary?.daysWithData || 0,
    maxPages: summary?.maxPages?.toLocaleString() || '0'
  };

  if (!agentId) {
    return (
      <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-8 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="p-3 bg-gray-50 rounded-full">
              <Calendar className="h-6 w-6 text-gray-400" />
            </div>
            <p className="text-sm text-gray-500 font-medium">No Agent Selected</p>
            <p className="text-xs text-gray-400">Select an agent to view daily reports</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="border-b border-gray-100 pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <div className="p-1.5 bg-blue-50 rounded-md">
              <Calendar className="h-4 w-4 text-blue-600" />
            </div>
            Daily Reports
          </CardTitle>

          {/* Summary Badge */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-md cursor-help">
                  <FileText className="h-3.5 w-3.5 text-gray-500" />
                  <span className="text-sm font-semibold text-gray-900">
                    {formattedSummary.totalPages}
                  </span>
                  <span className="text-xs text-gray-500">pages</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-xs space-y-1">
                  <p>📊 Average: {formattedSummary.avgPages} pages/day</p>
                  <p>📅 {formattedSummary.daysWithData} days with data</p>
                  <p>📈 Max: {formattedSummary.maxPages} pages</p>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        {isLoading ? (
          // Loading Skeleton
          <div className="space-y-3">
            {Array.from({ length: limit }).map((_, i) => (
              <div key={i} className="flex justify-between items-center">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        ) : error ? (
          // Error State
          <div className="text-center py-6">
            <p className="text-xs text-red-500">{error}</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fetchAgentReports(agentId)}
              className="mt-2 text-xs"
            >
              Try Again
            </Button>
          </div>
        ) : !reports || reports.length === 0 ? (
          // Empty State
          <div className="text-center py-8">
            <div className="flex flex-col items-center gap-2">
              <FileText className="h-8 w-8 text-gray-300" />
              <p className="text-sm font-medium text-gray-500">No Reports Yet</p>
              <p className="text-xs text-gray-400 max-w-[200px]">
                Daily reports will appear here when available
              </p>
            </div>
          </div>
        ) : (
          // Reports List
          <>
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
              {displayedReports.map((report, index) => {
                const reportDate = new Date(report.report_date);
                const isToday = new Date().toDateString() === reportDate.toDateString();

                return (
                  <div
                    key={report.id}
                    className={`
                      flex justify-between items-center py-2 px-2 
                      border-b border-gray-100 last:border-0
                      hover:bg-gray-50 rounded-md transition-colors
                      ${isToday ? 'bg-blue-50/30' : ''}
                    `}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-500">
                        {reportDate.toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                      {isToday && (
                        <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">
                          Today
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs font-semibold text-gray-900">
                        {report.total_pages?.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-gray-400 w-12">
                        {report.printer_count || 0} printer{report.printer_count !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer dengan summary dan view all */}
            <div className="mt-4 pt-3 border-t border-gray-100">
              <div className="flex items-center justify-between">
                {showViewAll && reports.length > limit && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAll(!showAll)}
                    className="text-xs text-blue-600 hover:text-blue-700 h-7 px-2"
                  >
                    {showAll ? 'Show Less' : `View All (${reports.length})`}
                    <ChevronRight className="h-3 w-3 ml-1" />
                  </Button>
                )}
              </div>
            </div>
          </>
        )}
      </CardContent>

      {/* CSS untuk custom scrollbar */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #a1a1a1;
        }
      `}</style>
    </Card>
  );
}