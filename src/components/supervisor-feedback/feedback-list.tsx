"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FEEDBACK_TYPE_LABELS,
  RATING_LABELS,
  type SupervisorFeedback,
} from "@/types/supervisor-feedback";
import { FeedbackForm } from "./feedback-form";

interface FeedbackListProps {
  feedbackList: SupervisorFeedback[];
  currentUserId: string;
  isSupervisor: boolean;
  internshipId: string;
  onEdit: (id: string, data: { rating?: number; content?: string; visible_to_school?: boolean }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

function RatingStars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" title={RATING_LABELS[rating]}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={star <= rating ? "text-yellow-500" : "text-muted-foreground/30"}
        >
          ★
        </span>
      ))}
      <span className="ml-1 text-xs text-muted-foreground">
        ({RATING_LABELS[rating]})
      </span>
    </span>
  );
}

export function FeedbackList({
  feedbackList,
  currentUserId,
  isSupervisor,
  internshipId,
  onEdit,
  onDelete,
}: FeedbackListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);

  if (feedbackList.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4">
        No feedback has been submitted yet.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {feedbackList.map((fb) => (
        <Card key={fb.id}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  {FEEDBACK_TYPE_LABELS[fb.feedback_type]}
                </Badge>
                {fb.visible_to_school && (
                  <Badge variant="outline" className="text-xs">
                    Shared with school
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>v{fb.version}</span>
                <span>·</span>
                <time dateTime={fb.created_at}>
                  {new Date(fb.created_at).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </time>
                {fb.updated_at !== fb.created_at && (
                  <>
                    <span>·</span>
                    <span>
                      edited{" "}
                      {new Date(fb.updated_at).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {editingId === fb.id ? (
              <FeedbackForm
                internshipId={internshipId}
                supervisorId={currentUserId}
                existingFeedback={fb}
                onSubmit={async (data) => {
                  await onEdit(fb.id, {
                    rating: data.rating,
                    content: data.content,
                    visible_to_school: data.visible_to_school,
                  });
                  setEditingId(null);
                }}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <>
                <div className="mb-2">
                  <RatingStars rating={fb.rating} />
                </div>
                <p className="text-sm whitespace-pre-wrap">{fb.content}</p>
                {isSupervisor && fb.supervisor_id === currentUserId && (
                  <div className="flex gap-2 mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingId(fb.id)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={() => onDelete(fb.id)}
                    >
                      Delete
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
