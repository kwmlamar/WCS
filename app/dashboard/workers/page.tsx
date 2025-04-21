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
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Plus, Trash2, Edit, UserCheck, UserX } from "lucide-react";
import { WorkerForm } from "./worker-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { fetchWorkers } from "@/lib/data";
import type { Worker } from "@/lib/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import { supabase } from "@/lib/supabaseClient";

export default function WorkersPage() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  useEffect(() => {
    loadWorkers();
  }, []);

  const loadWorkers = async () => {
    setIsLoading(true);
    try {
      const data = await fetchWorkers();
      setWorkers(data);
    } catch (error) {
      console.error("Failed to fetch workers:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateWorker = async (worker: Omit<Worker, "id">) => {
    // In a real app, this would be an API call to create a worker
    const newWorker = {
      id: Date.now().toString(),
      ...worker,
    };
    setWorkers([...workers, newWorker]);
    setIsFormOpen(false);
  };

  const handleUpdateWorker = async (worker: Worker) => {
    // In a real app, this would be an API call to update a worker
    setWorkers(workers.map((w) => (w.id === worker.id ? worker : w)));
    setSelectedWorker(null);
    setIsFormOpen(false);
  };

  const handleDeleteWorker = async () => {
    if (!selectedWorker) return;

    // In a real app, this would be an API call to delete a worker
    setWorkers(workers.filter((w) => w.id !== selectedWorker.id));
    setSelectedWorker(null);
    setIsDeleteDialogOpen(false);
  };

  const handleToggleActive = async (worker: Worker) => {
    // In a real app, this would be an API call to update a worker's active status
    const updatedWorker = { ...worker, active: !worker.active };
    setWorkers(workers.map((w) => (w.id === worker.id ? updatedWorker : w)));
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

        {/* Add Worker Section */}
        <div className="space-y-6 px-4 md:px-6 lg:px-8 pt-6">
          <div className="flex justify-between items-center">
            <h2 className="text-3xl font-bold tracking-tight">
              Workers Management
            </h2>
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Worker
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {selectedWorker ? "Edit Worker" : "Add New Worker"}
                  </DialogTitle>
                  <DialogDescription>
                    {selectedWorker
                      ? "Update the worker's information below."
                      : "Fill in the details to add a new worker."}
                  </DialogDescription>
                </DialogHeader>
                <WorkerForm
                  worker={selectedWorker}
                  onSubmit={
                    selectedWorker ? handleUpdateWorker : handleCreateWorker
                  }
                  onCancel={() => {
                    setSelectedWorker(null);
                    setIsFormOpen(false);
                  }}
                />
              </DialogContent>
            </Dialog>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <p>Loading workers...</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {workers.map((worker) => (
                <Card key={worker.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{worker.name}</CardTitle>
                        <CardDescription>{worker.email}</CardDescription>
                      </div>
                      <Badge variant={worker.active ? "default" : "secondary"}>
                        {worker.active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id={`active-${worker.id}`}
                          checked={worker.active}
                          onCheckedChange={() => handleToggleActive(worker)}
                        />
                        <Label htmlFor={`active-${worker.id}`}>
                          {worker.active ? "Active" : "Inactive"}
                        </Label>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            setSelectedWorker(worker);
                            setIsFormOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <AlertDialog
                          open={
                            isDeleteDialogOpen &&
                            selectedWorker?.id === worker.id
                          }
                          onOpenChange={(open) => {
                            if (!open) {
                              setSelectedWorker(null);
                            }
                            setIsDeleteDialogOpen(open);
                          }}
                        >
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => {
                                setSelectedWorker(worker);
                                setIsDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete {worker.name} and
                                all associated time entries. This action cannot
                                be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={handleDeleteWorker}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {workers.length === 0 && !isLoading && (
            <div className="flex flex-col items-center justify-center h-64 border rounded-lg p-6">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-4">
                <UserX className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">No workers found</h3>
              <p className="text-sm text-muted-foreground text-center mb-4">
                You haven't added any workers yet. Add your first worker to get
                started.
              </p>
              <Button onClick={() => setIsFormOpen(true)}>
                <UserCheck className="mr-2 h-4 w-4" />
                Add Your First Worker
              </Button>
            </div>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
