"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import type { AttendanceRecord, AttendanceStatus } from "@/types/attendance";
import { STATUS_LABELS, STATUS_COLORS } from "@/types/attendance";
import { cn } from "@/lib/utils";

interface DailyAttendanceFormProps {
  date: string;
  existingRecord?: AttendanceRecord;
  internshipId: string;
  studentId: string;
  isStudent: boolean;
  isSupervisor: boolean;
  currentUserId: string;
  onMark: (data: {
    internship_id: string;
    student_id: string;
    date: string;
    status: AttendanceStatus;
    note?: string;
  }) => Promise<void>;
  onApprove: (id: string, approvedBy: string) => Promise<void>;
  onCorrect: (
    attendanceId: string,
    previousStatus: string,
    newStatus: AttendanceStatus,
    previousNote: string | null,
    newNote: string | undefined,
    reason: string
  ) => Promise<void>;
  onClose: () => void;
}

const STATUS_OPTIONS: AttendanceStatus[] = ["present", "absent", "remote"];

export function DailyAttendanceForm({
  date,
  existingRecord,
  internshipId,
  studentId,
  isStudent,
  isSupervisor,
  currentUserId,
  onMark,
  onApprove,
  onCorrect,
  onClose,
}: DailyAttendanceFormProps) {
  const [status, setStatus] = useState<AttendanceStatus>(
    existingRecord?.status ?? "present"
  );
  const [note, setNote] = useState(existingRecord?.note ?? "");
  const [correctionReason, setCorrectionReason] = useState("");
  const [showCorrection, setShowCorrection] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isApproved = existingRecord?.approved === true;
  const canStudentEdit = isStudent && (!existingRecord || !isApproved);
  const canSupervisorCorrect = isSupervisor && !!existingRecord;

  const formattedDate = new Date(date + "T00:00:00").toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const handleStudentSubmit = async () => {
    setSubmitting(true);
    try {
      await onMark({
        internship_id: internshipId,
        student_id: studentId,
        date,
        status,
        note: note.trim() || undefined,
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async () => {
    if (!existingRecord) return;
    setSubmitting(true);
    try {
      await onApprove(existingRecord.id, currentUserId);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const handleCorrection = async () => {
    if (!existingRecord || !correctionReason.trim()) return;
    setSubmitting(true);
    try {
      await onCorrect(
        existingRecord.id,
        existingRecord.status,
        status,
        existingRecord.note,
        note.trim() || undefined,
        correctionReason.trim()
      );
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">{formattedDate}</p>
        {existingRecord && (
          <Badge variant={isApproved ? "outline" : "secondary"}>
            {isApproved ? "Approved" : "Pending"}
          </Badge>
        )}
      </div>

      {/* Status selection */}
      <div className="space-y-2">
        <Label>Status</Label>
        <div className="flex gap-2">
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s}
              type="button"
              disabled={(!canStudentEdit && !showCorrection)}
              onClick={() => setStatus(s)}
              className={cn(
                "flex-1 rounded-md border px-3 py-2 text-sm font-medium transition-colors",
                status === s
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border hover:bg-accent",
                (!canStudentEdit && !showCorrection) && "opacity-50 cursor-not-allowed"
              )}
            >
              <span className={cn("inline-block h-2 w-2 rounded-full mr-1.5", STATUS_COLORS[s])} />
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Note */}
      <div className="space-y-2">
        <Label htmlFor="att-note">Note (optional)</Label>
        <Textarea
          id="att-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Add a note..."
          rows={2}
          disabled={!canStudentEdit && !showCorrection}
        />
      </div>

      {/* Supervisor correction section */}
      {canSupervisorCorrect && showCorrection && (
        <div className="space-y-2 p-3 border rounded-lg bg-muted/30">
          <Label htmlFor="correction-reason">Reason for correction</Label>
          <Textarea
            id="correction-reason"
            value={correctionReason}
            onChange={(e) => setCorrectionReason(e.target.value)}
            placeholder="Explain why this correction is needed..."
            rows={2}
            required
          />
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onClose}>
          Close
        </Button>

        {canStudentEdit && (
          <Button size="sm" disabled={submitting} onClick={handleStudentSubmit}>
            {submitting ? "Saving..." : existingRecord ? "Update" : "Mark Attendance"}
          </Button>
        )}

        {canSupervisorCorrect && !showCorrection && (
          <>
            {!isApproved && (
              <Button size="sm" disabled={submitting} onClick={handleApprove}>
                Approve
              </Button>
            )}
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowCorrection(true)}
            >
              Correct
            </Button>
          </>
        )}

        {canSupervisorCorrect && showCorrection && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCorrection(false)}
            >
              Cancel Correction
            </Button>
            <Button
              size="sm"
              disabled={submitting || !correctionReason.trim()}
              onClick={handleCorrection}
            >
              {submitting ? "Saving..." : "Save Correction"}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
