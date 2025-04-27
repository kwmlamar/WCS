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
import { TimeEntriesTable } from "./time-entries-table";

import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  CalendarIcon,
  Clock,
  Users,
  Briefcase,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  fetchTimeEntries,
  fetchWorkers,
  fetchProjects,
  updateTimeEntry,
} from "@/lib/data";
import { toast } from "@/hooks/use-toast";
import type { TimeEntry, Worker, Project } from "@/lib/types";

export default function DashboardPage() {
  const [date, setDate] = useState<Date>(new Date());
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingEntry, setEditingEntry] = useState<string | null>(null);
  const [selectedEntries, setSelectedEntries] = useState<{
    [key: string]: boolean;
  }>({});
  const [customHours, setCustomHours] = useState<string>("8");
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Load time entries for the selected date
        const entries = await fetchTimeEntries(date);
        setTimeEntries(entries);

        // Load workers and projects for statistics
        const workersData = await fetchWorkers();
        setWorkers(workersData);

        const projectsData = await fetchProjects();
        setProjects(projectsData);
      } catch (error) {
        console.error("Failed to fetch data:", error);
        toast({
          title: "Error",
          description: "Failed to load dashboard data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [date]);

  // Calculate summary statistics
  const activeWorkers = timeEntries.filter((entry) => !entry.is_absent).length;
  const totalWorkers = workers.filter((worker) => worker.active).length;
  const totalProjects = [
    ...new Set(
      timeEntries
        .filter((entry) => entry.project_id)
        .map((entry) => entry.project_id)
    ),
  ].length;
  const activeProjects = projects.filter((project) => project.active).length;
  const autoEntries = timeEntries.filter((entry) => entry.is_auto).length;
  const manualEntries = timeEntries.filter((entry) => !entry.is_auto).length;
  const missingProjectEntries = timeEntries.filter(
    (entry) => !entry.project_id && !entry.is_absent
  ).length;

  const handleRefresh = async () => {
    try {
      setIsLoading(true);
      const entries = await fetchTimeEntries(date);
      setTimeEntries(entries);
      toast({
        title: "Refreshed",
        description: "Dashboard data has been refreshed.",
      });
    } catch (error) {
      console.error("Failed to refresh data:", error);
      toast({
        title: "Error",
        description: "Failed to refresh data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleHoursChange = async (entryId: string, newHoursStr: string) => {
    // Parse the input value
    const newHours = newHoursStr === "" ? null : Number.parseFloat(newHoursStr);

    // Validate input
    if (
      newHoursStr !== "" &&
      (isNaN(newHours!) || newHours! < 0 || newHours! > 24)
    ) {
      toast({
        title: "Invalid input",
        description: "Hours must be between 0 and 24",
        variant: "destructive",
      });
      return;
    }

    try {
      // Find the entry to update
      const entry = timeEntries.find((e) => e.id === entryId);
      if (!entry) return;

      // Update the time entry in the database
      await updateTimeEntry({
        ...entry,
        hours: newHours,
      });

      // Update local state to reflect the change
      const updatedEntries = timeEntries.map((e) =>
        e.id === entryId ? { ...e, hours: newHours } : e
      );

      setTimeEntries(updatedEntries);
      setEditingEntry(null);

      toast({
        title: "Hours updated",
        description: "The time entry has been updated successfully.",
      });
    } catch (error) {
      console.error("Failed to update hours:", error);
      toast({
        title: "Error",
        description: "Failed to update hours. Please try again.",
        variant: "destructive",
      });
    }
  };

  const toggleSelectEntry = (entryId: string) => {
    setSelectedEntries((prev) => ({
      ...prev,
      [entryId]: !prev[entryId],
    }));
  };

  const toggleSelectAll = () => {
    const allSelected = timeEntries.every((entry) => selectedEntries[entry.id]);

    if (allSelected) {
      // Deselect all
      setSelectedEntries({});
    } else {
      // Select all
      const newSelected: { [key: string]: boolean } = {};
      timeEntries.forEach((entry) => {
        newSelected[entry.id] = true;
      });
      setSelectedEntries(newSelected);
    }
  };

  const handleBulkUpdateToEightHours = async () => {
    const selectedIds = Object.entries(selectedEntries)
      .filter(([_, isSelected]) => isSelected)
      .map(([id]) => id);

    if (selectedIds.length === 0) {
      toast({
        title: "No entries selected",
        description: "Please select at least one entry to update.",
        variant: "destructive",
      });
      return;
    }

    setIsBulkUpdating(true);

    try {
      // Update each selected entry
      for (const id of selectedIds) {
        const entry = timeEntries.find((e) => e.id === id);
        if (entry) {
          await updateTimeEntry({
            ...entry,
            hours: 8,
          });
        }
      }

      // Refresh the data
      const entries = await fetchTimeEntries(date);
      setTimeEntries(entries);

      toast({
        title: "Hours updated",
        description: `Updated ${selectedIds.length} entries to 8 hours.`,
      });
    } catch (error) {
      console.error("Failed to update hours:", error);
      toast({
        title: "Error",
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

    const selectedIds = Object.entries(selectedEntries)
      .filter(([_, isSelected]) => isSelected)
      .map(([id]) => id);

    if (selectedIds.length === 0) {
      toast({
        title: "No entries selected",
        description: "Please select at least one entry to update.",
        variant: "destructive",
      });
      return;
    }

    setIsBulkUpdating(true);

    try {
      // Update each selected entry
      for (const id of selectedIds) {
        const entry = timeEntries.find((e) => e.id === id);
        if (entry) {
          await updateTimeEntry({
            ...entry,
            hours,
          });
        }
      }

      // Refresh the data
      const entries = await fetchTimeEntries(date);
      setTimeEntries(entries);

      toast({
        title: "Hours updated",
        description: `Updated ${selectedIds.length} entries to ${hours} hours.`,
      });
    } catch (error) {
      console.error("Failed to update hours:", error);
      toast({
        title: "Error",
        description: "Failed to update hours. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsBulkUpdating(false);
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
        <SiteHeader />
        {/* Section Cards*/}
        <div className="space-y-6 px-4 md:px-6 lg:px-8 pt-6 pb-6">
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
                <div className="text-2xl font-bold">{totalWorkers}</div>
                <p className="text-xs text-muted-foreground">
                  {totalWorkers} total active workers
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
                <p className="text-xs text-muted-foreground">
                  {activeProjects} total active projects
                </p>
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

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-md font-medium">
                Today's Time Entries
              </CardTitle>
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={isLoading}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    onClick={handleBulkUpdateToEightHours}
                    disabled={isBulkUpdating}
                  >
                    Set Selected to 8 Hours
                  </Button>
                  <div className="flex items-center space-x-2">
                    <Input
                      type="number"
                      step="0.5"
                      min="0"
                      max="24"
                      value={customHours}
                      onChange={(e) => setCustomHours(e.target.value)}
                      className="w-20 h-9"
                      placeholder="Hours"
                    />
                    <Button
                      variant="outline"
                      onClick={handleBulkUpdateToCustomHours}
                      disabled={isBulkUpdating}
                    >
                      Apply Custom Hours
                    </Button>
                  </div>
                </div>
              </div>

              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">
                        <Checkbox
                          checked={
                            timeEntries.length > 0 &&
                            timeEntries.every(
                              (entry) => selectedEntries[entry.id]
                            )
                          }
                          onCheckedChange={toggleSelectAll}
                          aria-label="Select all"
                        />
                      </TableHead>
                      <TableHead>Worker</TableHead>
                      <TableHead>Project</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-center">Hours</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {timeEntries.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">
                          No time entries found for today.
                        </TableCell>
                      </TableRow>
                    ) : (
                      timeEntries.map((entry) => (
                        <TableRow
                          key={entry.id}
                          className={entry.is_absent ? "bg-muted/50" : ""}
                        >
                          <TableCell>
                            <Checkbox
                              checked={!!selectedEntries[entry.id]}
                              onCheckedChange={() =>
                                toggleSelectEntry(entry.id)
                              }
                              aria-label={`Select ${entry.worker_name}`}
                            />
                          </TableCell>
                          <TableCell className="font-medium">
                            {entry.worker_name}
                          </TableCell>
                          <TableCell>{entry.project_name || "—"}</TableCell>
                          <TableCell>
                            {entry.is_absent ? (
                              <Badge variant="outline" className="bg-muted">
                                Absent
                              </Badge>
                            ) : !entry.clock_out ? (
                              <Badge>Active</Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className={
                                  entry.is_auto
                                    ? "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-400"
                                    : ""
                                }
                              >
                                {entry.is_auto ? "Auto" : "Manual"}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {entry.is_absent ? (
                              <span className="text-muted-foreground">
                                Absent
                              </span>
                            ) : editingEntry === entry.id ? (
                              <Input
                                type="number"
                                step="0.5"
                                min="0"
                                max="24"
                                className="w-16 h-8 text-center mx-auto"
                                defaultValue={entry.hours?.toString() || ""}
                                autoFocus
                                onBlur={(e) =>
                                  handleHoursChange(entry.id, e.target.value)
                                }
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    handleHoursChange(
                                      entry.id,
                                      e.currentTarget.value
                                    );
                                  } else if (e.key === "Escape") {
                                    setEditingEntry(null);
                                  }
                                }}
                              />
                            ) : (
                              <div
                                className="cursor-pointer hover:bg-muted/50 transition-colors p-2"
                                onClick={() => setEditingEntry(entry.id)}
                              >
                                {entry.hours != null
                                  ? Number.isInteger(entry.hours)
                                    ? entry.hours
                                    : parseFloat(entry.hours.toFixed(1))
                                  : "—"}
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
