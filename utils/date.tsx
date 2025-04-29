import { startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns"

type PeriodType = "weekly" | "monthly";

export function getPeriodDates(periodType: PeriodType, date: Date) {
    if (periodType === "weekly") {
        const weekStart = startOfWeek(date, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(date, { weekStartsOn: 1 });
        return { startDate: weekStart, endDate: weekEnd };
    } else {
        const monthStart = startOfMonth(date);
        const monthEnd = endOfMonth(date);
        return { startDate: monthStart, endDate: monthEnd };
    }
}