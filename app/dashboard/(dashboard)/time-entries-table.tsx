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
import { Edit, MoreHorizontal, Trash2, UserX } from "lucide-react"
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
    // In a real app, this would be an API call to update the entry
    console.log("Updating entry:", updatedEntry)
    setIsEditDialogOpen(false)
    onRefresh()
  }

  const confirmDelete = async () => {
    // In a real app, this would be an API call to delete the entry
    console.log("Deleting entry:", selectedEntry)
    setIsDeleteDialogOpen(false)
    onRefresh()
  }

  const confirmMarkAbsent = async () => {
    // In a real app, this would be an API call to mark the worker as absent
    console.log("Marking worker as absent:", selectedEntry)
    setIsAbsentDialogOpen(false)
    onRefresh()
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p>Loading time entries...</p>
      </div>
    )
  }

  return (
    <>
      <div className="rounded-md border">
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
                  <TableCell>{entry.is_absent ? "—" : entry.hours || "—"}</TableCell>
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
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
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
            <AlertDialogAction onClick={confirmMarkAbsent}>Mark Absent</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
