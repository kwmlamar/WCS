import type {
  Worker,
  Project,
  TimeEntry,
  TimesheetEntry,
  PayrollEntry,
  PayrollSettings,
  WorkdaySettings,
  Assignment
} from "./types";
import { format, addDays, differenceInDays } from "date-fns";

import { supabase } from "@/lib/supabaseClient"

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

// Mock workday settings
// const mockWorkdaySettings: WorkdaySettings = {
//   monday: true,
//   tuesday: true,
//   wednesday: true,
//   thursday: true,
//   friday: true,
//   saturday: false,
//   sunday: false,
// }

// Mock payroll settings
// const mockPayrollSettings: PayrollSettings = {
//   overtime_threshold: 40, // Hours per week
//   overtime_rate: 1.5, // Time and a half
//   tax_rate: 0.2, // 20% tax
//   default_deductions: 0.05, // 5% for benefits, insurance, etc.
// }

// Mock time entries storage
// let mockTimeEntries: TimeEntry[] = []

// Mock payroll entries
// const mockPayrollEntries: PayrollEntry[] = []

// Generate mock time entries for a given date
// function generateMockTimeEntries(date: Date): TimeEntry[] {
//   const dateStr = format(date, "yyyy-MM-dd")
//   const isWeekend = [0, 6].includes(date.getDay()) // 0 = Sunday, 6 = Saturday

//   // Check if we already have entries for this date
//   const existingEntries = mockTimeEntries.filter((entry) => entry.date === dateStr)
//   if (existingEntries.length > 0) {
//     return existingEntries
//   }

//   // Generate new entries
//   const newEntries = mockWorkers
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

//   // Add to our mock storage
//   mockTimeEntries = [...mockTimeEntries, ...newEntries]

//   return newEntries
// }

// Fetch workers
export async function fetchWorkers(): Promise<Worker[]> {
  try {
    const { data, error } = await supabase
      .from("workers")
      .select("*")
      .order("name");

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching workers:", error);
    return [];
  }
}

// Fetch projects
export async function fetchProjects(): Promise<Project[]> {
  try {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .order("name");

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching projects:", error);
    return [];
  }
}

// Fetch time entries for a specific date
export async function fetchTimeEntries(date: Date): Promise<TimeEntry[]> {
  try {
    // 🚨 Bail early if it's Sunday
    if (date.getDay() === 0) {
      console.log("It's Sunday — no time entries needed.");
      return [];
    }

    const dateStr = format(date, "yyyy-MM-dd");

    // First, get all active workers
    const { data: workers, error: workersError } = await supabase
      .from("workers")
      .select("id, name")
      .eq("active", true);

    if (workersError) throw workersError;

    // Then, get existing time entries for the date
    const { data: entries, error: entriesError } = await supabase
      .from("time_entries")
      .select(`
        id, 
        worker_id, 
        workers(name), 
        project_id, 
        projects(name), 
        date, 
        clock_in, 
        clock_out, 
        hours, 
        is_absent, 
        is_auto
      `)
      .eq("date", dateStr);

    if (entriesError) throw entriesError;

    // Format the entries
    const formattedEntries: TimeEntry[] = (entries || []).map((entry) => ({
      id: entry.id,
      worker_id: entry.worker_id,
      worker_name: entry.workers?.name || "",
      project_id: entry.project_id,
      project_name: entry.projects?.name || null,
      date: entry.date,
      clock_in: entry.clock_in,
      clock_out: entry.clock_out,
      hours: entry.hours,
      is_absent: entry.is_absent,
      is_auto: entry.is_auto,
    }));

    // Check for missing entries
    const workerIds = new Set(formattedEntries.map((entry) => entry.worker_id));
    const missingWorkers = (workers || []).filter(
      (worker) => !workerIds.has(worker.id)
    );

    // If workers are missing entries, create them
    if (missingWorkers.length > 0) {
      const newEntries: TimeEntry[] = [];

      for (const worker of missingWorkers) {
        const { data: newEntry, error: insertError } = await supabase
          .from("time_entries")
          .insert({
            worker_id: worker.id,
            date: dateStr,
            is_absent: false,
            is_auto: true,
            hours: 8,
          })
          .select(`
            id, 
            worker_id, 
            workers(name), 
            project_id, 
            projects(name), 
            date, 
            clock_in, 
            clock_out, 
            hours, 
            is_absent, 
            is_auto
          `)
          .single();

        if (insertError) {
          console.error("Error creating time entry:", insertError);
          continue;
        }

        if (newEntry) {
          newEntries.push({
            id: newEntry.id,
            worker_id: newEntry.worker_id,
            worker_name: newEntry.workers?.name || "",
            project_id: newEntry.project_id,
            project_name: newEntry.projects?.name || null,
            date: newEntry.date,
            clock_in: newEntry.clock_in,
            clock_out: newEntry.clock_out,
            hours: newEntry.hours,
            is_absent: newEntry.is_absent,
            is_auto: newEntry.is_auto,
          });
        }
      }

      return [...formattedEntries, ...newEntries];
    }

    return formattedEntries;
  } catch (error) {
    console.error("Error fetching time entries:", error);
    return [];
  }
}



// Update a time entry
export async function updateTimeEntry(
  entry: Partial<TimeEntry> & { worker_id: string; date: string }
): Promise<TimeEntry> {
  try {
    // Check if entry exists
    const { data: existingEntries, error: checkError } = await supabase
      .from("time_entries")
      .select("id")
      .eq("worker_id", entry.worker_id)
      .eq("date", entry.date);

    if (checkError) throw checkError;

    let result;

    if (existingEntries && existingEntries.length > 0) {
      // Update existing entry
      const { data, error } = await supabase
        .from("time_entries")
        .update({
          project_id: entry.project_id,
          clock_in: entry.clock_in,
          clock_out: entry.clock_out,
          hours: entry.hours,
          is_absent: entry.is_absent,
          is_auto: entry.is_auto,
        })
        .eq("id", existingEntries[0].id)
        .select(
          `
          id, 
          worker_id, 
          workers(name), 
          project_id, 
          projects(name), 
          date, 
          clock_in, 
          clock_out, 
          hours, 
          is_absent, 
          is_auto
        `
        )
        .single();

      if (error) throw error;
      result = data;
    } else {
      // Create new entry
      const { data, error } = await supabase
        .from("time_entries")
        .insert({
          worker_id: entry.worker_id,
          project_id: entry.project_id,
          date: entry.date,
          clock_in: entry.clock_in,
          clock_out: entry.clock_out,
          hours: entry.hours,
          is_absent: entry.is_absent || false,
          is_auto: entry.is_auto || false,
        })
        .select(
          `
          id, 
          worker_id, 
          workers(name), 
          project_id, 
          projects(name), 
          date, 
          clock_in, 
          clock_out, 
          hours, 
          is_absent, 
          is_auto
        `
        )
        .single();

      if (error) throw error;
      result = data;
    }

    // Format the result
    return {
      id: result.id,
      worker_id: result.worker_id,
      worker_name: result.workers?.name || "",
      project_id: result.project_id,
      project_name: result.projects?.name || null,
      date: result.date,
      clock_in: result.clock_in,
      clock_out: result.clock_out,
      hours: result.hours,
      is_absent: result.is_absent,
      is_auto: result.is_auto,
    };
  } catch (error) {
    console.error("Error updating time entry:", error);
    throw error;
  }
}

// Fetch timesheet data for a date range
export async function fetchTimesheetData(
  startDate: Date,
  endDate: Date,
  workerId?: string
): Promise<TimesheetEntry[]> {
  try {
    const startDateStr = format(startDate, "yyyy-MM-dd");
    const endDateStr = format(endDate, "yyyy-MM-dd");

    let query = supabase
      .from("time_entries")
      .select(
        `
        worker_id,
        workers(name),
        project_id,
        projects(name),
        date,
        hours,
        is_absent
      `
      )
      .gte("date", startDateStr)
      .lte("date", endDateStr);

    if (workerId) {
      query = query.eq("worker_id", workerId);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Format the data
    return (data || []).map((entry) => ({
      worker_id: entry.worker_id,
      worker_name: entry.workers?.name || "",
      project_id: entry.project_id,
      project_name: entry.projects?.name || null,
      date: entry.date,
      hours: entry.hours,
      is_absent: entry.is_absent,
    }));
  } catch (error) {
    console.error("Error fetching timesheet data:", error);
    return [];
  }
}

// Generate timesheet data for export
export async function generateTimesheet(
  startDate: Date,
  endDate: Date,
  workerId: string
): Promise<any[]> {
  try {
    // Get timesheet data
    const data = await fetchTimesheetData(
      startDate,
      endDate,
      workerId === "all" ? undefined : workerId
    );

    // Format for CSV export
    const headers = {
      worker_name: "Worker Name",
      date: "Date",
      hours: "Hours",
      project_name: "Project",
      is_absent: "Absent",
    };

    // Add headers as first row
    const result = [headers];

    // Add data rows
    data.forEach((entry) => {
      result.push({
        worker_name: entry.worker_name,
        date: entry.date,
        hours: entry.is_absent ? "ABSENT" : entry.hours?.toString() || "0",
        project_name: entry.project_name || "No Project",
        is_absent: entry.is_absent ? "Yes" : "No",
      });
    });

    return result;
  } catch (error) {
    console.error("Error generating timesheet:", error);
    return [];
  }
}

// Get workday settings
export async function getWorkdaySettings(): Promise<WorkdaySettings> {
  try {
    const { data, error } = await supabase
      .from("settings")
      .select("*")
      .eq("type", "workdays")
      .single();

    if (error) {
      // If no settings exist, return defaults and create them
      const defaultSettings: WorkdaySettings = {
        monday: true,
        tuesday: true,
        wednesday: true,
        thursday: true,
        friday: true,
        saturday: true,
        sunday: false,
      };

      await supabase.from("settings").insert({
        type: "workdays",
        data: defaultSettings,
      });

      return defaultSettings;
    }

    return data.data as WorkdaySettings;
  } catch (error) {
    console.error("Error fetching workday settings:", error);
    // Return default settings if there's an error
    return {
      monday: true,
      tuesday: true,
      wednesday: true,
      thursday: true,
      friday: true,
      saturday: true,
      sunday: false,
    };
  }
}

// Update workday settings
export async function updateWorkdaySettings(
  settings: WorkdaySettings
): Promise<WorkdaySettings> {
  try {
    const { data, error } = await supabase
      .from("settings")
      .update({ data: settings })
      .eq("type", "workdays")
      .select()
      .single();

    if (error) throw error;

    return data.data as WorkdaySettings;
  } catch (error) {
    console.error("Error updating workday settings:", error);
    throw error;
  }
}

// Generate timesheets for a week
export async function generateTimesheetsForWeek(
  startDate: Date,
  endDate: Date,
  workdaySettings: WorkdaySettings
): Promise<void> {
  try {
    // Get active workers
    const { data: workers, error: workersError } = await supabase
      .from("workers")
      .select("id, name")
      .eq("active", true);

    if (workersError) throw workersError;

    // Generate time entries for each day in the range
    let currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const day = format(
        currentDate,
        "EEEE"
      ).toLowerCase() as keyof WorkdaySettings;

      // Check if this day is a workday
      if (workdaySettings[day]) {
        const dateStr = format(currentDate, "yyyy-MM-dd");

        // Generate entries for each worker
        for (const worker of workers || []) {
          // Check if an entry already exists
          const { data: existingEntries, error: checkError } = await supabase
            .from("time_entries")
            .select("id")
            .eq("worker_id", worker.id)
            .eq("date", dateStr);

          if (checkError) {
            console.error("Error checking existing entries:", checkError);
            continue;
          }

          if (!existingEntries || existingEntries.length === 0) {
            // Create a new entry with 8 hours
            const clockInDate = new Date(currentDate);
            clockInDate.setHours(9, 0, 0, 0);

            const clockOutDate = new Date(currentDate);
            clockOutDate.setHours(17, 0, 0, 0);

            const { error: insertError } = await supabase
              .from("time_entries")
              .insert({
                worker_id: worker.id,
                date: dateStr,
                clock_in: clockInDate.toISOString(),
                clock_out: clockOutDate.toISOString(),
                hours: 0,
                is_absent: false,
                is_auto: false,
              });

            if (insertError) {
              console.error("Error creating time entry:", insertError);
            }
          }
        }
      }

      // Move to the next day
      currentDate = addDays(currentDate, 1);
    }
  } catch (error) {
    console.error("Error generating timesheets for week:", error);
    throw error;
  }
}

// Bulk update hours for selected entries
export async function bulkUpdateHours(
  startDate: Date,
  endDate: Date,
  hours: number,
  workerIds?: string[]
): Promise<void> {
  try {
    const startDateStr = format(startDate, "yyyy-MM-dd");
    const endDateStr = format(endDate, "yyyy-MM-dd");

    let query = supabase
      .from("time_entries")
      .update({
        hours: hours,
        is_absent: false,
      })
      .gte("date", startDateStr)
      .lte("date", endDateStr);

    if (workerIds && workerIds.length > 0) {
      query = query.in("worker_id", workerIds);
    }

    const { error } = await query;

    if (error) throw error;
  } catch (error) {
    console.error("Error bulk updating hours:", error);
    throw error;
  }
}

// Fetch payroll settings
export async function fetchPayrollSettings(): Promise<PayrollSettings> {
  try {
    const { data, error } = await supabase
      .from("settings")
      .select("*")
      .eq("type", "payroll")
      .single();

    if (error) {
      // If no settings exist, return defaults and create them
      const defaultSettings: PayrollSettings = {
        overtime_threshold: 48,
        overtime_rate: 1.5,
        tax_rate: 0.0,
        default_deductions: 0.00,
      };

      await supabase.from("settings").insert({
        type: "payroll",
        data: defaultSettings,
      });

      return defaultSettings;
    }

    return data.data as PayrollSettings;
  } catch (error) {
    console.error("Error fetching payroll settings:", error);
    // Return default settings if there's an error
    return {
      overtime_threshold: 48,
      overtime_rate: 1.5,
      tax_rate: 0.0,
      default_deductions: 0.00,
    };
  }
}

// Update payroll settings
export async function updatePayrollSettings(
  settings: PayrollSettings
): Promise<PayrollSettings> {
  try {
    const { data, error } = await supabase
      .from("settings")
      .update({ data: settings })
      .eq("type", "payroll")
      .select()
      .single();

    if (error) throw error;

    return data.data as PayrollSettings;
  } catch (error) {
    console.error("Error updating payroll settings:", error);
    throw error;
  }
}

// Calculate payroll for a specific period
export async function calculatePayroll(
  startDate: Date,
  endDate: Date,
  workerId?: string
): Promise<PayrollEntry[]> {
  try {
    // Get timesheet data for the period
    const timesheetData = await fetchTimesheetData(
      startDate,
      endDate,
      workerId
    );

    // Get workers data
    const workers = await fetchWorkers();

    // Get payroll settings
    const settings = await fetchPayrollSettings();

    // Group timesheet data by worker
    const workerHours: Record<
      string,
      {
        totalHours: number;
        worker: Worker | undefined;
      }
    > = {};

    timesheetData.forEach((entry) => {
      if (!entry.is_absent && entry.hours) {
        if (!workerHours[entry.worker_id]) {
          workerHours[entry.worker_id] = {
            totalHours: 0,
            worker: workers.find((w) => w.id === entry.worker_id),
          };
        }
        workerHours[entry.worker_id].totalHours += entry.hours;
      }
    });

    // Calculate payroll for each worker
    const payrollEntries: PayrollEntry[] = [];

    for (const workerId in workerHours) {
      const { totalHours, worker } = workerHours[workerId];

      if (!worker) continue;

      // Calculate regular and overtime hours
      const daysInPeriod = differenceInDays(endDate, startDate) + 1;
      const weeksInPeriod = daysInPeriod / 7;
      const overtimeThreshold = settings.overtime_threshold * weeksInPeriod;

      const regularHours = Math.min(totalHours, overtimeThreshold);
      const overtimeHours = Math.max(0, totalHours - overtimeThreshold);

      // Calculate pay
      const regularPay = regularHours * worker.hourly_rate;
      const overtimePay =
        overtimeHours * worker.hourly_rate * settings.overtime_rate;
      const grossPay = regularPay + overtimePay;

      // Calculate deductions
      const taxDeduction = grossPay * settings.tax_rate;
      const otherDeductions = grossPay * settings.default_deductions;
      const totalDeductions = taxDeduction + otherDeductions;

      // Calculate net pay
      const netPay = grossPay - totalDeductions;

      // Generate uuid
      function generateUUID(): string {
        return crypto.randomUUID();
      }

      // Create payroll entry
      const payrollEntry: PayrollEntry = {
        id: generateUUID(),
        worker_id: workerId,
        worker_name: worker.name,
        period_start: format(startDate, "yyyy-MM-dd"),
        period_end: format(endDate, "yyyy-MM-dd"),
        regular_hours: Number.isInteger(regularHours) ? regularHours : parseFloat(regularHours.toFixed(1)),
        overtime_hours: Number.isInteger(overtimeHours) ? overtimeHours : parseFloat(overtimeHours.toFixed(1)),
        hourly_rate: worker.hourly_rate,
        gross_pay: Number.parseFloat(grossPay.toFixed(2)),
        deductions: Number.parseFloat(totalDeductions.toFixed(2)),
        net_pay: Number.parseFloat(netPay.toFixed(2)),
        status: "unpaid",
        payment_date: null,
      };

      payrollEntries.push(payrollEntry);
    }

    return payrollEntries;
  } catch (error) {
    console.error("Error calculating payroll:", error);
    return [];
  }
}

// Fetch payroll entries
export async function fetchPayrollEntries(
  startDate: Date,
  endDate: Date,
  workerId?: string
): Promise<PayrollEntry[]> {
  try {
    const startDateStr = format(startDate, "yyyy-MM-dd");
    const endDateStr = format(endDate, "yyyy-MM-dd");

    // Always calculate fresh payroll entries first
    const calculatedEntries = await calculatePayroll(startDate, endDate, workerId);

    // Upsert them into the database (STRIP worker_name!)
    if (calculatedEntries.length > 0) {
      const entriesToUpsert = calculatedEntries.map(({ worker_name, ...rest }) => rest);

      const { error: upsertError } = await supabase
        .from("payroll_entries")
        .upsert(entriesToUpsert, { onConflict: ['worker_id', 'period_start', 'period_end'] }); 
        console.log("entriesToUpsert", entriesToUpsert);

        // <- make sure your DB has a unique constraint on these columns
      if (upsertError) {
        console.error("Error upserting calculated payroll entries:", upsertError);
      }
    }

    // Now fetch the fresh entries
    let query = supabase
      .from("payroll_entries")
      .select(`
        id,
        worker_id,
        workers (name),
        period_start,
        period_end,
        regular_hours,
        overtime_hours,
        hourly_rate,
        gross_pay,
        deductions,
        net_pay,
        status,
        payment_date
      `)
      .gte("period_start", startDateStr)
      .lte("period_end", endDateStr);

    if (workerId) {
      query = query.eq("worker_id", workerId);
    }

    const { data, error } = await query;

    if (error) throw error;

    const formattedEntries = (data || []).map((entry) => ({
      id: entry.id,
      worker_id: entry.worker_id,
      worker_name: entry.workers?.name || "",
      period_start: entry.period_start,
      period_end: entry.period_end,
      regular_hours: entry.regular_hours,
      overtime_hours: entry.overtime_hours,
      hourly_rate: entry.hourly_rate,
      gross_pay: entry.gross_pay,
      deductions: entry.deductions,
      net_pay: entry.net_pay,
      status: entry.status as "paid" | "unpaid",
      payment_date: entry.payment_date,
    }));

    return formattedEntries;
  } catch (error) {
    console.error("Error fetching payroll entries:", error);
    throw error;
  }
}



// Update payroll entry
export async function updatePayrollEntry(
  entry: PayrollEntry
): Promise<PayrollEntry> {
  try {
    const { data, error } = await supabase
      .from("payroll_entries")
      .upsert(entry, { ignoreDuplicates: false})
      .select()
      .single();

    if (error) throw error;

    return data as PayrollEntry;
  } catch (error) {
    console.error("Error updating payroll entry:", error);
    throw error;
  }
}

// Mark payroll as paid
export async function markPayrollAsPaid(
  entryIds: string[]
): Promise<PayrollEntry[]> {
  try {
    const currentDate = format(new Date(), "yyyy-MM-dd");

    const { data, error } = await supabase
      .from("payroll_entries")
      .update({
        status: "paid",
        payment_date: currentDate,
      })
      .in("id", entryIds)
      .select();

    if (error) throw error;

    return (data || []) as PayrollEntry[];
  } catch (error) {
    console.error("Error marking payroll as paid:", error);
    return [];
  }
}

// Generate payroll report for export
export async function generatePayrollReport(
  startDate: Date,
  endDate: Date,
  workerId?: string
): Promise<any[]> {
  try {
    // Get payroll data
    const payrollData = await fetchPayrollEntries(startDate, endDate, workerId);

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
    };

    // Add headers as first row
    const result = [headers];

    // Add data rows
    payrollData.forEach((entry) => {
      result.push({
        worker_name: entry.worker_name,
        period: `${entry.period_start} to ${entry.period_end}`,
        regular_hours: entry.regular_hours.toString(),
        overtime_hours: entry.overtime_hours.toString(),
        hourly_rate: `${entry.hourly_rate.toFixed(2)}`,
        gross_pay: `${entry.gross_pay.toFixed(2)}`,
        deductions: `${entry.deductions.toFixed(2)}`,
        net_pay: `${entry.net_pay.toFixed(2)}`,
        status: entry.status.charAt(0).toUpperCase() + entry.status.slice(1),
        payment_date: entry.payment_date || "N/A",
      });
    });

    return result;
  } catch (error) {
    console.error("Error generating payroll report:", error);
    return [];
  }
}

// Function to clean up duplicate payroll entries
export async function cleanupDuplicatePayrollEntries(): Promise<number> {
  try {
    // Get all payroll entries
    const { data, error } = await supabase
      .from("payroll_entries")
      .select("id, worker_id, period_start, period_end")
      .order("period_start", { ascending: true })

    if (error) throw error

    if (!data || data.length === 0) return 0

    // Find duplicates (same worker_id, period_start, period_end)
    const seen = new Set<string>()
    const duplicates: string[] = []

    data.forEach((entry) => {
      const key = `${entry.worker_id}-${entry.period_start}-${entry.period_end}`
      if (seen.has(key)) {
        duplicates.push(entry.id)
      } else {
        seen.add(key)
      }
    })

    if (duplicates.length === 0) return 0

    // Delete duplicates
    const { error: deleteError } = await supabase.from("payroll_entries").delete().in("id", duplicates)

    if (deleteError) throw deleteError

    return duplicates.length
  } catch (error) {
    console.error("Error cleaning up duplicate payroll entries:", error)
    return 0
  }
}

export async function generateMissingPayrollEntries(startDate: Date, endDate: Date) {
  const { data: workers, error } = await supabase.from("workers").select("id");

  if (error) {
    console.error("Error fetching workers:", error);
    return;
  }

  for (const worker of workers) {
    const entries = await fetchPayrollEntries(startDate, endDate, worker.id);
    if (entries.length === 0) {
      console.log(`Generated payroll for worker ${worker.id}`);
    }
  }

  console.log("Missing payroll generation complete.");
}

// Fetch worker-project assignments
export async function fetchAssignments(): Promise<Assignment[]> {
  try {
    const { data, error } = await supabase
      .from("assignments")
      .select(`
        id,
        worker_id,
        project_id,
        created_at
      `)
      .order("created_at", { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error("Error fetching assignments:", error)
    return []
  }
}

// Create a new worker-project assignment
export async function createAssignment(assignment: { worker_id: string; project_id: string }): Promise<Assignment> {
  try {
    const { data, error } = await supabase
      .from("assignments")
      .insert({
        worker_id: assignment.worker_id,
        project_id: assignment.project_id,
      })
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error("Error creating assignment:", error)
    throw error
  }
}

// Delete a worker-project assignment
export async function deleteAssignment(assignmentId: string): Promise<void> {
  try {
    const { error } = await supabase.from("assignments").delete().eq("id", assignmentId)

    if (error) throw error
  } catch (error) {
    console.error("Error deleting assignment:", error)
    throw error
  }
}

// Get projects assigned to a specific worker
export async function getWorkerProjects(workerId: string): Promise<Project[]> {
  try {
    const { data, error } = await supabase
      .from("assignments")
      .select(`
        project_id,
        projects(*)
      `)
      .eq("worker_id", workerId)

    if (error) throw error

    return (data || []).map((item) => item.projects).filter(Boolean)
  } catch (error) {
    console.error("Error fetching worker projects:", error)
    return []
  }
}

// Get workers assigned to a specific project
export async function getProjectWorkers(projectId: string): Promise<Worker[]> {
  try {
    const { data, error } = await supabase
      .from("assignments")
      .select(`
        worker_id,
        workers(*)
      `)
      .eq("project_id", projectId)

    if (error) throw error

    return (data || []).map((item) => item.workers).filter(Boolean)
  } catch (error) {
    console.error("Error fetching project workers:", error)
    return []
  }
}
