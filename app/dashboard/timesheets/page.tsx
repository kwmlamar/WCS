"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

import { useState } from "react";
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
import {
  CalendarIcon,
  Download,
  ChevronLeft,
  ChevronRight,
  FileText,
} from "lucide-react";
import { TimesheetTable } from "./timesheet-table";
import { generateTimesheet } from "@/lib/data";
import type { Worker } from "@/lib/types";

export default function TimesheetsPage() {
  const [date, setDate] = useState<Date>(new Date());
  const [selectedWorker, setSelectedWorker] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(false);
  const [workers, setWorkers] = useState<Worker[]>([
    { id: "1", name: "John Doe", email: "john@example.com", active: true, hourly_rate: 12 },
    { id: "2", name: "Jane Smith", email: "jane@example.com", active: true, hourly_rate: 12 },
    { id: "3", name: "Bob Johnson", email: "bob@example.com", active: true, hourly_rate: 12 },
  ]);

  const weekStart = startOfWeek(date, { weekStartsOn: 1 }); // Monday
  const weekEnd = endOfWeek(date, { weekStartsOn: 1 }); // Sunday

  const handlePreviousWeek = () => {
    setDate(subWeeks(date, 1));
  };

  const handleNextWeek = () => {
    setDate(addWeeks(date, 1));
  };

  const handleExportTimesheet = async () => {
    setIsLoading(true);
    try {
      // In a real app, this would call an API to generate a PDF or CSV
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API call

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
    } catch (error) {
      console.error("Failed to export timesheet:", error);
    } finally {
      setIsLoading(false);
    }
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
              <TimesheetTable
                startDate={weekStart}
                endDate={weekEnd}
                workerId={selectedWorker === "all" ? undefined : selectedWorker}
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
                <div className="text-2xl font-bold">160</div>
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
                <div className="text-2xl font-bold">8.0</div>
                <p className="text-xs text-muted-foreground">Per worker</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Absences</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">2</div>
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
                <div className="text-2xl font-bold">12</div>
                <p className="text-xs text-muted-foreground">
                  For selected period
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
