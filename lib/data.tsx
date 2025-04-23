import { supabase } from "./supabaseClient"
import type { Worker, Project, TimeEntry, TimesheetEntry, PayrollEntry, PayrollSettings } from "./types"
import { format, differenceInDays } from "date-fns"

// Mock data for workers
// const mockWorkers: Worker[] = [
//   { id: "1", name: "John Doe", email: "john@example.com", active: true, hourly_rate: 25 },
//   { id: "2", name: "Jane Smith", email: "jane@example.com", active: true, hourly_rate: 28 },
//   { id: "3", name: "Bob Johnson", email: "bob@example.com", active: true, hourly_rate: 22 },
//   { id: "4", name: "Alice Williams", email: "alice@example.com", active: false, hourly_rate: 24 },
// ]

// Mock data for projects
// const mockProjects: Project[] = [
//   { id: "1", name: "Site A", description: "Construction at Site A", active: true },
//   { id: "2", name: "Site B", description: "Renovation at Site B", active: true },
//   { id: "3", name: "Site C", description: "Maintenance at Site C", active: false },
// ]

// Mock payroll settings
// const mockPayrollSettings: PayrollSettings = {
//   overtime_threshold: 40, // Hours per week
//   overtime_rate: 1.5, // Time and a half
//   tax_rate: 0.2, // 20% tax
//   default_deductions: 0.05, // 5% for benefits, insurance, etc.
// }

// Mock payroll entries
const mockPayrollEntries: PayrollEntry[] = []

// Generate mock time entries for a given date
// function generateMockTimeEntries(date: Date): TimeEntry[] {
//   const dateStr = format(date, "yyyy-MM-dd")
//   const isWeekend = [0, 6].includes(date.getDay()) // 0 = Sunday, 6 = Saturday

//   return mockWorkers
//     .filter((worker) => worker.active)
//     .map((worker) => {
//       // Randomly determine if worker is absent (more likely on weekends)
//       const isAbsent = isWeekend ? Math.random() < 0.7 : Math.random() < 0.1

//       if (isAbsent) {
//         return {
//           id: `${dateStr}-${worker.id}`,
//           worker_id: worker.id,
//           worker_name: worker.name,
//           project_id: null,
//           project_name: null,
//           date: dateStr,
//           clock_in: null,
//           clock_out: null,
//           hours: null,
//           is_absent: true,
//           is_auto: true,
//         }
//       }

//       // Randomly assign a project (or no project)
//       const activeProjects = mockProjects.filter((p) => p.active)
//       const projectIndex = Math.floor(Math.random() * (activeProjects.length + 1)) - 1
//       const project = projectIndex >= 0 ? activeProjects[projectIndex] : null

//       // Generate clock in time (around 7 AM with some variation)
//       const clockInHour = 7
//       const clockInMinute = Math.floor(Math.random() * 30)
//       const clockInDate = new Date(date)
//       clockInDate.setHours(clockInHour, clockInMinute, 0, 0)

//       // Generate clock out time (around 4 PM with some variation)
//       const clockOutHour = 16
//       const clockOutMinute = Math.floor(Math.random() * 30)
//       const clockOutDate = new Date(date)
//       clockOutDate.setHours(clockOutHour, clockOutMinute, 0, 0)

//       // Calculate hours worked
//       const hours = (clockOutDate.getTime() - clockInDate.getTime()) / (1000 * 60 * 60)

//       return {
//         id: `${dateStr}-${worker.id}`,
//         worker_id: worker.id,
//         worker_name: worker.name,
//         project_id: project?.id || null,
//         project_name: project?.name || null,
//         date: dateStr,
//         clock_in: clockInDate.toISOString(),
//         clock_out: clockOutDate.toISOString(),
//         hours: Math.round(hours * 10) / 10, // Round to 1 decimal place
//         is_absent: false,
//         is_auto: true,
//       }
//     })
// }

// Fetch workers
export async function fetchWorkers(): Promise<Worker[]> {
  const { data, error } = await supabase.from("workers").select("*").order("name")

  if (error) {
    console.error("Error fetching workers:", error)
    return []
  }

  return data as Worker[]
}

// Create worker
export async function createWorker(worker: Omit<Worker, "id">): Promise<Worker | null> {
  const { data, error } = await supabase.from("workers").insert(worker).select().single()

  if (error) {
    console.error("Error creating worker:", error)
    return null
  }

  return data as Worker
}

// Update worker
export async function updateWorker(worker: Worker): Promise<Worker | null> {
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

  return data as Worker
}

// Delete worker
export async function deleteWorker(id: string): Promise<boolean> {
  const { error } = await supabase.from("workers").delete().eq("id", id)

  if (error) {
    console.error("Error deleting worker:", error)
    return false
  }

  return true
}

// Fetch projects
export async function fetchProjects(): Promise<Project[]> {
  const { data, error } = await supabase.from("projects").select("*").order("name")

  if (error) {
    console.error("Error fetching projects:", error)
    return []
  }

  return data as Project[]
}

// Create project
export async function createProject(project: Omit<Project, "id">): Promise<Project | null> {
  const { data, error } = await supabase.from("projects").insert(project).select().single()

  if (error) {
    console.error("Error creating project:", error)
    return null
  }

  return data as Project
}

// Update project
export async function updateProject(project: Project): Promise<Project | null> {
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

  return data as Project
}

// Delete project
export async function deleteProject(id: string): Promise<boolean> {
  const { error } = await supabase.from("projects").delete().eq("id", id)

  if (error) {
    console.error("Error deleting project:", error)
    return false
  }

  return true
}

// Fetch time entries for a specific date
export async function fetchTimeEntries(date: Date): Promise<TimeEntry[]> {
  const dateStr = format(date, "yyyy-MM-dd")

  const { data, error } = await supabase.from("time_entries").select("*").eq("date", dateStr)

  if (error) {
    console.error("Error fetching time entries:", error)
    return []
  }

  return data as TimeEntry[]
}

// Create time entry
export async function createTimeEntry(entry: Omit<TimeEntry, "id">): Promise<TimeEntry | null> {
  const { data, error } = await supabase.from("time_entries").insert(entry).select().single()

  if (error) {
    console.error("Error creating time entry:", error)
    return null
  }

  return data as TimeEntry
}

// Update time entry
export async function updateTimeEntry(entry: TimeEntry): Promise<TimeEntry | null> {
  const { data, error } = await supabase
    .from("time_entries")
    .update({
      worker_id: entry.worker_id,
      worker_name: entry.worker_name,
      project_id: entry.project_id,
      project_name: entry.project_name,
      date: entry.date,
      clock_in: entry.clock_in,
      clock_out: entry.clock_out,
      hours: entry.hours,
      is_absent: entry.is_absent,
      is_auto: entry.is_auto,
    })
    .eq("id", entry.id)
    .select()
    .single()

  if (error) {
    console.error("Error updating time entry:", error)
    return null
  }

  return data as TimeEntry
}

// Delete time entry
export async function deleteTimeEntry(id: string): Promise<boolean> {
  const { error } = await supabase.from("time_entries").delete().eq("id", id)

  if (error) {
    console.error("Error deleting time entry:", error)
    return false
  }

  return true
}

// Create a test time entry (for testing purposes)
export async function createTestTimeEntry(workerId: string, date: Date): Promise<TimeEntry | null> {
  // Get worker details
  const { data: worker } = await supabase.from("workers").select("name").eq("id", workerId).single()

  if (!worker) {
    console.error("Worker not found")
    return null
  }

  // Create a test time entry
  const dateStr = format(date, "yyyy-MM-dd")

  // Set clock in to 9 AM
  const clockInDate = new Date(date)
  clockInDate.setHours(9, 0, 0, 0)

  // Set clock out to 5 PM
  const clockOutDate = new Date(date)
  clockOutDate.setHours(17, 0, 0, 0)

  // Calculate hours
  const hours = 8.0

  const entry: Omit<TimeEntry, "id"> = {
    worker_id: workerId,
    worker_name: worker.name,
    project_id: null,
    project_name: null,
    date: dateStr,
    clock_in: clockInDate.toISOString(),
    clock_out: clockOutDate.toISOString(),
    hours: hours,
    is_absent: false,
    is_auto: false,
  }

  const { data, error } = await supabase.from("time_entries").insert(entry).select().single()

  if (error) {
    console.error("Error creating test time entry:", error)
    return null
  }

  return data as TimeEntry
}

// Test function to check if time_entries table is working
export async function testTimeEntriesTable(): Promise<{ success: boolean; message: string }> {
  try {
    // 1. Check if the table exists
    const { data: tableExists, error: tableError } = await supabase.from("time_entries").select("id").limit(1)

    if (tableError && tableError.code === "42P01") {
      // Table doesn't exist
      return {
        success: false,
        message: "The time_entries table does not exist. Please run the database migrations.",
      }
    }

    // 2. Get a worker to use for testing
    const { data: workers, error: workersError } = await supabase.from("workers").select("id").limit(1)

    if (workersError) {
      return {
        success: false,
        message: "Error fetching workers: " + workersError.message,
      }
    }

    if (!workers || workers.length === 0) {
      return {
        success: false,
        message: "No workers found. Please create a worker first.",
      }
    }

    const workerId = workers[0].id

    // 3. Create a test time entry
    const today = new Date()
    const testEntry = await createTestTimeEntry(workerId, today)

    if (!testEntry) {
      return {
        success: false,
        message: "Failed to create a test time entry.",
      }
    }

    // 4. Fetch the created entry
    const { data: fetchedEntry, error: fetchError } = await supabase
      .from("time_entries")
      .select("*")
      .eq("id", testEntry.id)
      .single()

    if (fetchError) {
      return {
        success: false,
        message: "Failed to fetch the created time entry: " + fetchError.message,
      }
    }

    // 5. Delete the test entry
    const { error: deleteError } = await supabase.from("time_entries").delete().eq("id", testEntry.id)

    if (deleteError) {
      return {
        success: false,
        message: "Failed to delete the test time entry: " + deleteError.message,
      }
    }

    return {
      success: true,
      message: "The time_entries table is working correctly! Created, fetched, and deleted a test entry successfully.",
    }
  } catch (error) {
    return {
      success: false,
      message: "An unexpected error occurred: " + (error instanceof Error ? error.message : String(error)),
    }
  }
}

// Fetch timesheet data for a date range
export async function fetchTimesheetData(startDate: Date, endDate: Date, workerId?: string): Promise<TimesheetEntry[]> {
  const startDateStr = format(startDate, "yyyy-MM-dd")
  const endDateStr = format(endDate, "yyyy-MM-dd")

  let query = supabase
    .from("time_entries")
    .select("worker_id, worker_name, date, hours, is_absent, project_id, project_name")
    .gte("date", startDateStr)
    .lte("date", endDateStr)

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

// Generate timesheet data for export
export async function generateTimesheet(startDate: Date, endDate: Date, workerId: string): Promise<any[]> {
  // Simulate API call delay
  // await new Promise((resolve) => setTimeout(resolve, 1000))

  // Get timesheet data
  const data = await fetchTimesheetData(startDate, endDate, workerId === "all" ? undefined : workerId)

  // Format for CSV export
  const headers = {
    worker_name: "Worker Name",
    date: "Date",
    hours: "Hours",
    project_name: "Project",
    is_absent: "Absent",
  }

  // Add headers as first row
  const result = [headers]

  // Add data rows
  data.forEach((entry) => {
    result.push({
      worker_name: entry.worker_name,
      date: entry.date,
      hours: entry.is_absent ? "ABSENT" : entry.hours?.toString() || "0",
      project_name: entry.project_name || "No Project",
      is_absent: entry.is_absent ? "Yes" : "No",
    })
  })

  return result
}

// Fetch payroll settings
export async function fetchPayrollSettings(): Promise<PayrollSettings> {
  const { data, error } = await supabase.from("settings").select("value").eq("key", "payroll_settings").single()

  if (error) {
    console.error("Error fetching payroll settings:", error)
    // Return default settings if not found
    return {
      overtime_threshold: 40,
      overtime_rate: 1.5,
      tax_rate: 0.2,
      default_deductions: 0.05,
    }
  }

  return data.value as PayrollSettings
}

// Update payroll settings
export async function updatePayrollSettings(settings: PayrollSettings): Promise<PayrollSettings> {
  // Simulate API call delay
  // await new Promise((resolve) => setTimeout(resolve, 800))

  // Update mock settings
  // Object.assign(mockPayrollSettings, settings)

  // return { ...mockPayrollSettings }
  const { data, error } = await supabase
    .from("settings")
    .upsert(
      {
        key: "payroll_settings",
        value: settings,
      },
      {
        onConflict: "key",
      },
    )
    .select()
    .single()

  if (error) {
    console.error("Error updating payroll settings:", error)
    throw new Error("Failed to update payroll settings")
  }

  return settings
}

// Calculate payroll for a specific period
export async function calculatePayroll(startDate: Date, endDate: Date, workerId?: string): Promise<PayrollEntry[]> {
  // Simulate API call delay
  // await new Promise((resolve) => setTimeout(resolve, 1200))

  // Get timesheet data for the period
  const timesheetData = await fetchTimesheetData(startDate, endDate, workerId)

  // Get workers data
  const workers = await fetchWorkers()

  // Get payroll settings
  const settings = await fetchPayrollSettings()

  // Group timesheet data by worker
  const workerHours: Record<
    string,
    {
      totalHours: number
      worker: Worker | undefined
    }
  > = {}

  timesheetData.forEach((entry) => {
    if (!entry.is_absent && entry.hours) {
      if (!workerHours[entry.worker_id]) {
        workerHours[entry.worker_id] = {
          totalHours: 0,
          worker: workers.find((w) => w.id === entry.worker_id),
        }
      }
      workerHours[entry.worker_id].totalHours += entry.hours
    }
  })

  // Calculate payroll for each worker
  const payrollEntries: PayrollEntry[] = []

  for (const workerId in workerHours) {
    const { totalHours, worker } = workerHours[workerId]

    if (!worker) continue

    // Calculate regular and overtime hours
    const daysInPeriod = differenceInDays(endDate, startDate) + 1
    const weeksInPeriod = daysInPeriod / 7
    const overtimeThreshold = settings.overtime_threshold * weeksInPeriod

    const regularHours = Math.min(totalHours, overtimeThreshold)
    const overtimeHours = Math.max(0, totalHours - overtimeThreshold)

    // Calculate pay
    const regularPay = regularHours * worker.hourly_rate
    const overtimePay = overtimeHours * worker.hourly_rate * settings.overtime_rate
    const grossPay = regularPay + overtimePay

    // Calculate deductions
    const taxDeduction = grossPay * settings.tax_rate
    const otherDeductions = grossPay * settings.default_deductions
    const totalDeductions = taxDeduction + otherDeductions

    // Calculate net pay
    const netPay = grossPay - totalDeductions

    // Create payroll entry
    const payrollEntry: PayrollEntry = {
      id: `payroll-${format(startDate, "yyyy-MM-dd")}-${format(endDate, "yyyy-MM-dd")}-${workerId}`,
      worker_id: workerId,
      worker_name: worker.name,
      period_start: format(startDate, "yyyy-MM-dd"),
      period_end: format(endDate, "yyyy-MM-dd"),
      regular_hours: Number.parseFloat(regularHours.toFixed(1)),
      overtime_hours: Number.parseFloat(overtimeHours.toFixed(1)),
      hourly_rate: worker.hourly_rate,
      gross_pay: Number.parseFloat(grossPay.toFixed(2)),
      deductions: Number.parseFloat(totalDeductions.toFixed(2)),
      net_pay: Number.parseFloat(netPay.toFixed(2)),
      status: "unpaid",
      payment_date: null,
    }

    payrollEntries.push(payrollEntry)
  }

  return payrollEntries
}

// Fetch payroll entries
export async function fetchPayrollEntries(startDate: Date, endDate: Date, workerId?: string): Promise<PayrollEntry[]> {
  // Check if we have existing entries for this period
  // const existingEntries = mockPayrollEntries.filter((entry) => {
  //   const entryStartDate = parseISO(entry.period_start)
  //   const entryEndDate = parseISO(entry.period_end)

  //   // Check if the periods overlap
  //   return entryStartDate <= endDate && entryEndDate >= startDate && (!workerId || entry.worker_id === workerId)
  // })

  // if (existingEntries.length > 0) {
  //   // Simulate API call delay
  //   await new Promise((resolve) => setTimeout(resolve, 800))
  //   return [...existingEntries]
  // }

  // Calculate new payroll entries
  // const newEntries = await calculatePayroll(startDate, endDate, workerId)

  // Add to mock data
  // mockPayrollEntries.push(...newEntries)

  // return newEntries
  // For now, we'll calculate payroll entries on the fly
  // In a real app, you might store these in a separate table
  return calculatePayroll(startDate, endDate, workerId)
}

// Update payroll entry
export async function updatePayrollEntry(entry: PayrollEntry): Promise<PayrollEntry> {
  // Simulate API call delay
  // await new Promise((resolve) => setTimeout(resolve, 800))

  // Find and update the entry
  // const index = mockPayrollEntries.findIndex((e) => e.id === entry.id)

  // if (index >= 0) {
  //   mockPayrollEntries[index] = { ...entry }
  //   return { ...entry }
  // }

  // If not found, add it
  // mockPayrollEntries.push(entry)
  // return entry
  // In a real app, you would update this in a database
  // For now, we'll just return the updated entry
  return entry
}

// Mark payroll as paid
export async function markPayrollAsPaid(entryIds: string[]): Promise<PayrollEntry[]> {
  // Simulate API call delay
  // await new Promise((resolve) => setTimeout(resolve, 1000))

  // const updatedEntries: PayrollEntry[] = []

  // entryIds.forEach((id) => {
  //   const index = mockPayrollEntries.findIndex((e) => e.id === id)

  //   if (index >= 0) {
  //     mockPayrollEntries[index] = {
  //       ...mockPayrollEntries[index],
  //       status: "paid",
  //       payment_date: format(new Date(), "yyyy-MM-dd"),
  //     }

  //     updatedEntries.push({ ...mockPayrollEntries[index] })
  //   }
  // })

  // return updatedEntries
  // In a real app, you would update this in a database
  // For now, we'll just return mock data
  const updatedEntries: PayrollEntry[] = []

  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 1000))

  return updatedEntries
}

// Generate payroll report for export
export async function generatePayrollReport(startDate: Date, endDate: Date, workerId?: string): Promise<any[]> {
  // Simulate API call delay
  // await new Promise((resolve) => setTimeout(resolve, 1000))

  // Get payroll data
  const payrollData = await fetchPayrollEntries(startDate, endDate, workerId)

  // Format for CSV export
  const headers = {
    worker_name: "Worker Name",
    period: "Pay Period",
    regular_hours: "Regular Hours",
    overtime_hours: "Overtime Hours",
    hourly_rate: "Hourly Rate",
    gross_pay: "Gross Pay",
    deductions: "Deductions",
    net_pay: "Net Pay",
    status: "Payment Status",
    payment_date: "Payment Date",
  }

  // Add headers as first row
  const result = [headers]

  // Add data rows
  payrollData.forEach((entry) => {
    result.push({
      worker_name: entry.worker_name,
      period: `${entry.period_start} to ${entry.period_end}`,
      regular_hours: entry.regular_hours.toString(),
      overtime_hours: entry.overtime_hours.toString(),
      hourly_rate: `$${entry.hourly_rate.toFixed(2)}`,
      gross_pay: `$${entry.gross_pay.toFixed(2)}`,
      deductions: `$${entry.deductions.toFixed(2)}`,
      net_pay: `$${entry.net_pay.toFixed(2)}`,
      status: entry.status.charAt(0).toUpperCase() + entry.status.slice(1),
      payment_date: entry.payment_date || "N/A",
    })
  })

  return result
}
