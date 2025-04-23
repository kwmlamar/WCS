"use client"

import { useState, useEffect } from "react"
import { format, addDays, isSameDay } from "date-fns"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { fetchTimesheetData, updateTimeEntry } from "@/lib/actions/time-entries"
import { toast } from "@/hooks/use-toast"
import type { TimesheetEntry } from "@/lib/types"

interface TimesheetTableProps {
  startDate: Date
  endDate: Date
  workerId?: string
}

export function TimesheetTable({ startDate, endDate, workerId }: TimesheetTableProps) {
  const [data, setData] = useState<TimesheetEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingCell, setEditingCell] = useState<{ workerId: string; dayIndex: number } | null>(null)
  const [pendingUpdates, setPendingUpdates] = useState<{ [key: string]: boolean }>({})

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        const timesheetData = await fetchTimesheetData(startDate, endDate, workerId)
        setData(timesheetData)
      } catch (error) {
        console.error("Failed to fetch timesheet data:", error)
        toast({
          title: "Error",
          description: "Failed to load timesheet data. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [startDate, endDate, workerId])

  // Generate array of dates for the week
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(startDate, i))

  // Group data by worker
  const workerData = data.reduce(
    (acc, entry) => {
      if (!acc[entry.worker_id]) {
        acc[entry.worker_id] = {
          worker_id: entry.worker_id,
          worker_name: entry.worker_name,
          days: {},
          total_hours: 0,
        }
      }

      // Add entry to the appropriate day
      const entryDate = new Date(entry.date)
      weekDays.forEach((day, index) => {
        if (isSameDay(entryDate, day)) {
          acc[entry.worker_id].days[index] = entry
          acc[entry.worker_id].total_hours += entry.hours || 0
        }
      })

      return acc
    },
    {} as Record<string, any>,
  )

  const handleHoursChange = async (workerId: string, dayIndex: number, newHoursStr: string) => {
    // Parse the input value
    const newHours = newHoursStr === "" ? null : Number.parseFloat(newHoursStr)

    // Validate input
    if (newHoursStr !== "" && (isNaN(newHours!) || newHours! < 0 || newHours! > 24)) {
      toast({
        title: "Invalid input",
        description: "Hours must be between 0 and 24",
        variant: "destructive",
      })
      return
    }

    // Create a unique key for this update
    const updateKey = `${workerId}-${dayIndex}`

    // Mark this cell as updating
    setPendingUpdates((prev) => ({ ...prev, [updateKey]: true }))

    try {
      // Get the date for this day
      const date = format(weekDays[dayIndex], "yyyy-MM-dd")

      // Update the time entry in the database
      await updateTimeEntry(workerId, date, newHours)

      // Update local state to reflect the change
      const updatedData = [...data]

      // Find if there's an existing entry for this worker and day
      const existingEntryIndex = updatedData.findIndex(
        (entry) => entry.worker_id === workerId && isSameDay(new Date(entry.date), weekDays[dayIndex]),
      )

      if (existingEntryIndex >= 0) {
        // Update existing entry
        updatedData[existingEntryIndex] = {
          ...updatedData[existingEntryIndex],
          hours: newHours,
          is_absent: newHours === null || newHours === 0,
        }
      } else {
        // Create new entry
        const worker = Object.values(workerData).find((w) => w.worker_id === workerId)
        updatedData.push({
          worker_id: workerId,
          worker_name: worker.worker_name,
          date: format(weekDays[dayIndex], "yyyy-MM-dd"),
          hours: newHours,
          is_absent: newHours === null || newHours === 0,
          project_id: null,
          project_name: null,
        })
      }

      setData(updatedData)

      toast({
        title: "Hours updated",
        description: "The timesheet has been updated successfully.",
      })
    } catch (error) {
      console.error("Failed to update hours:", error)
      toast({
        title: "Error",
        description: "Failed to update hours. Please try again.",
        variant: "destructive",
      })
    } finally {
      // Clear the updating state
      setPendingUpdates((prev) => ({ ...prev, [updateKey]: false }))
      setEditingCell(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p>Loading timesheet data...</p>
      </div>
    )
  }

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[150px]">Worker</TableHead>
            {weekDays.map((day, index) => (
              <TableHead key={index} className="min-w-[100px] text-center">
                {format(day, "EEE")}
                <br />
                {format(day, "MMM d")}
              </TableHead>
            ))}
            <TableHead className="text-right min-w-[100px]">Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Object.values(workerData).length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="h-24 text-center">
                No timesheet data found.
              </TableCell>
            </TableRow>
          ) : (
            Object.values(workerData).map((worker: any) => (
              <TableRow key={worker.worker_id}>
                <TableCell className="font-medium">{worker.worker_name}</TableCell>
                {weekDays.map((day, index) => {
                  const entry = worker.days[index]
                  const isEditing = editingCell?.workerId === worker.worker_id && editingCell?.dayIndex === index
                  const isUpdating = pendingUpdates[`${worker.worker_id}-${index}`]

                  return (
                    <TableCell key={index} className="text-center p-0">
                      {entry?.is_absent ? (
                        <div className="p-4">
                          <span className="text-muted-foreground">Absent</span>
                        </div>
                      ) : isEditing ? (
                        <Input
                          type="number"
                          step="0.5"
                          min="0"
                          max="24"
                          className="w-16 h-8 text-center mx-auto"
                          defaultValue={entry?.hours?.toString() || ""}
                          autoFocus
                          onBlur={(e) => handleHoursChange(worker.worker_id, index, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              handleHoursChange(worker.worker_id, index, e.currentTarget.value)
                            } else if (e.key === "Escape") {
                              setEditingCell(null)
                            }
                          }}
                        />
                      ) : (
                        <div
                          className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => setEditingCell({ workerId: worker.worker_id, dayIndex: index })}
                        >
                          {isUpdating ? (
                            <span className="text-muted-foreground">Saving...</span>
                          ) : (
                            <span>{entry?.hours?.toFixed(1) || "—"}</span>
                          )}
                        </div>
                      )}
                    </TableCell>
                  )
                })}
                <TableCell className="text-right font-medium">{worker.total_hours.toFixed(1)}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
