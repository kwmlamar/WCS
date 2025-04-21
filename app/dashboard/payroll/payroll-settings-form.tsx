"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Save } from "lucide-react"
import type { PayrollSettings } from "@/lib/types"
import { toast } from "@/hooks/use-toast"

interface PayrollSettingsFormProps {
  settings: PayrollSettings
  onSave: (settings: PayrollSettings) => Promise<boolean>
  isLoading: boolean
}

export function PayrollSettingsForm({ settings, onSave, isLoading }: PayrollSettingsFormProps) {
  const [overtimeThreshold, setOvertimeThreshold] = useState(settings.overtime_threshold.toString())
  const [overtimeRate, setOvertimeRate] = useState(settings.overtime_rate.toString())
  const [taxRate, setTaxRate] = useState((settings.tax_rate * 100).toString())
  const [defaultDeductions, setDefaultDeductions] = useState((settings.default_deductions * 100).toString())
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const newErrors: Record<string, string> = {}

    if (isNaN(Number.parseFloat(overtimeThreshold)) || Number.parseFloat(overtimeThreshold) <= 0) {
      newErrors.overtimeThreshold = "Overtime threshold must be a positive number"
    }

    if (isNaN(Number.parseFloat(overtimeRate)) || Number.parseFloat(overtimeRate) <= 0) {
      newErrors.overtimeRate = "Overtime rate must be a positive number"
    }

    if (isNaN(Number.parseFloat(taxRate)) || Number.parseFloat(taxRate) < 0 || Number.parseFloat(taxRate) > 100) {
      newErrors.taxRate = "Tax rate must be between 0 and 100"
    }

    if (
      isNaN(Number.parseFloat(defaultDeductions)) ||
      Number.parseFloat(defaultDeductions) < 0 ||
      Number.parseFloat(defaultDeductions) > 100
    ) {
      newErrors.defaultDeductions = "Default deductions must be between 0 and 100"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) {
      return
    }

    const updatedSettings: PayrollSettings = {
      overtime_threshold: Number.parseFloat(overtimeThreshold),
      overtime_rate: Number.parseFloat(overtimeRate),
      tax_rate: Number.parseFloat(taxRate) / 100,
      default_deductions: Number.parseFloat(defaultDeductions) / 100,
    }

    const success = await onSave(updatedSettings)

    if (success) {
      toast({
        title: "Settings saved",
        description: "Payroll settings have been updated successfully.",
      })
    } else {
      toast({
        title: "Error",
        description: "Failed to save payroll settings. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payroll Settings</CardTitle>
        <CardDescription>Configure how payroll is calculated for all workers.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="overtimeThreshold">Overtime Threshold (hours/week)</Label>
              <Input
                id="overtimeThreshold"
                type="number"
                min="0"
                step="0.1"
                value={overtimeThreshold}
                onChange={(e) => setOvertimeThreshold(e.target.value)}
                required
              />
              {errors.overtimeThreshold && <p className="text-sm text-destructive">{errors.overtimeThreshold}</p>}
              <p className="text-xs text-muted-foreground">Hours beyond this threshold are paid at overtime rate</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="overtimeRate">Overtime Rate Multiplier</Label>
              <Input
                id="overtimeRate"
                type="number"
                min="1"
                step="0.1"
                value={overtimeRate}
                onChange={(e) => setOvertimeRate(e.target.value)}
                required
              />
              {errors.overtimeRate && <p className="text-sm text-destructive">{errors.overtimeRate}</p>}
              <p className="text-xs text-muted-foreground">
                Multiplier for overtime pay (e.g., 1.5 for time and a half)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="taxRate">Tax Rate (%)</Label>
              <Input
                id="taxRate"
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
                required
              />
              {errors.taxRate && <p className="text-sm text-destructive">{errors.taxRate}</p>}
              <p className="text-xs text-muted-foreground">Default tax rate applied to gross pay</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="defaultDeductions">Default Deductions (%)</Label>
              <Input
                id="defaultDeductions"
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={defaultDeductions}
                onChange={(e) => setDefaultDeductions(e.target.value)}
                required
              />
              {errors.defaultDeductions && <p className="text-sm text-destructive">{errors.defaultDeductions}</p>}
              <p className="text-xs text-muted-foreground">Default deductions for benefits, insurance, etc.</p>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isLoading}>
            <Save className="mr-2 h-4 w-4" />
            {isLoading ? "Saving..." : "Save Settings"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
