"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { TimeInput } from "../time-input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { fetchProjects } from "@/lib/data"
import { toast } from "@/hooks/use-toast"
import type { TimeEntry, Project } from "@/lib/types"

interface TimeEntryFormProps {
  entry: TimeEntry
  onSubmit: (entry: TimeEntry) => void
  onCancel: () => void
}

export function TimeEntryForm({ entry, onSubmit, onCancel }: TimeEntryFormProps) {
  const [clockIn, setClockIn] = useState(entry.clock_in ? format(new Date(entry.clock_in), "HH:mm") : "")
  const [clockOut, setClockOut] = useState(entry.clock_out ? format(new Date(entry.clock_out), "HH:mm") : "")
  const [projectId, setProjectId] = useState(entry.project_id || "")
  const [isAbsent, setIsAbsent] = useState(entry.is_absent || false)
  const [isAuto, setIsAuto] = useState(entry.is_auto || false)
  const [projects, setProjects] = useState<Project[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadProjects = async () => {
      setIsLoading(true)
      try {
        const data = await fetchProjects()
        setProjects(data)
      } catch (error) {
        console.error("Failed to fetch projects:", error)
        toast({
          title: "Error",
          description: "Failed to load projects. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadProjects()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Create date objects for clock in/out times
      const entryDate = new Date(entry.date)

      let clockInDate = null
      if (clockIn && !isAbsent) {
        const [hours, minutes] = clockIn.split(":").map(Number)
        clockInDate = new Date(entryDate)
        clockInDate.setHours(hours, minutes, 0, 0)
      }

      let clockOutDate = null
      if (clockOut && !isAbsent) {
        const [hours, minutes] = clockOut.split(":").map(Number)
        clockOutDate = new Date(entryDate)
        clockOutDate.setHours(hours, minutes, 0, 0)
      }

      // Calculate hours if both clock in and out are provided
      let hours = null
      if (clockInDate && clockOutDate) {
        hours = (clockOutDate.getTime() - clockInDate.getTime()) / (1000 * 60 * 60)
        hours = Math.round(hours * 10) / 10 // Round to 1 decimal place
      }

      const selectedProject = projects.find((p) => p.id === projectId)

      const updatedEntry: TimeEntry = {
        ...entry,
        clock_in: clockInDate ? clockInDate.toISOString() : null,
        clock_out: clockOutDate ? clockOutDate.toISOString() : null,
        project_id: isAbsent ? null : projectId || null,
        project_name: isAbsent ? null : selectedProject?.name || null,
        is_absent: isAbsent,
        is_auto: isAuto,
        hours: hours,
      }

      await onSubmit(updatedEntry)
    } catch (error) {
      console.error("Error submitting time entry form:", error)
      toast({
        title: "Error",
        description: "Failed to save time entry. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-4">
      <div className="flex items-center space-x-2 mb-4">
        <Switch
          id="is-absent"
          checked={isAbsent}
          onCheckedChange={(checked) => {
            setIsAbsent(checked)
            if (checked) {
              setClockIn("")
              setClockOut("")
              setProjectId("")
            }
          }}
        />
        <Label htmlFor="is-absent">Mark as Absent</Label>
      </div>

      {!isAbsent && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="clock-in">Clock In</Label>
              <TimeInput id="clock-in" value={clockIn} onChange={setClockIn} disabled={isAbsent} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="clock-out">Clock Out</Label>
              <TimeInput id="clock-out" value={clockOut} onChange={setClockOut} disabled={isAbsent} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="project">Project</Label>
            <Select value={projectId} onValueChange={setProjectId} disabled={isAbsent || isLoading}>
              <SelectTrigger id="project">
                <SelectValue placeholder={isLoading ? "Loading projects..." : "Select a project"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="no-project">No Project</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Switch id="is-auto" checked={isAuto} onCheckedChange={setIsAuto} disabled={isAbsent} />
            <Label htmlFor="is-auto">Auto Entry</Label>
          </div>
        </>
      )}

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </form>
  )
}
