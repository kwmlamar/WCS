"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PayrollEntryForm } from "./payroll-entry-form";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Edit, MoreHorizontal, DollarSign, CheckCircle, Plus } from "lucide-react";
import { updatePayrollEntry, markPayrollAsPaid } from "@/lib/data";
import type { PayrollEntry } from "@/lib/types";
import { generateMissingPayrollEntries } from "@/lib/data";

interface PayrollTableProps {
  entries: PayrollEntry[];
  isLoading: boolean;
  onRefresh: () => void;
  periodType: "weekly" | "monthly";
  startDate: Date;
  endDate: Date;
}

export function PayrollTable({
  entries,
  isLoading,
  onRefresh,
  periodType,
  startDate,
  endDate,
}: PayrollTableProps) {
  const [selectedEntry, setSelectedEntry] = useState<PayrollEntry | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPayDialogOpen, setIsPayDialogOpen] = useState(false);
  const [selectedEntries, setSelectedEntries] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleEditEntry = (entry: PayrollEntry) => {
    setSelectedEntry(entry);
    setIsEditDialogOpen(true);
  };

  const handleMarkAsPaid = (entry: PayrollEntry) => {
    setSelectedEntries([entry.id]);
    setIsPayDialogOpen(true);
  };

  const handleMarkAllAsPaid = () => {
    const unpaidEntries = entries
      .filter((entry) => entry.status === "unpaid")
      .map((entry) => entry.id);
    if (unpaidEntries.length === 0) return;
    setSelectedEntries(unpaidEntries);
    setIsPayDialogOpen(true);
  };

  const handleSaveEntry = async (updatedEntry: PayrollEntry) => {
    setIsProcessing(true);
    try {
      await updatePayrollEntry(updatedEntry);
      setIsEditDialogOpen(false);
      onRefresh();
    } catch (error) {
      console.error("Error updating payroll entry:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGenerateMissingPayroll = async () => {
    setIsProcessing(true);
    try {
      await generateMissingPayrollEntries(startDate, endDate);
      onRefresh(); // Refresh table
    } catch (error) {
      console.error("Error generating missing payroll:", error);
      alert("Something went wrong while generating payroll. Check console for details.");
    } finally {
      setIsProcessing(false);
    }
  };

  const confirmMarkAsPaid = async () => {
    setIsProcessing(true);
    try {
      await markPayrollAsPaid(selectedEntries);
      setIsPayDialogOpen(false);
      onRefresh();
    } catch (error) {
      console.error("Error marking payroll as paid:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p>Loading payroll data...</p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <div className="flex justify-end p-4">
          <Button 
          variant="outline"
          className="mr-auto"
          onClick={handleGenerateMissingPayroll}
          disabled={isProcessing}>
            <Plus className="mr-2 h-4 w-4" />
            Generate Missing Payroll
          </Button>
          <Button
            onClick={handleMarkAllAsPaid}
            disabled={entries.every((entry) => entry.status === "paid")}
          >
            <CheckCircle className="mr-2 size-4" />
            Mark All as Paid
          </Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Worker</TableHead>
              <TableHead>Pay Period</TableHead>
              <TableHead>Hours</TableHead>
              <TableHead>Rate</TableHead>
              <TableHead>Gross Pay</TableHead>
              <TableHead>Deductions</TableHead>
              <TableHead>Net Pay</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="h-24 text-center">
                  No payroll entries found for this period.
                </TableCell>
              </TableRow>
            ) : (
              entries.map((entry) => {
                return (
                  <TableRow key={entry.id}>
                    <TableCell className="font-medium">
                      {entry.worker_name}
                    </TableCell>
                    <TableCell>
                      {format(new Date(entry.period_start), "MMM d")} -{" "}
                      {format(new Date(entry.period_end), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell >
                      {Number.isInteger(entry.regular_hours)
                        ? entry.regular_hours
                        : parseFloat(entry.regular_hours.toFixed(1))}

                      {entry.overtime_hours > 0 && (
                        <> + {entry.overtime_hours.toFixed(1)} OT</>
                      )}
                    </TableCell>
                    <TableCell>${entry.hourly_rate.toFixed(2)}/hr</TableCell>
                    <TableCell>${entry.gross_pay.toFixed(2)}</TableCell>
                    <TableCell>${entry.deductions.toFixed(2)}</TableCell>
                    <TableCell className="font-medium">
                      ${entry.net_pay.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          entry.status === "paid" ? "default" : "outline"
                        }
                      >
                        {entry.status === "paid" ? "Paid" : "Unpaid"}
                      </Badge>
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
                          <DropdownMenuItem
                            onSelect={(e) => {
                              e.preventDefault();
                              handleEditEntry(entry);}}
                          >
                            <Edit className="mr-2 size-4" />
                            Edit
                          </DropdownMenuItem>
                          {entry.status !== "paid" && (
                            <DropdownMenuItem
                              onSelect={(e) => {
                                e.preventDefault();
                                handleMarkAsPaid(entry)}}
                            >
                              <DollarSign className="mr-2 size-4" />
                              Mark as Paid
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Payroll Entry</DialogTitle>
            <DialogDescription>
              Update the payroll entry details below.
            </DialogDescription>
          </DialogHeader>
          {selectedEntry && (
            <PayrollEntryForm
              entry={selectedEntry}
              onSubmit={handleSaveEntry}
              onCancel={() => setIsEditDialogOpen(false)}
              isProcessing={isProcessing}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Mark as Paid Confirmation Dialog */}
      <AlertDialog open={isPayDialogOpen} onOpenChange={setIsPayDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark as Paid?</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark{" "}
              {selectedEntries.length > 1
                ? "these payroll entries"
                : "this payroll entry"}{" "}
              as paid with today's date.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmMarkAsPaid}
              disabled={isProcessing}
            >
              {isProcessing ? "Processing..." : "Mark as Paid"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
