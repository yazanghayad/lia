"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { InternshipGoal, WeeklyLog } from "@/types/internship-goals";

interface WeeklyLogFormProps {
  internshipId: string;
  studentId: string;
  goals: InternshipGoal[];
  existingLog?: WeeklyLog;
  onSubmit: (data: {
    internship_id: string;
    student_id: string;
    goal_id: string;
    week_number: number;
    content: string;
    status?: "draft" | "submitted";
  }) => Promise<void>;
  onCancel: () => void;
}

export function WeeklyLogForm({
  internshipId,
  studentId,
  goals,
  existingLog,
  onSubmit,
  onCancel,
}: WeeklyLogFormProps) {
  const [goalId, setGoalId] = useState(existingLog?.goal_id ?? (goals[0]?.id ?? ""));
  const [weekNumber, setWeekNumber] = useState(existingLog?.week_number ?? 1);
  const [content, setContent] = useState(existingLog?.content ?? "");
  const [submitting, setSubmitting] = useState(false);

  const handleSave = async (status: "draft" | "submitted") => {
    if (!content.trim() || !goalId) return;
    setSubmitting(true);
    try {
      await onSubmit({
        internship_id: internshipId,
        student_id: studentId,
        goal_id: goalId,
        week_number: weekNumber,
        content: content.trim(),
        status,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="log-goal">Goal</Label>
          <Select
            value={goalId}
            onValueChange={setGoalId}
            disabled={!!existingLog}
          >
            <SelectTrigger id="log-goal">
              <SelectValue placeholder="Select a goal" />
            </SelectTrigger>
            <SelectContent>
              {goals.map((g) => (
                <SelectItem key={g.id} value={g.id}>
                  {g.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="log-week">Week Number</Label>
          <Input
            id="log-week"
            type="number"
            min={1}
            max={52}
            value={weekNumber}
            onChange={(e) => setWeekNumber(Number(e.target.value))}
            disabled={!!existingLog}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="log-content">Log Entry</Label>
        <Textarea
          id="log-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Describe your progress this week for the selected goal..."
          rows={4}
          required
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          variant="secondary"
          size="sm"
          disabled={submitting || !content.trim()}
          onClick={() => handleSave("draft")}
        >
          Save Draft
        </Button>
        <Button
          size="sm"
          disabled={submitting || !content.trim()}
          onClick={() => handleSave("submitted")}
        >
          {submitting ? "Submitting..." : "Submit"}
        </Button>
      </div>
    </div>
  );
}
