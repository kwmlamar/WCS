export interface Worker {
  id: string
  name: string
  email: string
  active: boolean
  hourly_rate: number
}

export interface Project {
  id: string
  name: string
  description: string
  active: boolean
}

export interface TimeEntry {
  id: string
  worker_id: string
  worker_name: string
  project_id: string | null
  project_name: string | null
  date: string
  clock_in: string | null
  clock_out: string | null
  hours: number | null
  is_absent: boolean
  is_auto: boolean
}

export interface TimesheetEntry {
  worker_id: string
  worker_name: string
  date: string
  hours: number | null
  is_absent: boolean
  project_id: string | null
  project_name: string | null
}

export interface PayrollEntry {
  id?: string
  worker_id: string
  worker_name: string
  period_start: string
  period_end: string
  regular_hours: number
  overtime_hours: number
  hourly_rate: number
  gross_pay: number
  deductions: number
  net_pay: number
  status: "paid" | "unpaid"
  payment_date: string | null
}

export interface PayrollSettings {
  overtime_threshold: number
  overtime_rate: number
  tax_rate: number
  default_deductions: number
}

export interface WorkdaySettings {
  monday: boolean
  tuesday: boolean
  wednesday: boolean
  thursday: boolean
  friday: boolean
  saturday: boolean
  sunday: boolean
}

export interface Assignment {
  id: string
  worker_id: string
  project_id: string
  created_at: string
}
