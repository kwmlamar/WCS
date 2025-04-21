"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import type { Worker } from "@/lib/types"

interface WorkerFormProps {
  worker?: Worker | null
  onSubmit: (worker: Worker | Omit<Worker, "id">) => void
  onCancel: () => void
}

export function WorkerForm({ worker, onSubmit, onCancel }: WorkerFormProps) {
  const [name, setName] = useState(worker?.name || "")
  const [email, setEmail] = useState(worker?.email || "")
  const [hourlyRate, setHourlyRate] = useState(worker?.hourly_rate?.toString() || "")
  const [active, setActive] = useState(worker?.active ?? true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const newErrors: Record<string, string> = {}

    if (!name.trim()) {
      newErrors.name = "Name is required"
    }

    if (!email.trim()) {
      newErrors.email = "Email is required"
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Email is invalid"
    }

    if (!hourlyRate.trim()) {
      newErrors.hourlyRate = "Hourly rate is required"
    } else if (isNaN(Number.parseFloat(hourlyRate)) || Number.parseFloat(hourlyRate) <= 0) {
      newErrors.hourlyRate = "Hourly rate must be a positive number"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) {
      return
    }

    setIsSubmitting(true)

    try {
      const workerData = worker
        ? {
            ...worker,
            name,
            email,
            hourly_rate: Number.parseFloat(hourlyRate),
            active,
          }
        : {
            name,
            email,
            hourly_rate: Number.parseFloat(hourlyRate),
            active,
          }

      await onSubmit(workerData)
    } catch (error) {
      console.error("Error submitting worker form:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" required />
        {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="john@example.com"
          required
        />
        {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="hourlyRate">Hourly Rate ($)</Label>
        <Input
          id="hourlyRate"
          type="number"
          min="0"
          step="0.01"
          value={hourlyRate}
          onChange={(e) => setHourlyRate(e.target.value)}
          placeholder="25.00"
          required
        />
        {errors.hourlyRate && <p className="text-sm text-destructive">{errors.hourlyRate}</p>}
      </div>

      <div className="flex items-center space-x-2">
        <Switch id="active" checked={active} onCheckedChange={setActive} />
        <Label htmlFor="active">Active</Label>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : worker ? "Update Worker" : "Add Worker"}
        </Button>
      </div>
    </form>
  )
}
