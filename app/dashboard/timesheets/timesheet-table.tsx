'use client'

import { useState, useEffect } from "react"
import { format, addDays, isSameDay } from "date-fns"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { supabase } from "@/lib/supabaseClient" // Import Supabase client
import { fetchTimesheetData } from "@/lib/data"
import type { TimesheetEntry } from "@/lib/types"

interface TimesheetTableProps {
  startDate: Date
  endDate: Date
  workerId?: string
}

export function TimesheetTable({ startDate, endDate, workerId }: TimesheetTableProps) {
  const [data, setData] = useState<TimesheetEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        const timesheetData = await fetchTimesheetData(startDate, endDate, workerId)
        setData(timesheetData)
      } catch (error) {
        console.error("Failed to fetch timesheet data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [startDate, endDate, workerId])

  const saveTimeEntry = async (entry: TimesheetEntry) => {
    const { data, error } = await supabase
      .from("timesheets")
      .upsert([entry], { onConflict: ["worker_id", "date"] }) // Replace with your actual constraints

    if (error) {
      console.error("Failed to save timesheet entry:", error.message)
    } else {
      console.log("Entry saved successfully:", data)
    }
  }

  // Handle changing hours in editable cells
  const handleHoursChange = (workerId: string, dayIndex: number, newHours: number) => {
    const updatedData = data.map((entry) => 
      entry.worker_id === workerId && isSameDay(new Date(entry.date), addDays(startDate, dayIndex))
        ? { ...entry, hours: newHours }
        : entry
    )
    
    if (!updatedData.some((entry) => entry.worker_id === workerId && isSameDay(new Date(entry.date), addDays(startDate, dayIndex)))) {
      // If no entry exists for the day, create a new one
      const newEntry: TimesheetEntry = {
        worker_id: workerId,
        date: format(addDays(startDate, dayIndex), "yyyy-MM-dd"),
        hours: newHours,
        worker_name: "Mitch", // Use actual worker name if available
      }
      updatedData.push(newEntry)
    }

    setData(updatedData)

    // Update Supabase
    const updatedEntry = updatedData.find(
      (entry) => entry.worker_id === workerId && isSameDay(new Date(entry.date), addDays(startDate, dayIndex))
    )
    if (updatedEntry) {
      saveTimeEntry(updatedEntry)
    }
  }

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
                  return (
                    <TableCell key={index} className="text-center">
                      {entry ? (
                        entry.is_absent ? (
                          <span className="text-muted-foreground">Absent</span>
                        ) : (
                          <input
                            type="number"
                            value={entry.hours || ""}
                            onChange={(e) => handleHoursChange(worker.worker_id, index, parseFloat(e.target.value))}
                            className="w-16 text-center"
                          />
                        )
                      ) : (
                        <input
                          type="number"
                          onChange={(e) => handleHoursChange(worker.worker_id, index, parseFloat(e.target.value))}
                          className="w-16 text-center"
                        />
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
