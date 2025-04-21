"use client";

import { useState, useEffect } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { Input } from "@/components/ui/input";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TimeInput } from "../time-input";
import { toast } from "@/hooks/use-toast";
import { Clock, Save } from "lucide-react";

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    workdays: {
      monday: true,
      tuesday: true,
      wednesday: true,
      thursday: true,
      friday: true,
      saturday: false,
      sunday: false,
    },
    defaultTimes: {
      startTime: "07:00",
      endTime: "16:00",
    },
    autoClockIn: true,
    autoClockOut: true,
    timezone: "America/New_York",
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      // In a real app, this would be an API call to save settings
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API call
      toast({
        title: "Settings saved",
        description: "Your settings have been saved successfully.",
      });
    } catch (error) {
      console.error("Failed to save settings:", error);
      toast({
        title: "Error saving settings",
        description:
          "There was an error saving your settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleWorkdayToggle = (day: keyof typeof settings.workdays) => {
    setSettings({
      ...settings,
      workdays: {
        ...settings.workdays,
        [day]: !settings.workdays[day],
      },
    });
  };

  const handleTimeChange = (type: "startTime" | "endTime", value: string) => {
    setSettings({
      ...settings,
      defaultTimes: {
        ...settings.defaultTimes,
        [type]: value,
      },
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
            <h1 className="text-base font-medium">Workers Management</h1>
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

        {/* Setting */}
        <div className="space-y-6 px-4 md:px-6 lg:px-8 pt-6">
          <div className="flex justify-between items-center">
            <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
            <p className="text-muted-foreground">
              Manage your application settings and preferences.
            </p>
          </div>

          <Tabs defaultValue="general">
            <TabsList>
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="workdays">Workdays & Hours</TabsTrigger>
              <TabsTrigger value="automation">Automation</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>General Settings</CardTitle>
                  <CardDescription>
                    Configure general application settings.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select
                      value={settings.timezone}
                      onValueChange={(value) =>
                        setSettings({ ...settings, timezone: value })
                      }
                    >
                      <SelectTrigger id="timezone">
                        <SelectValue placeholder="Select timezone" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="America/New_York">
                          Eastern Time (ET)
                        </SelectItem>
                        <SelectItem value="America/Chicago">
                          Central Time (CT)
                        </SelectItem>
                        <SelectItem value="America/Denver">
                          Mountain Time (MT)
                        </SelectItem>
                        <SelectItem value="America/Los_Angeles">
                          Pacific Time (PT)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button onClick={handleSaveSettings} disabled={isSaving}>
                    <Save className="mr-2 h-4 w-4" />
                    {isSaving ? "Saving..." : "Save Changes"}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="workdays" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Workdays & Hours</CardTitle>
                  <CardDescription>
                    Configure which days are considered workdays and default
                    working hours.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-4">Workdays</h3>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {Object.entries(settings.workdays).map(
                        ([day, isActive]) => (
                          <div
                            key={day}
                            className="flex items-center justify-between space-x-2"
                          >
                            <Label
                              htmlFor={`workday-${day}`}
                              className="capitalize"
                            >
                              {day}
                            </Label>
                            <Switch
                              id={`workday-${day}`}
                              checked={isActive}
                              onCheckedChange={() =>
                                handleWorkdayToggle(
                                  day as keyof typeof settings.workdays
                                )
                              }
                            />
                          </div>
                        )
                      )}
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-lg font-medium mb-4">
                      Default Working Hours
                    </h3>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="start-time">Default Start Time</Label>
                        <TimeInput
                          id="start-time"
                          value={settings.defaultTimes.startTime}
                          onChange={(value) =>
                            handleTimeChange("startTime", value)
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="end-time">Default End Time</Label>
                        <TimeInput
                          id="end-time"
                          value={settings.defaultTimes.endTime}
                          onChange={(value) =>
                            handleTimeChange("endTime", value)
                          }
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button onClick={handleSaveSettings} disabled={isSaving}>
                    <Save className="mr-2 h-4 w-4" />
                    {isSaving ? "Saving..." : "Save Changes"}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="automation" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Automation Settings</CardTitle>
                  <CardDescription>
                    Configure automatic clock-in and clock-out settings.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between space-x-2">
                    <div className="space-y-0.5">
                      <Label htmlFor="auto-clock-in">Automatic Clock-In</Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically clock in workers at the start of each
                        workday.
                      </p>
                    </div>
                    <Switch
                      id="auto-clock-in"
                      checked={settings.autoClockIn}
                      onCheckedChange={(checked) =>
                        setSettings({ ...settings, autoClockIn: checked })
                      }
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between space-x-2">
                    <div className="space-y-0.5">
                      <Label htmlFor="auto-clock-out">
                        Automatic Clock-Out
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically clock out workers at the end of each
                        workday.
                      </p>
                    </div>
                    <Switch
                      id="auto-clock-out"
                      checked={settings.autoClockOut}
                      onCheckedChange={(checked) =>
                        setSettings({ ...settings, autoClockOut: checked })
                      }
                    />
                  </div>

                  {settings.autoClockIn && (
                    <>
                      <Separator />
                      <div className="space-y-2">
                        <Label>Auto Clock-In Job Schedule</Label>
                        <div className="flex items-center space-x-2 rounded-md border p-4">
                          <Clock className="h-5 w-5 text-muted-foreground" />
                          <div className="flex-1 space-y-1">
                            <p className="text-sm font-medium leading-none">
                              Daily at {settings.defaultTimes.startTime}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              On configured workdays
                            </p>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
                <CardFooter>
                  <Button onClick={handleSaveSettings} disabled={isSaving}>
                    <Save className="mr-2 h-4 w-4" />
                    {isSaving ? "Saving..." : "Save Changes"}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
