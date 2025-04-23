"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { Project } from "@/lib/types"

export async function fetchProjects(): Promise<Project[]> {
  const supabase = createClient()

  const { data, error } = await supabase.from("projects").select("*")

  if (error) {
    console.error("Error fetching projects:", error)
    return []
  }

  return data as Project[]
}

export async function createProject(project: Omit<Project, "id">): Promise<Project | null> {
  const supabase = createClient()

  const { data, error } = await supabase.from("projects").insert(project).select().single()

  if (error) {
    console.error("Error creating project:", error)
    return null
  }

  revalidatePath("/dashboard/projects")
  return data as Project
}

export async function updateProject(project: Project): Promise<Project | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("projects")
    .update({
      name: project.name,
      description: project.description,
      active: project.active,
    })
    .eq("id", project.id)
    .select()
    .single()

  if (error) {
    console.error("Error updating project:", error)
    return null
  }

  revalidatePath("/dashboard/projects")
  return data as Project
}

export async function deleteProject(id: string): Promise<boolean> {
  const supabase = createClient()

  const { error } = await supabase.from("projects").delete().eq("id", id)

  if (error) {
    console.error("Error deleting project:", error)
    return false
  }

  revalidatePath("/dashboard/projects")
  return true
}
