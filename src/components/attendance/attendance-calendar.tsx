"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { AttendanceRecord, AttendanceStatus } from "@/types/attendance";
import { STATUS_COLORS, STATUS_LABELS } from "@/types/attendance";
import { cn } from "@/lib/utils";

interface AttendanceCalendarProps {
  month: number;
  year: number;
  records: AttendanceRecord[];
  onNavigate: (direction: "prev" | "next") => void;
  onDayClick: (date: string, record?: AttendanceRecord) => void;
  selectedDate: string | null;
}

function getDaysInMonth(month: number, year: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(month: number, year: number) {
  return new Date(year, month, 1).getDay();
}

function formatDateStr(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function AttendanceCalendar({
  month,
  year,
  records,
  onNavigate,
  onDayClick,
  selectedDate,
}: AttendanceCalendarProps) {
  const daysInMonth = getDaysInMonth(month, year);
  const firstDay = getFirstDayOfWeek(month, year);
  const today = new Date().toISOString().split("T")[0];

  const recordMap = new Map(records.map((r) => [r.date, r]));

  const cells: Array<{ day: number | null; dateStr: string | null }> = [];
  for (let i = 0; i < firstDay; i++) {
    cells.push({ day: null, dateStr: null });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, dateStr: formatDateStr(year, month, d) });
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <Button variant="outline" size="sm" onClick={() => onNavigate("prev")}>
          ←
        </Button>
        <h3 className="text-sm font-medium">
          {MONTH_NAMES[month]} {year}
        </h3>
        <Button variant="outline" size="sm" onClick={() => onNavigate("next")}>
          →
        </Button>
      </div>

      {/* Legend */}
      <div className="flex gap-3 mb-3">
        {(["present", "absent", "remote"] as AttendanceStatus[]).map((s) => (
          <div key={s} className="flex items-center gap-1.5 text-xs">
            <span className={cn("h-2.5 w-2.5 rounded-full", STATUS_COLORS[s])} />
            {STATUS_LABELS[s]}
          </div>
        ))}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/20" />
          No record
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEKDAYS.map((d) => (
          <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell, idx) => {
          if (!cell.day || !cell.dateStr) {
            return <div key={idx} className="h-10" />;
          }

          const record = recordMap.get(cell.dateStr);
          const isToday = cell.dateStr === today;
          const isSelected = cell.dateStr === selectedDate;
          const isFuture = cell.dateStr > today;
          const isWeekend = idx % 7 === 0 || idx % 7 === 6;

          return (
            <button
              key={idx}
              type="button"
              disabled={isFuture}
              onClick={() => onDayClick(cell.dateStr!, record)}
              className={cn(
                "relative h-10 rounded-md text-xs font-medium transition-colors",
                "hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                isSelected && "ring-2 ring-primary",
                isToday && "border border-primary",
                isFuture && "opacity-30 cursor-not-allowed",
                isWeekend && !record && "text-muted-foreground/50"
              )}
            >
              <span>{cell.day}</span>
              {record && (
                <span
                  className={cn(
                    "absolute bottom-1 left-1/2 -translate-x-1/2 h-1.5 w-1.5 rounded-full",
                    STATUS_COLORS[record.status]
                  )}
                />
              )}
              {record?.approved && (
                <span className="absolute top-0.5 right-0.5 text-[8px]">✓</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
