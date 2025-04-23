"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

import { useState, useEffect } from "react";
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks } from "date-fns";
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
import { TimesheetTable } from "./timesheet-table";

import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CalendarIcon,
  Download,
  ChevronLeft,
  ChevronRight,
  FileText,
  Plus,
  RefreshCw,
} from "lucide-react";
import {
  fetchWorkers,
  generateTimesheet,
  generateTimesheetsForWeek,
  fetchTimesheetData,
  bulkUpdateHours,
  getWorkdaySettings,
} from "@/lib/data";
import { toast } from "@/hooks/use-toast";
import type { Worker, WorkdaySettings } from "@/lib/types";

export default function TimesheetsPage() {
  const [date, setDate] = useState<Date>(new Date());
  const [selectedWorker, setSelectedWorker] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [customHours, setCustomHours] = useState<string>("8");
  const [isCustomHoursDialogOpen, setIsCustomHoursDialogOpen] = useState(false);
  const [workdaySettings, setWorkdaySettings] = useState<WorkdaySettings>({
    monday: true,
    tuesday: true,
    wednesday: true,
    thursday: true,
    friday: true,
    saturday: false,
    sunday: false,
  });
  const [timesheetStats, setTimesheetStats] = useState({
    totalHours: 0,
    averageDailyHours: 0,
    absences: 0,
    overtimeHours: 0,
  });

  const weekStart = startOfWeek(date, { weekStartsOn: 1 }); // Monday
  const weekEnd = endOfWeek(date, { weekStartsOn: 1 }); // Sunday

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load workers
        const workersData = await fetchWorkers();
        setWorkers(workersData);

        // Load workday settings
        const settings = await getWorkdaySettings();
        setWorkdaySettings(settings);

        // Load timesheet stats
        await loadTimesheetStats();
      } catch (error) {
        console.error("Failed to load data:", error);
        toast({
          title: "Error",
          description: "Failed to load data. Please try again.",
          variant: "destructive",
        });
      }
    };

    loadData();
  }, []);

  const loadTimesheetStats = async () => {
    try {
      const timesheetData = await fetchTimesheetData(
        weekStart,
        weekEnd,
        selectedWorker === "all" ? undefined : selectedWorker
      );

      // Calculate stats
      const totalHours = timesheetData.reduce(
        (sum, entry) => sum + (entry.hours || 0),
        0
      );
      const absences = timesheetData.filter((entry) => entry.is_absent).length;
      const workingDays = Object.values(workdaySettings).filter(Boolean).length;
      const activeWorkers =
        selectedWorker === "all" ? workers.filter((w) => w.active).length : 1;
      const expectedHours = workingDays * activeWorkers * 8;
      const overtimeHours = Math.max(0, totalHours - expectedHours);
      const averageDailyHours =
        activeWorkers > 0 && workingDays > 0
          ? totalHours / (activeWorkers * workingDays)
          : 0;

      setTimesheetStats({
        totalHours,
        averageDailyHours,
        absences,
        overtimeHours,
      });
    } catch (error) {
      console.error("Failed to load timesheet stats:", error);
    }
  };

  const handlePreviousWeek = () => {
    setDate(subWeeks(date, 1));
  };

  const handleNextWeek = () => {
    setDate(addWeeks(date, 1));
  };

  const handleExportTimesheet = async () => {
    setIsLoading(true);
    try {
      // Create a CSV string
      const timesheet = await generateTimesheet(
        weekStart,
        weekEnd,
        selectedWorker
      );

      // Create a blob and download it
      const csvContent =
        "data:text/csv;charset=utf-8," +
        timesheet.map((row) => Object.values(row).join(",")).join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute(
        "download",
        `timesheet-${format(weekStart, "yyyy-MM-dd")}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Export successful",
        description: "Timesheet has been exported successfully.",
      });
    } catch (error) {
      console.error("Failed to export timesheet:", error);
      toast({
        title: "Export failed",
        description: "Failed to export timesheet. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateTimesheets = async () => {
    setIsGenerating(true);
    try {
      await generateTimesheetsForWeek(weekStart, weekEnd, workdaySettings);

      toast({
        title: "Timesheets generated",
        description:
          "Timesheets have been generated successfully for the selected week.",
      });

      // Refresh the data
      await loadTimesheetStats();
    } catch (error) {
      console.error("Failed to generate timesheets:", error);
      toast({
        title: "Generation failed",
        description: "Failed to generate timesheets. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleBulkUpdateToEightHours = async () => {
    setIsBulkUpdating(true);
    try {
      await bulkUpdateHours(weekStart, weekEnd, 8);

      toast({
        title: "Hours updated",
        description: "All selected entries have been updated to 8 hours.",
      });

      // Refresh the data
      await loadTimesheetStats();
    } catch (error) {
      console.error("Failed to update hours:", error);
      toast({
        title: "Update failed",
        description: "Failed to update hours. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const handleBulkUpdateToCustomHours = async () => {
    const hours = Number.parseFloat(customHours);

    if (isNaN(hours) || hours < 0 || hours > 24) {
      toast({
        title: "Invalid input",
        description: "Hours must be between 0 and 24",
        variant: "destructive",
      });
      return;
    }

    setIsBulkUpdating(true);
    setIsCustomHoursDialogOpen(false);

    try {
      await bulkUpdateHours(weekStart, weekEnd, hours);

      toast({
        title: "Hours updated",
        description: `All selected entries have been updated to ${hours} hours.`,
      });

      // Refresh the data
      await loadTimesheetStats();
    } catch (error) {
      console.error("Failed to update hours:", error);
      toast({
        title: "Update failed",
        description: "Failed to update hours. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const handleRefresh = async () => {
    await loadTimesheetStats();

    toast({
      title: "Refreshed",
      description: "Timesheet data has been refreshed.",
    });
  };

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
            <h1 className="text-base font-medium">Timesheets</h1>
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

        {/* Timesheet table*/}
        <div className="space-y-6 px-4 md:px-6 lg:px-8 pt-6">
          <div className="flex justify-between items-center">
            <h2 className="text-3xl font-bold tracking-tight">Timesheets</h2>
            <div className="flex flex-col sm:flex-row gap-2">
              <Select value={selectedWorker} onValueChange={setSelectedWorker}>
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
              <Button onClick={handleExportTimesheet} disabled={isLoading}>
                <Download className="mr-2 h-4 w-4" />
                {isLoading ? "Exporting..." : "Export"}
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-md font-medium">
                Week of {format(weekStart, "MMMM d, yyyy")} -{" "}
                {format(weekEnd, "MMMM d, yyyy")}
              </CardTitle>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handlePreviousWeek}
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="sr-only">Previous week</span>
                </Button>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 border-dashed"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      Select Week
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
                <Button variant="outline" size="icon" onClick={handleNextWeek}>
                  <ChevronRight className="h-4 w-4" />
                  <span className="sr-only">Next week</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    onClick={handleGenerateTimesheets}
                    disabled={isGenerating}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    {isGenerating ? "Generating..." : "Generate Timesheets"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleBulkUpdateToEightHours}
                    disabled={isBulkUpdating}
                  >
                    Set Selected to 8 Hours
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsCustomHoursDialogOpen(true)}
                    disabled={isBulkUpdating}
                  >
                    Set Custom Hours
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRefresh}
                  className="ml-auto"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh
                </Button>
              </div>

              <TimesheetTable
                startDate={weekStart}
                endDate={weekEnd}
                workerId={selectedWorker === "all" ? undefined : selectedWorker}
                onDataChange={loadTimesheetStats}
              />
            </CardContent>
          </Card>

          {/* Timesheet Summary */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Hours
                </CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {timesheetStats.totalHours.toFixed(1)}
                </div>
                <p className="text-xs text-muted-foreground">
                  For selected period
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Average Daily Hours
                </CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {timesheetStats.averageDailyHours.toFixed(1)}
                </div>
                <p className="text-xs text-muted-foreground">Per worker</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Absences</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {timesheetStats.absences}
                </div>
                <p className="text-xs text-muted-foreground">
                  For selected period
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
                  {timesheetStats.overtimeHours.toFixed(1)}
                </div>
                <p className="text-xs text-muted-foreground">
                  For selected period
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Custom Hours Dialog */}
          <Dialog
            open={isCustomHoursDialogOpen}
            onOpenChange={setIsCustomHoursDialogOpen}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Set Custom Hours</DialogTitle>
                <DialogDescription>
                  Enter the number of hours to apply to all selected entries.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <Input
                  type="number"
                  step="0.5"
                  min="0"
                  max="24"
                  value={customHours}
                  onChange={(e) => setCustomHours(e.target.value)}
                  placeholder="Enter hours (e.g., 8.5)"
                />
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsCustomHoursDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleBulkUpdateToCustomHours}
                  disabled={isBulkUpdating}
                >
                  {isBulkUpdating ? "Updating..." : "Apply"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
