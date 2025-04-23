// Follow the Supabase Edge Function setup instructions to deploy this
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

// This would be triggered by a cron job or scheduled function
Deno.serve(async (req) => {
  try {
    // Get the Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || ""
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get the current date
    const now = new Date()
    const today = now.toISOString().split("T")[0] // YYYY-MM-DD

    // Get the day of the week (0 = Sunday, 1 = Monday, etc.)
    const dayOfWeek = now.getDay()
    const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]
    const todayName = dayNames[dayOfWeek]

    // Get clock-in settings
    const { data: settingsData, error: settingsError } = await supabase
      .from("settings")
      .select("value")
      .eq("key", "clock_in_settings")
      .single()

    if (settingsError) {
      throw new Error(`Failed to get settings: ${settingsError.message}`)
    }

    const settings = settingsData.value

    // Check if auto clock-in is enabled and if today is a workday
    if (!settings.auto_clock_in || !settings.workdays[todayName]) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "Auto clock-in skipped: disabled or not a workday",
        }),
        {
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    // Get all active workers
    const { data: workers, error: workersError } = await supabase.from("workers").select("id, name").eq("active", true)

    if (workersError) {
      throw new Error(`Failed to get workers: ${workersError.message}`)
    }

    // Get the default clock-in time
    const defaultTime = settings.default_time
    const [hours, minutes] = defaultTime.split(":").map(Number)

    // Create clock-in entries for all active workers
    const clockInDate = new Date(today)
    clockInDate.setHours(hours, minutes, 0, 0)

    // Check if entries already exist for today
    const { data: existingEntries, error: existingError } = await supabase
      .from("time_entries")
      .select("worker_id")
      .eq("date", today)

    if (existingError) {
      throw new Error(`Failed to check existing entries: ${existingError.message}`)
    }

    // Filter out workers who already have entries
    const existingWorkerIds = new Set(existingEntries.map((entry) => entry.worker_id))
    const workersToClockIn = workers.filter((worker) => !existingWorkerIds.has(worker.id))

    if (workersToClockIn.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "All workers already have entries for today",
        }),
        {
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    // Create time entries for each worker
    const timeEntries = workersToClockIn.map((worker) => ({
      worker_id: worker.id,
      worker_name: worker.name,
      date: today,
      clock_in: clockInDate.toISOString(),
      clock_out: null,
      hours: null,
      is_absent: false,
      is_auto: true,
    }))

    const { error: insertError } = await supabase.from("time_entries").insert(timeEntries)

    if (insertError) {
      throw new Error(`Failed to insert time entries: ${insertError.message}`)
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Auto clock-in completed for ${timeEntries.length} workers`,
      }),
      {
        headers: { "Content-Type": "application/json" },
      },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
})
