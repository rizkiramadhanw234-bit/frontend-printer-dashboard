"use client";

import React, { useEffect, useState } from "react";
import { Calendar, FileText, ChevronRight } from "lucide-react";
import { useReportStore } from "@/store/report.store";

export default function DailyReport({ agentId, limit = 5, showViewAll = true }) {
  const {
    dailyReport,
    isLoading,
    error,
    fetchDailyReport,
  } = useReportStore();

  const [showAll, setShowAll] = useState(false);

  // Fetch data ketika agentId berubah
  useEffect(() => {
    if (agentId) {
      // Fetch daily report untuk agent ini
      const today = new Date().toISOString().split('T')[0];
      fetchDailyReport({ agentId, date: today });
    }
  }, [agentId, fetchDailyReport]);

  // Ambil data dari dailyReport
  const reports = dailyReport?.byAgent?.[0]?.printers || [];
  const totalPages = dailyReport?.totalPages || 0;
  const displayedReports = showAll ? reports : reports.slice(0, limit);

  if (!agentId) {
    return (
      <div className="border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
        <div className="p-8 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="p-3 bg-gray-50 rounded-full">
              <Calendar className="h-6 w-6 text-gray-400" />
            </div>
            <p className="text-sm text-gray-500 font-medium">No Agent Selected</p>
            <p className="text-xs text-gray-400">Select an agent to view daily reports</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="border-b border-gray-100 pb-3 p-4">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium flex items-center gap-2">
            <div className="p-1.5 bg-blue-50 rounded-md">
              <Calendar className="h-4 w-4 text-blue-600" />
            </div>
            Daily Report - Today
          </div>

          {/* Summary Badge */}
          <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-md">
            <FileText className="h-3.5 w-3.5 text-gray-500" />
            <span className="text-sm font-semibold text-gray-900">
              {totalPages.toLocaleString()}
            </span>
            <span className="text-xs text-gray-500">pages</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="pt-4 p-4">
        {isLoading ? (
          // Loading Skeleton
          <div className="space-y-3">
            {Array.from({ length: limit }).map((_, i) => (
              <div key={i} className="flex justify-between items-center">
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        ) : error ? (
          // Error State
          <div className="text-center py-6">
            <p className="text-xs text-red-500">{error}</p>
            <button
              onClick={() => fetchDailyReport({ agentId })}
              className="mt-2 text-xs text-blue-600 hover:text-blue-700"
            >
              Try Again
            </button>
          </div>
        ) : !reports || reports.length === 0 ? (
          // Empty State
          <div className="text-center py-8">
            <div className="flex flex-col items-center gap-2">
              <FileText className="h-8 w-8 text-gray-300" />
              <p className="text-sm font-medium text-gray-500">No Reports Yet</p>
              <p className="text-xs text-gray-400 max-w-50">
                Daily reports will appear here when available
              </p>
            </div>
          </div>
        ) : (
          // Reports List
          <>
            <div className="space-y-2 max-h-75 overflow-y-auto pr-1 custom-scrollbar">
              {displayedReports.map((printer, index) => {
                return (
                  <div
                    key={index}
                    className="flex justify-between items-center py-2 px-2 border-b border-gray-100 last:border-0 hover:bg-gray-50 rounded-md transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-500">
                        {printer.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs font-semibold text-gray-900">
                        {printer.pages?.toLocaleString() || 0} Pages
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            {showViewAll && reports.length > limit && (
              <div className="mt-4 pt-3 border-t border-gray-100">
                <button
                  onClick={() => setShowAll(!showAll)}
                  className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  {showAll ? 'Show Less' : `View All (${reports.length})`}
                  <ChevronRight className="h-3 w-3" />
                </button>
              </div>
            )}
          </>
        )}
      </div>

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
    </div>
  );
}