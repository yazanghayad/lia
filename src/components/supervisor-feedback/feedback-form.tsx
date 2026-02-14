"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  FEEDBACK_TYPE_LABELS,
  RATING_LABELS,
  type FeedbackType,
  type SupervisorFeedback,
} from "@/types/supervisor-feedback";

interface FeedbackFormProps {
  internshipId: string;
  supervisorId: string;
  existingFeedback?: SupervisorFeedback;
  onSubmit: (data: {
    internship_id: string;
    supervisor_id: string;
    feedback_type: FeedbackType;
    rating: number;
    content: string;
    visible_to_school: boolean;
  }) => Promise<void>;
  onCancel?: () => void;
}

export function FeedbackForm({
  internshipId,
  supervisorId,
  existingFeedback,
  onSubmit,
  onCancel,
}: FeedbackFormProps) {
  const [feedbackType, setFeedbackType] = useState<FeedbackType>(
    existingFeedback?.feedback_type ?? "weekly"
  );
  const [rating, setRating] = useState<number>(existingFeedback?.rating ?? 3);
  const [content, setContent] = useState(existingFeedback?.content ?? "");
  const [visibleToSchool, setVisibleToSchool] = useState(
    existingFeedback?.visible_to_school ?? false
  );
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setSubmitting(true);
    try {
      await onSubmit({
        internship_id: internshipId,
        supervisor_id: supervisorId,
        feedback_type: feedbackType,
        rating,
        content: content.trim(),
        visible_to_school: visibleToSchool,
      });
      if (!existingFeedback) {
        setContent("");
        setRating(3);
        setFeedbackType("weekly");
        setVisibleToSchool(false);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="feedback-type">Feedback Period</Label>
          <Select
            value={feedbackType}
            onValueChange={(val) => setFeedbackType(val as FeedbackType)}
          >
            <SelectTrigger id="feedback-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(FEEDBACK_TYPE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="rating">Rating</Label>
          <Select
            value={String(rating)}
            onValueChange={(val) => setRating(Number(val))}
          >
            <SelectTrigger id="rating">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(RATING_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {value} — {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="content">Written Feedback</Label>
        <Textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Provide detailed feedback on the student's performance..."
          rows={4}
          required
        />
      </div>

      <div className="flex items-center gap-2">
        <Switch
          id="visible-to-school"
          checked={visibleToSchool}
          onCheckedChange={setVisibleToSchool}
        />
        <Label htmlFor="visible-to-school" className="font-normal">
          Share this feedback with the school
        </Label>
      </div>

      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={submitting || !content.trim()}>
          {submitting
            ? "Saving..."
            : existingFeedback
            ? "Update Feedback"
            : "Submit Feedback"}
        </Button>
      </div>
    </form>
  );
}
