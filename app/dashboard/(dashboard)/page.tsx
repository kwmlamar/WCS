"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { DataTable } from "@/components/data-table";
import { SectionCards } from "@/components/section-cards";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

import { useState, useEffect } from "react";
import { format, isToday } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import {
  CalendarIcon,
  Clock,
  Users,
  Briefcase,
  AlertTriangle,
} from "lucide-react";
import { TimeEntriesTable } from "./time-entries-table";
import { fetchTimeEntries } from "@/lib/data";
import type { TimeEntry } from "@/lib/types";

export default function DashboardPage() {
  const [date, setDate] = useState<Date>(new Date());
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const entries = await fetchTimeEntries(date);
        setTimeEntries(entries);
      } catch (error) {
        console.error("Failed to fetch time entries:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [date]);

  // Calculate summary statistics
  const activeWorkers = timeEntries.filter((entry) => !entry.is_absent).length;
  const totalProjects = [
    ...new Set(
      timeEntries
        .filter((entry) => entry.project_id)
        .map((entry) => entry.project_id)
    ),
  ].length;
  const autoEntries = timeEntries.filter((entry) => entry.is_auto).length;
  const manualEntries = timeEntries.filter((entry) => !entry.is_auto).length;
  const missingProjectEntries = timeEntries.filter(
    (entry) => !entry.project_id && !entry.is_absent
  ).length;
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
        <SiteHeader />
        {/* Section Cards*/}
        <div className="space-y-6 px-4 md:px-6 lg:px-8 pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h2 className="text-3xl font-bold tracking-tight">
              {isToday(date)
                ? "Today's Overview"
                : format(date, "MMMM d, yyyy")}
            </h2>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full sm:w-auto">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(date, "PPP")}
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
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Workers
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activeWorkers}</div>
                <p className="text-xs text-muted-foreground">
                  {timeEntries.length} total workers
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Projects
                </CardTitle>
                <Briefcase className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalProjects}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Clock Entries
                </CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {autoEntries + manualEntries}
                </div>
                <div className="flex gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    Auto: {autoEntries}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    Manual: {manualEntries}
                  </Badge>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Needs Attention
                </CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {missingProjectEntries}
                </div>
                <p className="text-xs text-muted-foreground">
                  Workers without assigned projects
                </p>
              </CardContent>
            </Card>
          </div>

          <TimeEntriesTable
            entries={timeEntries}
            isLoading={isLoading}
            onRefresh={() => fetchTimeEntries(date).then(setTimeEntries)}
          />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
