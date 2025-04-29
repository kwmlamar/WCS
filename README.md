If you don’t want time entries to be auto-deleted when a worker is removed, you need to change the foreign key in your database schema:

-- Drop the existing foreign key constraint
ALTER TABLE time_entries DROP CONSTRAINT time_entries_worker_id_fkey;

-- Re-add it without cascading delete
ALTER TABLE time_entries
ADD CONSTRAINT time_entries_worker_id_fkey
FOREIGN KEY (worker_id) REFERENCES workers(id) ON DELETE SET NULL;


{"theme": "system", "display": {"dateFormat": "MM/dd/yyyy", "timeFormat": "12h", "defaultTimezone": "America/New_York", "showInactiveWorkers": false, "showInactiveProjects": false}, "dashboard": {"widgets": ["active_workers", "active_projects", "clock_entries", "needs_attention"], "defaultDateRange": "current_week"}, "defaultView": "week", "notifications": {"email": true, "browser": true, "timesheet_reminders": true, "payroll_notifications": true}}