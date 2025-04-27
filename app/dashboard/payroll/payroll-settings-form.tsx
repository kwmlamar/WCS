"use client"

import { useState, useEffect } from 'react';
import { supabase } from "@/lib/supabaseClient"
import { Card, CardContent, CardTitle, CardHeader, CardFooter, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PayrollSettings } from "@/lib/types"
import { updatePayrollSettings } from '@/lib/data';


export function PayrollSettingsForm() {
  const [settings, setSettings] = useState<PayrollSettings>({
    overtime_threshold: 48,
    overtime_rate: 1.5,
    tax_rate: 0,
    default_deductions: 0
  })
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
    try {
      const { data, error} = await supabase
      .from("settings")
      .select("data")
      .eq("type", "payroll")
      .single()

    if (error) {
      console.log("Error fetching data:", error);
    } else if (data) {
      setSettings(data.data)
    }
    } catch (err) {
      console.error("Error fetching payroll data:", err);
    } finally {
      setIsLoading(false);
    }  
    };
    fetchData();
  },[]);

  if (isLoading) {
    return <div>Loading...</div>
  }
  
  // Handles
  const handleOvertimeThreshold = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setSettings((prevSettings) => ({
      ...prevSettings,
      overtime_threshold: parseFloat(value),
    }))
  }

  const handleOvertimeRate = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setSettings((prevSettings) => ({
      ...prevSettings,
      overtime_rate: parseFloat(value),
    }))
  }

  const handleTaxRate = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setSettings((prevSettings) => ({
      ...prevSettings,
      tax_rate: parseFloat(value)
    }))
  }

  const handleDefaultDeductions = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setSettings((prevSettings) => ({
      ...prevSettings,
      default_deductions: parseFloat(value)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form Data Submitted:", settings);
  

  try {
    setIsLoading(true);
    const result = await updatePayrollSettings(settings);
    console.log("Payroll settings updated:", result);
  }catch (error) {
    console.error("Error updating payroll settings:", error);
  } finally {
    setIsLoading(false)
  }
}
  

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payroll Settings</CardTitle>
        <CardDescription>
          Configure how payroll is calculated for 
          all workers.
        </CardDescription>
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
              step="1"
              value={settings.overtime_threshold}
              onChange={handleOvertimeThreshold}
              required
              />
              <p className="text-xs text-muted-foreground">
                Hours beyond this threshold are paid at overtime rate
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="overtimeRate">Overtime Rate Multiplier</Label>
              <Input
              id="overtimeRate"
              type="number"
              min="1"
              step="0.1"
              value={settings.overtime_rate}
              onChange={handleOvertimeRate}
              required
              />
              <p className='text-xs text-muted-foreground'>
                Muliplier for overtime pay (e.g., 1.5 for time and a half)
              </p>
            </div>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div className="space-y-2">
              <Label htmlFor="taxRate">Tax Rate (%)</Label>
              <Input
              id="taxRate"
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={settings.tax_rate}
              onChange={handleTaxRate}
              required
              />
              <p className="text-xs text muted-foreground">Default tax rate applied to gross pay</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="defaultDeductions">Default Deductions</Label>
              <Input
              id="defaultDeductions"
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={settings.default_deductions}
              onChange={handleDefaultDeductions}
              required
              />
              <p className="text-xs text muted-foreground">Default deductions for benefits, insurance, etc.</p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="mt-4">
          <Button type="submit" disabled={isLoading} className="ml-auto">
            {isLoading ? "Saving..." : "Save Settings"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}