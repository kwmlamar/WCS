"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

import { useState, useEffect } from "react";
import {
  format,
  startOfWeek,
  endOfWeek,
  addWeeks,
  subWeeks,
  startOfMonth,
  endOfMonth,
  addMonths,
  subMonths,
} from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CalendarIcon,
  Download,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  FileText,
} from "lucide-react";
import { PayrollTable } from "./payroll-table";
import { PayrollSettingsForm } from "./payroll-settings-form";
import {
  fetchPayrollEntries,
  generatePayrollReport,
  fetchPayrollSettings,
  updatePayrollSettings,
} from "@/lib/data";
import type { Worker, PayrollEntry, PayrollSettings } from "@/lib/types";

export default function PayrollPage() {
  const [periodType, setPeriodType] = useState<"weekly" | "monthly">("weekly");
  const [date, setDate] = useState<Date>(new Date());
  const [selectedWorker, setSelectedWorker] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(false);
  const [payrollEntries, setPayrollEntries] = useState<PayrollEntry[]>([]);
  const [payrollSettings, setPayrollSettings] =
    useState<PayrollSettings | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("payroll");
  const [workers, setWorkers] = useState<Worker[]>([
    {
      id: "1",
      name: "John Doe",
      email: "john@example.com",
      active: true,
      hourly_rate: 25,
    },
    {
      id: "2",
      name: "Jane Smith",
      email: "jane@example.com",
      active: true,
      hourly_rate: 28,
    },
    {
      id: "3",
      name: "Bob Johnson",
      email: "bob@example.com",
      active: true,
      hourly_rate: 22,
    },
  ]);

  // Calculate period start and end dates
  const getPeriodDates = () => {
    if (periodType === "weekly") {
      const weekStart = startOfWeek(date, { weekStartsOn: 1 }); // Monday
      const weekEnd = endOfWeek(date, { weekStartsOn: 1 }); // Sunday
      return { startDate: weekStart, endDate: weekEnd };
    } else {
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);
      return { startDate: monthStart, endDate: monthEnd };
    }
  };

  const { startDate, endDate } = getPeriodDates();

  useEffect(() => {
    loadPayrollData();
  }, [date, periodType, selectedWorker]);

  useEffect(() => {
    loadPayrollSettings();
  }, []);

  const loadPayrollData = async () => {
    setIsLoading(true);
    try {
      const entries = await fetchPayrollEntries(
        startDate,
        endDate,
        selectedWorker === "all" ? undefined : selectedWorker
      );
      setPayrollEntries(entries);
    } catch (error) {
      console.error("Failed to fetch payroll entries:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadPayrollSettings = async () => {
    setSettingsLoading(true);
    try {
      const settings = await fetchPayrollSettings();
      setPayrollSettings(settings);
    } catch (error) {
      console.error("Failed to fetch payroll settings:", error);
    } finally {
      setSettingsLoading(false);
    }
  };

  const handlePreviousPeriod = () => {
    if (periodType === "weekly") {
      setDate(subWeeks(date, 1));
    } else {
      setDate(subMonths(date, 1));
    }
  };

  const handleNextPeriod = () => {
    if (periodType === "weekly") {
      setDate(addWeeks(date, 1));
    } else {
      setDate(addMonths(date, 1));
    }
  };

  const handleExportPayroll = async () => {
    setIsLoading(true);
    try {
      // Generate payroll report
      const report = await generatePayrollReport(
        startDate,
        endDate,
        selectedWorker === "all" ? undefined : selectedWorker
      );

      // Create a CSV string
      const csvContent =
        "data:text/csv;charset=utf-8," +
        report.map((row) => Object.values(row).join(",")).join("\n");

      // Create a blob and download it
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute(
        "download",
        `payroll-${periodType}-${format(startDate, "yyyy-MM-dd")}-to-${format(
          endDate,
          "yyyy-MM-dd"
        )}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Failed to export payroll:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = async (settings: PayrollSettings) => {
    setSettingsLoading(true);
    try {
      const updatedSettings = await updatePayrollSettings(settings);
      setPayrollSettings(updatedSettings);
      return true;
    } catch (error) {
      console.error("Failed to update payroll settings:", error);
      return false;
    } finally {
      setSettingsLoading(false);
    }
  };

  // Calculate total payroll amounts
  const totalGrossPay = payrollEntries.reduce(
    (sum, entry) => sum + entry.gross_pay,
    0
  );
  const totalNetPay = payrollEntries.reduce(
    (sum, entry) => sum + entry.net_pay,
    0
  );
  const totalDeductions = payrollEntries.reduce(
    (sum, entry) => sum + entry.deductions,
    0
  );
  const totalRegularHours = payrollEntries.reduce(
    (sum, entry) => sum + entry.regular_hours,
    0
  );
  const totalOvertimeHours = payrollEntries.reduce(
    (sum, entry) => sum + entry.overtime_hours,
    0
  );
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
          <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mx-2 data-[orientation=vertical]:h-4"
            />
            <h1 className="text-base font-medium">Payroll</h1>
            <div className="ml-auto flex items-center gap-2">
              <Button
                variant="ghost"
                asChild
                size="sm"
                className="hidden sm:flex"
              >
                <ModeToggle />
              </Button>
            </div>
          </div>
        </header>

        {/*Payroll*/}
        <div className="space-y-6 px-4 md:px-6 lg:px-8 pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h2 className="text-3xl font-bold tracking-tight">Payroll</h2>
            <div className="flex flex-col sm:flex-row gap-2">
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full sm:w-auto"
              >
                <TabsList>
                  <TabsTrigger value="payroll">Payroll</TabsTrigger>
                  <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsContent value="payroll" className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex flex-col sm:flex-row gap-2">
                  <Select
                    value={periodType}
                    onValueChange={(value: "weekly" | "monthly") =>
                      setPeriodType(value)
                    }
                  >
                    <SelectTrigger className="w-full sm:w-[150px]">
                      <SelectValue placeholder="Period Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={selectedWorker}
                    onValueChange={setSelectedWorker}
                  >
                    <SelectTrigger className="w-full sm:w-[200px]">
                      <SelectValue placeholder="Select Worker" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Workers</SelectItem>
                      {workers.map((worker) => (
                        <SelectItem key={worker.id} value={worker.id}>
                          {worker.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button onClick={handleExportPayroll} disabled={isLoading}>
                    <Download className="mr-2 h-4 w-4" />
                    {isLoading ? "Exporting..." : "Export"}
                  </Button>
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handlePreviousPeriod}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span className="sr-only">Previous {periodType}</span>
                  </Button>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 border-dashed"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {periodType === "weekly"
                          ? `Week of ${format(startDate, "MMM d")} - ${format(
                              endDate,
                              "MMM d, yyyy"
                            )}`
                          : format(date, "MMMM yyyy")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={(date) => date && setDate(date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleNextPeriod}
                  >
                    <ChevronRight className="h-4 w-4" />
                    <span className="sr-only">Next {periodType}</span>
                  </Button>
                </div>
              </div>

              {/* Payroll Summary */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Gross Pay
                    </CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      ${totalGrossPay.toFixed(2)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      For selected period
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Net Pay
                    </CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      ${totalNetPay.toFixed(2)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      After deductions
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Deductions
                    </CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      ${totalDeductions.toFixed(2)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Taxes and benefits
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Regular Hours
                    </CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {totalRegularHours.toFixed(1)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Standard rate
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Overtime Hours
                    </CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {totalOvertimeHours.toFixed(1)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Premium rate
                    </p>
                  </CardContent>
                </Card>
              </div>

              <PayrollTable
                entries={payrollEntries}
                isLoading={isLoading}
                onRefresh={loadPayrollData}
                periodType={periodType}
                startDate={startDate}
                endDate={endDate}
              />
            </TabsContent>

            <TabsContent value="settings">
              {payrollSettings ? (
                <PayrollSettingsForm
                  settings={payrollSettings}
                  onSave={handleSaveSettings}
                  isLoading={settingsLoading}
                />
              ) : (
                <div className="flex justify-center items-center h-64">
                  <p>Loading settings...</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
