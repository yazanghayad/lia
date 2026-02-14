"use client";

import { Card, CardContent } from "@/components/ui/card";
import type { AttendanceSummary } from "@/types/attendance";

interface AttendanceSummaryProps {
  summary: AttendanceSummary;
}

export function AttendanceSummaryView({ summary }: AttendanceSummaryProps) {
  const stats = [
    { label: "Total Days", value: summary.total_days },
    { label: "Present", value: summary.present, color: "text-green-600" },
    { label: "Remote", value: summary.remote, color: "text-blue-600" },
    { label: "Absent", value: summary.absent, color: "text-red-600" },
    { label: "Approved", value: summary.approved },
    { label: "Pending", value: summary.pending },
  ];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        {stats.map((s) => (
          <div key={s.label} className="text-center p-2 rounded-md border">
            <p className={`text-lg font-semibold ${s.color ?? ""}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-green-500 transition-all"
            style={{ width: `${summary.attendance_rate}%` }}
          />
        </div>
        <span className="text-sm font-medium">{summary.attendance_rate}%</span>
      </div>
      <p className="text-xs text-muted-foreground text-center">
        Attendance Rate (present + remote)
      </p>
    </div>
  );
}
