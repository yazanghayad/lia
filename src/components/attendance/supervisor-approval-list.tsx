"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { AttendanceRecord } from "@/types/attendance";
import { STATUS_LABELS, STATUS_COLORS } from "@/types/attendance";
import { cn } from "@/lib/utils";

interface SupervisorApprovalListProps {
  records: AttendanceRecord[];
  onApprove: (id: string, approvedBy: string) => Promise<void>;
  onBulkApprove: (ids: string[], approvedBy: string) => Promise<void>;
  currentUserId: string;
  onSelectRecord: (date: string, record: AttendanceRecord) => void;
}

export function SupervisorApprovalList({
  records,
  onApprove,
  onBulkApprove,
  currentUserId,
  onSelectRecord,
}: SupervisorApprovalListProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);

  const pendingRecords = records.filter((r) => !r.approved);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === pendingRecords.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pendingRecords.map((r) => r.id)));
    }
  };

  const handleBulkApprove = async () => {
    if (selectedIds.size === 0) return;
    setSubmitting(true);
    try {
      await onBulkApprove(Array.from(selectedIds), currentUserId);
      setSelectedIds(new Set());
    } finally {
      setSubmitting(false);
    }
  };

  if (pendingRecords.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-2">
        All attendance records have been approved.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={toggleAll}>
          {selectedIds.size === pendingRecords.length ? "Deselect All" : "Select All"}
        </Button>
        <Button
          size="sm"
          disabled={selectedIds.size === 0 || submitting}
          onClick={handleBulkApprove}
        >
          {submitting
            ? "Approving..."
            : `Approve Selected (${selectedIds.size})`}
        </Button>
      </div>

      <div className="space-y-1">
        {pendingRecords.map((record) => (
          <Card
            key={record.id}
            className={cn(
              "cursor-pointer transition-colors",
              selectedIds.has(record.id) && "ring-1 ring-primary"
            )}
          >
            <CardContent className="flex items-center gap-3 py-2 px-3">
              <input
                type="checkbox"
                className="rounded"
                checked={selectedIds.has(record.id)}
                onChange={() => toggleSelect(record.id)}
              />
              <span className="text-sm font-medium min-w-[90px]">
                {new Date(record.date + "T00:00:00").toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  weekday: "short",
                })}
              </span>
              <Badge variant="secondary" className="text-xs">
                <span
                  className={cn(
                    "inline-block h-1.5 w-1.5 rounded-full mr-1",
                    STATUS_COLORS[record.status]
                  )}
                />
                {STATUS_LABELS[record.status]}
              </Badge>
              {record.note && (
                <span className="text-xs text-muted-foreground truncate flex-1">
                  {record.note}
                </span>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectRecord(record.date, record);
                }}
              >
                View
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
