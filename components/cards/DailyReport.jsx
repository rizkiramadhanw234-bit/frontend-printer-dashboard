"use client";

import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Download, BarChart3, Printer, Building } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

import { usePrinterStore } from "../../store/printer.store";
import { formatPages, formatDate } from "../../utils/format";
import dayjs from "dayjs";

export default function DailyReport() {
  const [isClient, setIsClient] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [reportData, setReportData] = useState(null);
  const { dailyReport, fetchDailyReport, isLoading } = usePrinterStore();
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    setIsClient(true);
    fetchDailyReport()
      .then((data) => {
        console.log("📊 Daily report data:", data);
        setReportData(data);
      })
      .catch((error) => {
        console.error("❌ Failed to fetch daily report:", error);
      });
  }, [fetchDailyReport]);

  if (!isClient) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Daily Report
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <div className="animate-pulse">
            <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleExport = () => {
    if (!reportData) return;

    setIsExporting(true);

    try {
      const dataStr = JSON.stringify(
        {
          date: format(selectedDate, "yyyy-MM-dd"),
          report: reportData,
          timestamp: new Date().toISOString(),
        },
        null,
        2
      );

      const blob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `printer-report-${format(selectedDate, "yyyy-MM-dd")}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const tableData = reportData?.byPrinter || [];
  const summary = reportData?.summary || {};
  const reportDate = reportData?.date || format(selectedDate, "yyyy-MM-dd");

  const totalPages = summary?.totalPages || 0;
  const totalAgents = summary?.totalAgents || 0;
  const mostActivePrinter = summary?.mostActivePrinter;

  const columns = [
    { header: "Printer", accessorKey: "name" },
    { header: "Company", accessorKey: "company" },
    { header: "Pages Printed", accessorKey: "pages" },
    { header: "Agent", accessorKey: "agentName" },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Daily Print Report
            </CardTitle>
            <CardDescription>
              View detailed printing activity for {format(new Date(reportDate), "MMMM d, yyyy")}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2" disabled={true}>
                  <CalendarIcon className="h-4 w-4" />
                  {format(selectedDate, "MMM dd, yyyy")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  disabled={(date) => date > new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={!reportData || tableData.length === 0 || isExporting}
              className="gap-2"
            >
              <Download className={`h-4 w-4 ${isExporting ? "animate-spin" : ""}`} />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {reportData ? (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-card border rounded-lg p-4">
                <div className="text-sm font-medium text-muted-foreground mb-1">Total Pages</div>
                <div className="text-2xl font-bold text-blue-600">{formatPages(totalPages)}</div>
                <div className="text-xs text-muted-foreground">pages printed</div>
              </div>

              <div className="bg-card border rounded-lg p-4">
                <div className="text-sm font-medium text-muted-foreground mb-1">Active Printers</div>
                <div className="text-2xl font-bold text-green-600">{tableData.length}</div>
                <div className="text-xs text-muted-foreground">with activity</div>
              </div>

              <div className="bg-card border rounded-lg p-4">
                <div className="text-sm font-medium text-muted-foreground mb-1">Total Agents</div>
                <div className="text-2xl font-bold text-purple-600">{totalAgents}</div>
                <div className="text-xs text-muted-foreground">monitoring</div>
              </div>

              <div className="bg-card border rounded-lg p-4">
                <div className="text-sm font-medium text-muted-foreground mb-1">Report Date</div>
                <div className="text-2xl font-bold text-amber-600">
                  {format(new Date(reportDate), "MMM dd")}
                </div>
                <div className="text-xs text-muted-foreground">
                  {format(new Date(reportDate), "yyyy")}
                </div>
              </div>
            </div>

            <Separator className="mb-6" />

            {/* Printers Table */}
            {tableData.length > 0 ? (
              <>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-75">Printer</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead>Pages Printed</TableHead>
                        <TableHead>Agent</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tableData.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <Printer className="h-4 w-4 text-muted-foreground" />
                              <span className="truncate" title={item.name}>
                                {item.name && item.name.length > 30
                                  ? `${item.name.substring(0, 30)}...`
                                  : item.name}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Building className="h-4 w-4 text-muted-foreground" />
                              {item.company || "N/A"}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-bold">{formatPages(item.pages || 0)}</div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-normal">
                              {item.agentName || "Unknown"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Most Active Printer */}
                {mostActivePrinter && (
                  <Alert className="mt-6">
                    <BarChart3 className="h-4 w-4" />
                    <AlertTitle>Most Active Printer</AlertTitle>
                    <AlertDescription>
                      <div className="space-y-2">
                        <div className="font-semibold">{mostActivePrinter.name}</div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">Printed {formatPages(mostActivePrinter.pages)} pages</span>
                          <Badge variant="secondary" className="ml-2">
                            #1
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground flex flex-wrap gap-2">
                          <span className="flex items-center gap-1">
                            <Printer className="h-3 w-3" />
                            Agent: {mostActivePrinter.agentName}
                          </span>
                          <span className="flex items-center gap-1">
                            <Building className="h-3 w-3" />
                            Company: {mostActivePrinter.company}
                          </span>
                        </div>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
              </>
            ) : (
              <Alert variant="warning">
                <BarChart3 className="h-4 w-4" />
                <AlertTitle>No Print Data</AlertTitle>
                <AlertDescription>
                  No printing activity recorded for today. Check if printers are online and operational.
                </AlertDescription>
              </Alert>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <BarChart3 className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No report data available</h3>
            <p className="text-sm text-muted-foreground">
              Check if backend is running and API is accessible
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => fetchDailyReport()}
              disabled={isLoading}
            >
              {isLoading ? "Loading..." : "Refresh Data"}
            </Button>
          </div>
        )}
      </CardContent>

      <CardFooter className="border-t pt-6">
        <div className="flex items-center justify-between w-full text-sm text-muted-foreground">
          <div>
            Last updated:{" "}
            {reportData?.timestamp
              ? format(new Date(reportData.timestamp), "HH:mm:ss")
              : "Never"}
          </div>
          <div className="flex items-center gap-4">
            <span>Total printers: {tableData.length}</span>
            <span>Total pages: {formatPages(totalPages)}</span>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}