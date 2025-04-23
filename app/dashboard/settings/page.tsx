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
import {
  getClockInSettings,
  updateClockInSettings,
  type ClockInSettings,
} from "@/lib/services/settings";

export default function SettingsPage() {
  const [settings, setSettings] = useState<{
    workdays: {
      monday: boolean;
      tuesday: boolean;
      wednesday: boolean;
      thursday: boolean;
      friday: boolean;
      saturday: boolean;
      sunday: boolean;
    };
    defaultTimes: {
      startTime: string;
      endTime: string; // Add this line
    };
    autoClockIn: boolean;
    timezone: string;
  }>({
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
      startTime: "09:00",
      endTime: "17:00", // Add default end time (5:00 PM)
    },
    autoClockIn: true,
    timezone: "America/New_York",
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const clockInSettings = await getClockInSettings();

        setSettings({
          workdays: clockInSettings.workdays,
          defaultTimes: {
            startTime: clockInSettings.default_time,
            endTime: clockInSettings.default_end_time, // Add this line
          },
          autoClockIn: clockInSettings.auto_clock_in,
          timezone: "America/New_York", // This could also come from settings
        });
      } catch (error) {
        console.error("Failed to load settings:", error);
        toast({
          title: "Error loading settings",
          description:
            "There was an error loading your settings. Default values are shown.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      // Convert our UI settings to the format expected by the settings service
      const clockInSettings: ClockInSettings = {
        default_time: settings.defaultTimes.startTime,
        default_end_time: settings.defaultTimes.endTime, // Add this line
        auto_clock_in: settings.autoClockIn,
        workdays: settings.workdays,
      };

      await updateClockInSettings(clockInSettings);

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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p>Loading settings...</p>
      </div>
    );
  }
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
                        <Label htmlFor="start-time">
                          Default Clock-In Time
                        </Label>
                        <TimeInput
                          id="start-time"
                          value={settings.defaultTimes.startTime}
                          onChange={(value) =>
                            handleTimeChange("startTime", value)
                          }
                        />
                        <p className="text-sm text-muted-foreground mt-1">
                          This time will be used for automatic clock-ins and as
                          the default for manual entries.
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="end-time">Default Clock-Out Time</Label>
                        <TimeInput
                          id="end-time"
                          value={settings.defaultTimes.endTime}
                          onChange={(value) =>
                            handleTimeChange("endTime", value)
                          }
                        />
                        <p className="text-sm text-muted-foreground mt-1">
                          This time will be used for automatic clock-outs and as
                          the default for manual entries.
                        </p>
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
