import type {
  Worker,
  Project,
  TimeEntry,
  TimesheetEntry,
  PayrollEntry,
  PayrollSettings,
  WorkdaySettings,
} from "./types"
import { format, addDays, differenceInDays, parseISO } from "date-fns"

// Mock data for workers
const mockWorkers: Worker[] = [
  { id: "1", name: "John Doe", email: "john@example.com", active: true, hourly_rate: 25 },
  { id: "2", name: "Jane Smith", email: "jane@example.com", active: true, hourly_rate: 28 },
  { id: "3", name: "Bob Johnson", email: "bob@example.com", active: true, hourly_rate: 22 },
  { id: "4", name: "Alice Williams", email: "alice@example.com", active: false, hourly_rate: 24 },
]

// Mock data for projects
const mockProjects: Project[] = [
  { id: "1", name: "Site A", description: "Construction at Site A", active: true },
  { id: "2", name: "Site B", description: "Renovation at Site B", active: true },
  { id: "3", name: "Site C", description: "Maintenance at Site C", active: false },
]

// Mock workday settings
const mockWorkdaySettings: WorkdaySettings = {
  monday: true,
  tuesday: true,
  wednesday: true,
  thursday: true,
  friday: true,
  saturday: false,
  sunday: false,
}

// Mock payroll settings
const mockPayrollSettings: PayrollSettings = {
  overtime_threshold: 40, // Hours per week
  overtime_rate: 1.5, // Time and a half
  tax_rate: 0.2, // 20% tax
  default_deductions: 0.05, // 5% for benefits, insurance, etc.
}

// Mock time entries storage
let mockTimeEntries: TimeEntry[] = []

// Mock payroll entries
const mockPayrollEntries: PayrollEntry[] = []

// Generate mock time entries for a given date
function generateMockTimeEntries(date: Date): TimeEntry[] {
  const dateStr = format(date, "yyyy-MM-dd")
  const isWeekend = [0, 6].includes(date.getDay()) // 0 = Sunday, 6 = Saturday

  // Check if we already have entries for this date
  const existingEntries = mockTimeEntries.filter((entry) => entry.date === dateStr)
  if (existingEntries.length > 0) {
    return existingEntries
  }

  // Generate new entries
  const newEntries = mockWorkers
    .filter((worker) => worker.active)
    .map((worker) => {
      // Randomly determine if worker is absent (more likely on weekends)
      const isAbsent = isWeekend ? Math.random() < 0.7 : Math.random() < 0.1

      if (isAbsent) {
        return {
          id: `${dateStr}-${worker.id}`,
          worker_id: worker.id,
          worker_name: worker.name,
          project_id: null,
          project_name: null,
          date: dateStr,
          clock_in: null,
          clock_out: null,
          hours: null,
          is_absent: true,
          is_auto: true,
        }
      }

      // Randomly assign a project (or no project)
      const activeProjects = mockProjects.filter((p) => p.active)
      const projectIndex = Math.floor(Math.random() * (activeProjects.length + 1)) - 1
      const project = projectIndex >= 0 ? activeProjects[projectIndex] : null

      // Generate clock in time (around 7 AM with some variation)
      const clockInHour = 7
      const clockInMinute = Math.floor(Math.random() * 30)
      const clockInDate = new Date(date)
      clockInDate.setHours(clockInHour, clockInMinute, 0, 0)

      // Generate clock out time (around 4 PM with some variation)
      const clockOutHour = 16
      const clockOutMinute = Math.floor(Math.random() * 30)
      const clockOutDate = new Date(date)
      clockOutDate.setHours(clockOutHour, clockOutMinute, 0, 0)

      // Calculate hours worked
      const hours = (clockOutDate.getTime() - clockInDate.getTime()) / (1000 * 60 * 60)

      return {
        id: `${dateStr}-${worker.id}`,
        worker_id: worker.id,
        worker_name: worker.name,
        project_id: project?.id || null,
        project_name: project?.name || null,
        date: dateStr,
        clock_in: clockInDate.toISOString(),
        clock_out: clockOutDate.toISOString(),
        hours: Math.round(hours * 10) / 10, // Round to 1 decimal place
        is_absent: false,
        is_auto: true,
      }
    })

  // Add to our mock storage
  mockTimeEntries = [...mockTimeEntries, ...newEntries]

  return newEntries
}

// Fetch workers
export async function fetchWorkers(): Promise<Worker[]> {
  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 500))
  return [...mockWorkers]
}

// Fetch projects
export async function fetchProjects(): Promise<Project[]> {
  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 500))
  return [...mockProjects]
}

// Fetch time entries for a specific date
export async function fetchTimeEntries(date: Date): Promise<TimeEntry[]> {
  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 800))
  return generateMockTimeEntries(date)
}

// Update a time entry
export async function updateTimeEntry(
  entry: Partial<TimeEntry> & { worker_id: string; date: string },
): Promise<TimeEntry> {
  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 600))

  // Find the entry to update
  const entryId = entry.id || `${entry.date}-${entry.worker_id}`
  const existingEntryIndex = mockTimeEntries.findIndex((e) => e.id === entryId)

  if (existingEntryIndex >= 0) {
    // Update existing entry
    mockTimeEntries[existingEntryIndex] = {
      ...mockTimeEntries[existingEntryIndex],
      ...entry,
    }

    return mockTimeEntries[existingEntryIndex]
  } else {
    // Create new entry
    const worker = mockWorkers.find((w) => w.id === entry.worker_id)
    if (!worker) throw new Error("Worker not found")

    const newEntry: TimeEntry = {
      id: entryId,
      worker_id: entry.worker_id,
      worker_name: worker.name,
      project_id: entry.project_id || null,
      project_name: entry.project_name || null,
      date: entry.date,
      clock_in: entry.clock_in || null,
      clock_out: entry.clock_out || null,
      hours: entry.hours || null,
      is_absent: entry.is_absent || false,
      is_auto: entry.is_auto || false,
    }

    mockTimeEntries.push(newEntry)
    return newEntry
  }
}

// Fetch timesheet data for a date range
export async function fetchTimesheetData(startDate: Date, endDate: Date, workerId?: string): Promise<TimesheetEntry[]> {
  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 1000))

  let result: TimesheetEntry[] = []
  let currentDate = startDate

  while (currentDate <= endDate) {
    const entries = generateMockTimeEntries(currentDate)

    // Filter by worker ID if provided
    const filteredEntries = workerId ? entries.filter((entry) => entry.worker_id === workerId) : entries

    // Convert to timesheet entries
    const timesheetEntries = filteredEntries.map((entry) => ({
      worker_id: entry.worker_id,
      worker_name: entry.worker_name,
      date: entry.date,
      hours: entry.hours,
      is_absent: entry.is_absent,
      project_id: entry.project_id,
      project_name: entry.project_name,
    }))

    result = [...result, ...timesheetEntries]
    currentDate = addDays(currentDate, 1)
  }

  return result
}

// Generate timesheet data for export
export async function generateTimesheet(startDate: Date, endDate: Date, workerId: string): Promise<any[]> {
  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 1000))

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

// Get workday settings
export async function getWorkdaySettings(): Promise<WorkdaySettings> {
  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 500))
  return { ...mockWorkdaySettings }
}

// Update workday settings
export async function updateWorkdaySettings(settings: WorkdaySettings): Promise<WorkdaySettings> {
  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 800))

  // Update mock settings
  Object.assign(mockWorkdaySettings, settings)

  return { ...mockWorkdaySettings }
}

// Generate timesheets for a week
export async function generateTimesheetsForWeek(
  startDate: Date,
  endDate: Date,
  workdaySettings: WorkdaySettings,
): Promise<void> {
  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 1500))

  // Get active workers
  const activeWorkers = mockWorkers.filter((worker) => worker.active)

  // Generate time entries for each day in the range
  let currentDate = new Date(startDate)

  while (currentDate <= endDate) {
    const day = format(currentDate, "EEEE").toLowerCase() as keyof WorkdaySettings

    // Check if this day is a workday
    if (workdaySettings[day]) {
      const dateStr = format(currentDate, "yyyy-MM-dd")

      // Generate entries for each worker
      for (const worker of activeWorkers) {
        // Check if an entry already exists
        const existingEntry = mockTimeEntries.find((entry) => entry.date === dateStr && entry.worker_id === worker.id)

        if (!existingEntry) {
          // Create a new entry with 8 hours
          const clockInDate = new Date(currentDate)
          clockInDate.setHours(9, 0, 0, 0)

          const clockOutDate = new Date(currentDate)
          clockOutDate.setHours(17, 0, 0, 0)

          const newEntry: TimeEntry = {
            id: `${dateStr}-${worker.id}`,
            worker_id: worker.id,
            worker_name: worker.name,
            project_id: null,
            project_name: null,
            date: dateStr,
            clock_in: clockInDate.toISOString(),
            clock_out: clockOutDate.toISOString(),
            hours: 8,
            is_absent: false,
            is_auto: false,
          }

          mockTimeEntries.push(newEntry)
        }
      }
    }

    // Move to the next day
    currentDate = addDays(currentDate, 1)
  }
}

// Bulk update hours for selected entries
export async function bulkUpdateHours(
  startDate: Date,
  endDate: Date,
  hours: number,
  workerIds?: string[],
): Promise<void> {
  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 1200))

  // Get all entries in the date range
  let entriesToUpdate = mockTimeEntries.filter((entry) => {
    const entryDate = new Date(entry.date)
    return entryDate >= startDate && entryDate <= endDate
  })

  // Filter by worker IDs if provided
  if (workerIds && workerIds.length > 0) {
    entriesToUpdate = entriesToUpdate.filter((entry) => workerIds.includes(entry.worker_id))
  }

  // Update each entry
  for (const entry of entriesToUpdate) {
    const entryIndex = mockTimeEntries.findIndex((e) => e.id === entry.id)
    if (entryIndex >= 0) {
      mockTimeEntries[entryIndex] = {
        ...mockTimeEntries[entryIndex],
        hours,
        is_absent: false,
      }
    }
  }
}

// Fetch payroll settings
export async function fetchPayrollSettings(): Promise<PayrollSettings> {
  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 500))
  return { ...mockPayrollSettings }
}

// Update payroll settings
export async function updatePayrollSettings(settings: PayrollSettings): Promise<PayrollSettings> {
  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 800))

  // Update mock settings
  Object.assign(mockPayrollSettings, settings)

  return { ...mockPayrollSettings }
}

// Calculate payroll for a specific period
export async function calculatePayroll(startDate: Date, endDate: Date, workerId?: string): Promise<PayrollEntry[]> {
  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 1200))

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
  const existingEntries = mockPayrollEntries.filter((entry) => {
    const entryStartDate = parseISO(entry.period_start)
    const entryEndDate = parseISO(entry.period_end)

    // Check if the periods overlap
    return entryStartDate <= endDate && entryEndDate >= startDate && (!workerId || entry.worker_id === workerId)
  })

  if (existingEntries.length > 0) {
    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 800))
    return [...existingEntries]
  }

  // Calculate new payroll entries
  const newEntries = await calculatePayroll(startDate, endDate, workerId)

  // Add to mock data
  mockPayrollEntries.push(...newEntries)

  return newEntries
}

// Update payroll entry
export async function updatePayrollEntry(entry: PayrollEntry): Promise<PayrollEntry> {
  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 800))

  // Find and update the entry
  const index = mockPayrollEntries.findIndex((e) => e.id === entry.id)

  if (index >= 0) {
    mockPayrollEntries[index] = { ...entry }
    return { ...entry }
  }

  // If not found, add it
  mockPayrollEntries.push(entry)
  return entry
}

// Mark payroll as paid
export async function markPayrollAsPaid(entryIds: string[]): Promise<PayrollEntry[]> {
  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 1000))

  const updatedEntries: PayrollEntry[] = []

  entryIds.forEach((id) => {
    const index = mockPayrollEntries.findIndex((e) => e.id === id)

    if (index >= 0) {
      mockPayrollEntries[index] = {
        ...mockPayrollEntries[index],
        status: "paid",
        payment_date: format(new Date(), "yyyy-MM-dd"),
      }

      updatedEntries.push({ ...mockPayrollEntries[index] })
    }
  })

  return updatedEntries
}

// Generate payroll report for export
export async function generatePayrollReport(startDate: Date, endDate: Date, workerId?: string): Promise<any[]> {
  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 1000))

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
