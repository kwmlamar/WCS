"use client"

import { useState } from "react"
import { format } from "date-fns"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { TimeEntryForm } from "./time-entry-form"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Edit, MoreHorizontal, Trash2, UserX, RefreshCw } from "lucide-react"
import { updateTimeEntry, deleteTimeEntry } from "@/lib/data"
import { toast } from "@/hooks/use-toast"
import type { TimeEntry } from "@/lib/types"

interface TimeEntriesTableProps {
  entries: TimeEntry[]
  isLoading: boolean
  onRefresh: () => void
}

export function TimeEntriesTable({ entries, isLoading, onRefresh }: TimeEntriesTableProps) {
  const [selectedEntry, setSelectedEntry] = useState<TimeEntry | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isAbsentDialogOpen, setIsAbsentDialogOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  const handleEditEntry = (entry: TimeEntry) => {
    setSelectedEntry(entry)
    setIsEditDialogOpen(true)
  }

  const handleDeleteEntry = (entry: TimeEntry) => {
    setSelectedEntry(entry)
    setIsDeleteDialogOpen(true)
  }

  const handleMarkAbsent = (entry: TimeEntry) => {
    setSelectedEntry(entry)
    setIsAbsentDialogOpen(true)
  }

  const handleSaveEntry = async (updatedEntry: TimeEntry) => {
    setIsProcessing(true)
    try {
      await updateTimeEntry(updatedEntry)
      setIsEditDialogOpen(false)
      toast({
        title: "Success",
        description: "Time entry updated successfully.",
      })
      onRefresh()
    } catch (error) {
      console.error("Error updating time entry:", error)
      toast({
        title: "Error",
        description: "Failed to update time entry. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const confirmDelete = async () => {
    if (!selectedEntry) return

    setIsProcessing(true)
    try {
      await deleteTimeEntry(selectedEntry.id)
      setIsDeleteDialogOpen(false)
      toast({
        title: "Success",
        description: "Time entry deleted successfully.",
      })
      onRefresh()
    } catch (error) {
      console.error("Error deleting time entry:", error)
      toast({
        title: "Error",
        description: "Failed to delete time entry. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const confirmMarkAbsent = async () => {
    if (!selectedEntry) return

    setIsProcessing(true)
    try {
      const absentEntry = {
        ...selectedEntry,
        is_absent: true,
        clock_in: null,
        clock_out: null,
        hours: null,
        project_id: null,
        project_name: null,
      }

      await updateTimeEntry(absentEntry)
      setIsAbsentDialogOpen(false)
      toast({
        title: "Success",
        description: "Worker marked as absent successfully.",
      })
      onRefresh()
    } catch (error) {
      console.error("Error marking worker as absent:", error)
      toast({
        title: "Error",
        description: "Failed to mark worker as absent. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <>
      <div className="rounded-md border">
        <div className="flex justify-between items-center p-4">
          <h3 className="text-lg font-medium">Time Entries</h3>
          <Button variant="outline" size="sm" onClick={onRefresh} disabled={isLoading}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Worker</TableHead>
              <TableHead>Project</TableHead>
              <TableHead>Clock In</TableHead>
              <TableHead>Clock Out</TableHead>
              <TableHead>Hours</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  No time entries found.
                </TableCell>
              </TableRow>
            ) : (
              entries.map((entry) => (
                <TableRow key={entry.id} className={entry.is_absent ? "bg-muted/50" : ""}>
                  <TableCell className="font-medium">{entry.worker_name}</TableCell>
                  <TableCell>{entry.project_name || "—"}</TableCell>
                  <TableCell>
                    {entry.is_absent ? "—" : entry.clock_in ? format(new Date(entry.clock_in), "h:mm a") : "—"}
                  </TableCell>
                  <TableCell>
                    {entry.is_absent ? "—" : entry.clock_out ? format(new Date(entry.clock_out), "h:mm a") : "—"}
                  </TableCell>
                  <TableCell>{entry.is_absent ? "—" : entry.hours?.toFixed(1) || "—"}</TableCell>
                  <TableCell>
                    {entry.is_absent ? (
                      <Badge variant="outline" className="bg-muted">
                        Absent
                      </Badge>
                    ) : !entry.clock_out ? (
                      <Badge>Active</Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className={
                          entry.is_auto
                            ? "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-400"
                            : ""
                        }
                      >
                        {entry.is_auto ? "Auto" : "Manual"}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="size-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditEntry(entry)}>
                          <Edit className="mr-2 size-4" />
                          Edit
                        </DropdownMenuItem>
                        {!entry.is_absent && (
                          <DropdownMenuItem onClick={() => handleMarkAbsent(entry)}>
                            <UserX className="mr-2 size-4" />
                            Mark Absent
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => handleDeleteEntry(entry)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 size-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Time Entry</DialogTitle>
            <DialogDescription>Update the time entry details below.</DialogDescription>
          </DialogHeader>
          {selectedEntry && (
            <TimeEntryForm
              entry={selectedEntry}
              onSubmit={handleSaveEntry}
              onCancel={() => setIsEditDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this time entry. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={isProcessing}>
              {isProcessing ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Mark Absent Confirmation Dialog */}
      <AlertDialog open={isAbsentDialogOpen} onOpenChange={setIsAbsentDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark as Absent?</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark the worker as absent for the day and remove any clock in/out times.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmMarkAbsent} disabled={isProcessing}>
              {isProcessing ? "Processing..." : "Mark Absent"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
