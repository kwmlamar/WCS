"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { Worker } from "@/lib/types"

export async function fetchWorkers(): Promise<Worker[]> {
  const supabase = createClient()

  const { data, error } = await supabase.from("workers").select("*")

  if (error) {
    console.error("Error fetching workers:", error)
    return []
  }

  return data as Worker[]
}

export async function createWorker(worker: Omit<Worker, "id">): Promise<Worker | null> {
  const supabase = createClient()

  const { data, error } = await supabase.from("workers").insert(worker).select().single()

  if (error) {
    console.error("Error creating worker:", error)
    return null
  }

  revalidatePath("/dashboard/workers")
  return data as Worker
}

export async function updateWorker(worker: Worker): Promise<Worker | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("workers")
    .update({
      name: worker.name,
      email: worker.email,
      hourly_rate: worker.hourly_rate,
      active: worker.active,
    })
    .eq("id", worker.id)
    .select()
    .single()

  if (error) {
    console.error("Error updating worker:", error)
    return null
  }

  revalidatePath("/dashboard/workers")
  return data as Worker
}

export async function deleteWorker(id: string): Promise<boolean> {
  const supabase = createClient()

  const { error } = await supabase.from("workers").delete().eq("id", id)

  if (error) {
    console.error("Error deleting worker:", error)
    return false
  }

  revalidatePath("/dashboard/workers")
  return true
}
