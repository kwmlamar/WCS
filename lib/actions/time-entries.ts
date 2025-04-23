"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { format } from "date-fns"
import type { TimesheetEntry } from "@/lib/types"

export async function updateTimeEntry(workerId: string, date: string, hours: number | null) {
  const supabase = createClient()

  // Get clock-in settings for default times
  const { data: settingsData } = await supabase.from("settings").select("value").eq("key", "clock_in_settings").single()

  const settings = (settingsData?.value as { default_time: string; default_end_time: string }) || {
    default_time: "09:00",
    default_end_time: "17:00",
  }

  // Check if an entry already exists for this worker and date
  const { data: existingEntry } = await supabase
    .from("time_entries")
    .select("id, clock_in, clock_out")
    .eq("worker_id", workerId)
    .eq("date", date)
    .single()

  if (existingEntry) {
    // If entry exists, update it
    // For simplicity, we'll set clock_in to default time and calculate clock_out based on hours
    const clockInDate = new Date(date)
    const [hours, minutes] = settings.default_time.split(":").map(Number)
    clockInDate.setHours(hours, minutes, 0, 0)

    let clockOutDate = null
    if (hours !== null && hours > 0) {
      // If hours are provided, calculate clock_out based on hours
      clockOutDate = new Date(clockInDate)
      clockOutDate.setHours(clockInDate.getHours() + Math.floor(hours))
      clockOutDate.setMinutes(clockInDate.getMinutes() + Math.round((hours % 1) * 60))
    } else {
      // Otherwise use the default end time
      const [endHours, endMinutes] = settings.default_end_time.split(":").map(Number)
      clockOutDate = new Date(date)
      clockOutDate.setHours(endHours, endMinutes, 0, 0)
    }

    const { error } = await supabase
      .from("time_entries")
      .update({
        clock_in: clockInDate.toISOString(),
        clock_out: clockOutDate ? clockOutDate.toISOString() : null,
        hours: hours,
        is_absent: hours === null || hours === 0,
      })
      .eq("id", existingEntry.id)

    if (error) throw new Error(`Failed to update time entry: ${error.message}`)
  } else {
    // If no entry exists, create a new one
    const clockInDate = new Date(date)
    const [startHours, startMinutes] = settings.default_time.split(":").map(Number)
    clockInDate.setHours(startHours, startMinutes, 0, 0)

    let clockOutDate = null
    if (hours !== null && hours > 0) {
      // If hours are provided, calculate clock_out based on hours
      clockOutDate = new Date(clockInDate)
      clockOutDate.setHours(clockInDate.getHours() + Math.floor(hours))
      clockOutDate.setMinutes(clockInDate.getMinutes() + Math.round((hours % 1) * 60))
    } else {
      // Otherwise use the default end time
      const [endHours, endMinutes] = settings.default_end_time.split(":").map(Number)
      clockOutDate = new Date(date)
      clockOutDate.setHours(endHours, endMinutes, 0, 0)
    }

    // Get worker name
    const { data: worker } = await supabase.from("workers").select("name").eq("id", workerId).single()

    if (!worker) throw new Error(`Worker not found: ${workerId}`)

    const { error } = await supabase.from("time_entries").insert({
      worker_id: workerId,
      worker_name: worker.name,
      date: date,
      clock_in: hours && hours > 0 ? clockInDate.toISOString() : null,
      clock_out: clockOutDate ? clockOutDate.toISOString() : null,
      hours: hours,
      is_absent: hours === null || hours === 0,
      is_auto: false,
    })

    if (error) throw new Error(`Failed to create time entry: ${error.message}`)
  }

  // Revalidate the timesheets page to reflect the changes
  revalidatePath("/dashboard/timesheets")

  return { success: true }
}

// Function to fetch timesheet data from Supabase
export async function fetchTimesheetData(startDate: Date, endDate: Date, workerId?: string) {
  const supabase = createClient()

  // Format dates for query
  const startDateStr = format(startDate, "yyyy-MM-dd")
  const endDateStr = format(endDate, "yyyy-MM-dd")

  // Build query
  let query = supabase
    .from("time_entries")
    .select("worker_id, worker_name, date, hours, is_absent, project_id, project_name")
    .gte("date", startDateStr)
    .lte("date", endDateStr)

  // Add worker filter if provided
  if (workerId) {
    query = query.eq("worker_id", workerId)
  }

  const { data, error } = await query

  if (error) {
    console.error("Error fetching timesheet data:", error)
    return []
  }

  return data as TimesheetEntry[]
}

// Function to fetch all active workers
export async function fetchActiveWorkers() {
  const supabase = createClient()

  const { data, error } = await supabase.from("workers").select("id, name").eq("active", true)

  if (error) {
    console.error("Error fetching workers:", error)
    return []
  }

  return data
}
