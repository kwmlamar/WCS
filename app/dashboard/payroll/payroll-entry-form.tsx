"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { PayrollEntry } from "@/lib/types"

interface PayrollEntryFormProps {
  entry: PayrollEntry
  onSubmit: (entry: PayrollEntry) => void
  onCancel: () => void
  isProcessing: boolean
}

export function PayrollEntryForm({ entry, onSubmit, onCancel, isProcessing }: PayrollEntryFormProps) {
  const [regularHours, setRegularHours] = useState(entry.regular_hours.toString())
  const [overtimeHours, setOvertimeHours] = useState(entry.overtime_hours.toString())
  const [hourlyRate, setHourlyRate] = useState(entry.hourly_rate.toString())
  const [deductions, setDeductions] = useState(entry.deductions.toString())
  const [status, setStatus] = useState<"paid" | "unpaid">(entry.status)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const newErrors: Record<string, string> = {}

    if (isNaN(Number.parseFloat(regularHours)) || Number.parseFloat(regularHours) < 0) {
      newErrors.regularHours = "Regular hours must be a non-negative number"
    }

    if (isNaN(Number.parseFloat(overtimeHours)) || Number.parseFloat(overtimeHours) < 0) {
      newErrors.overtimeHours = "Overtime hours must be a non-negative number"
    }

    if (isNaN(Number.parseFloat(hourlyRate)) || Number.parseFloat(hourlyRate) <= 0) {
      newErrors.hourlyRate = "Hourly rate must be a positive number"
    }

    if (isNaN(Number.parseFloat(deductions)) || Number.parseFloat(deductions) < 0) {
      newErrors.deductions = "Deductions must be a non-negative number"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) {
      return
    }

    // Calculate gross pay and net pay
    const regHours = Number.parseFloat(regularHours)
    const otHours = Number.parseFloat(overtimeHours)
    const rate = Number.parseFloat(hourlyRate)
    const deduc = Number.parseFloat(deductions)

    // Assuming overtime is 1.5x regular rate
    const grossPay = regHours * rate + otHours * rate * 1.5
    const netPay = grossPay - deduc

    const updatedEntry: PayrollEntry = {
      ...entry,
      regular_hours: regHours,
      overtime_hours: otHours,
      hourly_rate: rate,
      gross_pay: grossPay,
      deductions: deduc,
      net_pay: netPay,
      status: status,
      payment_date:
        status === "paid" && !entry.payment_date ? new Date().toISOString().split("T")[0] : entry.payment_date,
    }

    await onSubmit(updatedEntry)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="regularHours">Regular Hours</Label>
          <Input
            id="regularHours"
            type="number"
            min="0"
            step="0.1"
            value={regularHours}
            onChange={(e) => setRegularHours(e.target.value)}
            required
          />
          {errors.regularHours && <p className="text-sm text-destructive">{errors.regularHours}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="overtimeHours">Overtime Hours</Label>
          <Input
            id="overtimeHours"
            type="number"
            min="0"
            step="0.1"
            value={overtimeHours}
            onChange={(e) => setOvertimeHours(e.target.value)}
            required
          />
          {errors.overtimeHours && <p className="text-sm text-destructive">{errors.overtimeHours}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="hourlyRate">Hourly Rate ($)</Label>
          <Input
            id="hourlyRate"
            type="number"
            min="0"
            step="0.01"
            value={hourlyRate}
            onChange={(e) => setHourlyRate(e.target.value)}
            required
          />
          {errors.hourlyRate && <p className="text-sm text-destructive">{errors.hourlyRate}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="deductions">Deductions ($)</Label>
          <Input
            id="deductions"
            type="number"
            min="0"
            step="0.01"
            value={deductions}
            onChange={(e) => setDeductions(e.target.value)}
            required
          />
          {errors.deductions && <p className="text-sm text-destructive">{errors.deductions}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">Payment Status</Label>
        <Select value={status} onValueChange={(value: "paid" | "unpaid") => setStatus(value)}>
          <SelectTrigger id="status">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="unpaid">Unpaid</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isProcessing}>
          {isProcessing ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </form>
  )
}
