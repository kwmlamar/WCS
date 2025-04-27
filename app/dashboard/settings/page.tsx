"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

import { toast } from "@/hooks/use-toast";
import { Loader2, Clock, Save } from "lucide-react";
import { TimeInput } from "../time-input";

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

export default function SettingsPage() {
  console.log("SettingsPage component is rendering...");
  const [settings, setSettings] = useState({
    workdays: {
      monday: true,
      tuesday: true,
      wednesday: true,
      thursday: true,
      friday: true,
      saturday: true,
      sunday: false,
    },
    defaultTimes: {
      startTime: "07:00",
      endTime: "16:00",
    },
    autoClockIn: false,
    autoClockOut: false,
    timezone: "America/New_York",
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("settings")
          .select("data")
          .eq("type", "user_settings")
          .single();

        if (error) throw error;

        if (data?.data) {
          setSettings(data.data);
        }
      } catch (error) {
        console.error("Failed to load settings:", error);
        toast({
          title: "Error loading settings",
          description:
            "There was an error loading your settings. Please try again.",
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
      const { error } = await supabase
        .from("settings")
        .upsert([{ type: "user_settings", data: settings }], {
          onConflict: "type",
        });

      if (error) throw error;

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
    setSettings((prev) => ({
      ...prev,
      workdays: {
        ...prev.workdays,
        [day]: !prev.workdays[day],
      },
    }));
  };

  const handleTimeChange = (type: "startTime" | "endTime", value: string) => {
    setSettings((prev) => ({
      ...prev,
      defaultTimes: {
        ...prev.defaultTimes,
        [type]: value,
      },
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2">Loading settings...</span>
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

        {/* Settings */}
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
                  <Button onClick={handleSaveSettings} disabled={isSaving} className="ml-auto">
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
                      <div className="flex items-center justify-between space-x-2">
                        <Label htmlFor="workday-monday" className="capitalize">
                          Monday
                        </Label>
                        <Switch
                          id="workday-monday"
                          checked={settings.workdays.monday}
                          onCheckedChange={() => handleWorkdayToggle("monday")}
                        />
                      </div>

                      <div className="flex items-center justify-between space-x-2">
                        <Label htmlFor="workday-tuesday" className="capitalize">
                          Tuesday
                        </Label>
                        <Switch
                          id="workday-tuesday"
                          checked={settings.workdays.tuesday}
                          onCheckedChange={() => handleWorkdayToggle("tuesday")}
                        />
                      </div>

                      <div className="flex items-center justify-between space-x-2">
                        <Label
                          htmlFor="workday-wednesday"
                          className="capitalize"
                        >
                          Wednesday
                        </Label>
                        <Switch
                          id="workday-wednesday"
                          checked={settings.workdays.wednesday}
                          onCheckedChange={() =>
                            handleWorkdayToggle("wednesday")
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between space-x-2">
                        <Label
                          htmlFor="workday-thursday"
                          className="capitalize"
                        >
                          Thursday
                        </Label>
                        <Switch
                          id="workday-thursday"
                          checked={settings.workdays.thursday}
                          onCheckedChange={() =>
                            handleWorkdayToggle("thursday")
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between space-x-2">
                        <Label htmlFor="workday-friday" className="capitalize">
                          Friday
                        </Label>
                        <Switch
                          id="workday-friday"
                          checked={settings.workdays.friday}
                          onCheckedChange={() => handleWorkdayToggle("friday")}
                        />
                      </div>

                      <div className="flex items-center justify-between space-x-2">
                        <Label
                          htmlFor="workday-saturday"
                          className="capitalize"
                        >
                          Saturday
                        </Label>
                        <Switch
                          id="workday-saturday"
                          checked={settings.workdays.saturday}
                          onCheckedChange={() =>
                            handleWorkdayToggle("saturday")
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between space-x-2">
                        <Label htmlFor="workday-sunday" className="capitalize">
                          Sunday
                        </Label>
                        <Switch
                          id="workday-sunday"
                          checked={settings.workdays.sunday}
                          onCheckedChange={() => handleWorkdayToggle("sunday")}
                        />
                      </div>
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
                <CardFooter >
                  <Button onClick={handleSaveSettings} disabled={isSaving} className="ml-auto">
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
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
