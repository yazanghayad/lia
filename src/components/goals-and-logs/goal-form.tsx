"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { InternshipGoal } from "@/types/internship-goals";

interface GoalFormProps {
  internshipId: string;
  supervisorId: string;
  existingGoal?: InternshipGoal;
  nextSortOrder?: number;
  onSubmit: (data: {
    internship_id: string;
    created_by: string;
    title: string;
    description?: string;
    sort_order?: number;
  }) => Promise<void>;
  onCancel: () => void;
}

export function GoalForm({
  internshipId,
  supervisorId,
  existingGoal,
  nextSortOrder = 0,
  onSubmit,
  onCancel,
}: GoalFormProps) {
  const [title, setTitle] = useState(existingGoal?.title ?? "");
  const [description, setDescription] = useState(existingGoal?.description ?? "");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    try {
      await onSubmit({
        internship_id: internshipId,
        created_by: supervisorId,
        title: title.trim(),
        description: description.trim() || undefined,
        sort_order: existingGoal?.sort_order ?? nextSortOrder,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="goal-title">Goal Title</Label>
        <Input
          id="goal-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Complete onboarding tasks"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="goal-desc">Description (optional)</Label>
        <Textarea
          id="goal-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe what the student should achieve..."
          rows={2}
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" size="sm" disabled={submitting || !title.trim()}>
          {submitting ? "Saving..." : existingGoal ? "Update Goal" : "Add Goal"}
        </Button>
      </div>
    </form>
  );
}
