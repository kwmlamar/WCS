"use client"

import { AppSidebar } from "@/components/app-sidebar";
import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { DataTable } from "@/components/data-table";
import { SectionCards } from "@/components/section-cards";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { testTimeEntriesTable } from "@/lib/data"
import { toast } from "@/hooks/use-toast"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"

export default function TestPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

  const runTest = async () => {
    setIsLoading(true)
    try {
      const result = await testTimeEntriesTable()
      setTestResult(result)

      if (result.success) {
        toast({
          title: "Test Successful",
          description: result.message,
        })
      } else {
        toast({
          title: "Test Failed",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Test error:", error)
      setTestResult({
        success: false,
        message: "An unexpected error occurred: " + (error instanceof Error ? error.message : String(error)),
      })

      toast({
        title: "Test Error",
        description: "An unexpected error occurred while testing.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Database Test</h2>
        <p className="text-muted-foreground">Test your Supabase connection and database tables.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Test Time Entries Table</CardTitle>
          <CardDescription>
            This will test if the time_entries table is working correctly by creating, fetching, and deleting a test
            entry.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {testResult && (
            <div
              className={`p-4 rounded-md ${testResult.success ? "bg-green-50 dark:bg-green-950" : "bg-red-50 dark:bg-red-950"}`}
            >
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  {testResult.success ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                </div>
                <div className="ml-3">
                  <h3
                    className={`text-sm font-medium ${testResult.success ? "text-green-800 dark:text-green-200" : "text-red-800 dark:text-red-200"}`}
                  >
                    {testResult.success ? "Test Passed" : "Test Failed"}
                  </h3>
                  <div
                    className={`mt-2 text-sm ${testResult.success ? "text-green-700 dark:text-green-300" : "text-red-700 dark:text-red-300"}`}
                  >
                    <p>{testResult.message}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button onClick={runTest} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Running Test...
              </>
            ) : (
              "Run Test"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
    </SidebarInset>
    </SidebarProvider>
  )
}
