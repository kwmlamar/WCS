"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { supabase } from "@/lib/supabaseClient"

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Plus, Trash2, Edit, FolderPlus, FolderX } from "lucide-react";
import { ProjectForm } from "./project-form";
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
import { fetchProjects } from "@/lib/data";
import type { Project } from "@/lib/types";
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

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setIsLoading(true);
    try {
      const data = await fetchProjects();
      setProjects(data);
    } catch (error) {
      console.error("Failed to fetch projects:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateProject = async (project: Omit<Project, "id">) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
  
    if (!user) return;
  
    const { data, error } = await supabase
      .from("projects")
      .insert([{ ...project, user_id: user.id }])
      .select()
      .single();
  
    if (error) {
      console.error("Create failed:", error);
      return;
    }
  
    setProjects([...projects, data]);
    setIsFormOpen(false);
  };

  const handleUpdateProject = async (project: Project) => {
    const { data, error } = await supabase
      .from("projects")
      .update(project)
      .eq("id", project.id)
      .select()
      .single();
    if (error) {
      console.error("Update failed:", error);
      return;
    }
    setProjects(projects.map((p) => (p.id === data.id ? data : p)));
    setSelectedProject(null);
    setIsFormOpen(false);
  };

  const handleDeleteProject = async () => {
    if (!selectedProject) return;
    const { error } = await supabase.from("projects").delete().eq("id", selectedProject.id);
    if (error) {
      console.error("Delete failed:", error);
      return;
    }
    setProjects(projects.filter((p) => p.id !== selectedProject.id));
    setSelectedProject(null);
    setIsDeleteDialogOpen(false);
  };

  const handleToggleActive = async (project: Project) => {
    const updated = { ...project, active: !project.active };
    const { data, error } = await supabase
      .from("projects")
      .update({ active: updated.active })
      .eq("id", updated.id)
      .select()
      .single();
    if (error) {
      console.error("Toggle failed:", error);
      return;
    }
    setProjects(projects.map((p) => (p.id === data.id ? data : p)));
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
            <h1 className="text-base font-medium">Projects Management</h1>
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
        {/* Insert Project Page */}
        <div className="space-y-6 px-4 md:px-6 lg:px-8 pt-6">
          <div className="flex justify-between items-center">
            <h2 className="text-3xl font-bold tracking-tight">
              Projects Management
            </h2>
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Project
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {selectedProject ? "Edit Project" : "Add New Project"}
                  </DialogTitle>
                  <DialogDescription>
                    {selectedProject
                      ? "Update the project's information below."
                      : "Fill in the details to add a new project."}
                  </DialogDescription>
                </DialogHeader>
                <ProjectForm
                  project={selectedProject}
                  onSubmit={
                    selectedProject ? handleUpdateProject : handleCreateProject
                  }
                  onCancel={() => {
                    setSelectedProject(null);
                    setIsFormOpen(false);
                  }}
                />
              </DialogContent>
            </Dialog>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <p>Loading projects...</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => (
                <Card key={project.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{project.name}</CardTitle>
                        <CardDescription>{project.description}</CardDescription>
                      </div>
                      <Badge variant={project.active ? "default" : "secondary"}>
                        {project.active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id={`active-${project.id}`}
                          checked={project.active}
                          onCheckedChange={() => handleToggleActive(project)}
                        />
                        <Label htmlFor={`active-${project.id}`}>
                          {project.active ? "Active" : "Inactive"}
                        </Label>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            setSelectedProject(project);
                            setIsFormOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <AlertDialog
                          open={
                            isDeleteDialogOpen &&
                            selectedProject?.id === project.id
                          }
                          onOpenChange={(open) => {
                            if (!open) {
                              setSelectedProject(null);
                            }
                            setIsDeleteDialogOpen(open);
                          }}
                        >
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => {
                                setSelectedProject(project);
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
                                This will permanently delete the project "
                                {project.name}". This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={handleDeleteProject}>
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

          {projects.length === 0 && !isLoading && (
            <div className="flex flex-col items-center justify-center h-64 border rounded-lg p-6">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-4">
                <FolderX className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">No projects found</h3>
              <p className="text-sm text-muted-foreground text-center mb-4">
                You haven't added any projects yet. Add your first project to
                get started.
              </p>
              <Button onClick={() => setIsFormOpen(true)}>
                <FolderPlus className="mr-2 h-4 w-4" />
                Add Your First Project
              </Button>
            </div>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
