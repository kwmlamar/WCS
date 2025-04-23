"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export interface ClockInSettings {
  default_time: string
  default_end_time: string // Add this line
  auto_clock_in: boolean
  workdays: {
    monday: boolean
    tuesday: boolean
    wednesday: boolean
    thursday: boolean
    friday: boolean
    saturday: boolean
    sunday: boolean
  }
}

export async function getClockInSettings(): Promise<ClockInSettings> {
  const supabase = createClient()

  const { data, error } = await supabase.from("settings").select("value").eq("key", "clock_in_settings").single()

  if (error) {
    console.error("Error fetching clock-in settings:", error)
    // Return default settings if we can't fetch from the database
    return {
      default_time: "09:00",
      default_end_time: "17:00", // Add default end time (5:00 PM)
      auto_clock_in: true,
      workdays: {
        monday: true,
        tuesday: true,
        wednesday: true,
        thursday: true,
        friday: true,
        saturday: false,
        sunday: false,
      },
    }
  }

  return data.value as ClockInSettings
}

export async function updateClockInSettings(settings: ClockInSettings) {
  const supabase = createClient()

  const { error } = await supabase.from("settings").update({ value: settings }).eq("key", "clock_in_settings")

  if (error) {
    console.error("Error updating clock-in settings:", error)
    throw new Error(`Failed to update settings: ${error.message}`)
  }

  revalidatePath("/dashboard/settings")

  return { success: true }
}
