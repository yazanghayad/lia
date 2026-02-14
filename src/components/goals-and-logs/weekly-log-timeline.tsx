"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { InternshipGoal, WeeklyLog } from "@/types/internship-goals";
import { LOG_STATUS_LABELS, LOG_STATUS_VARIANT } from "@/types/internship-goals";

interface WeeklyLogTimelineProps {
  logs: WeeklyLog[];
  goals: InternshipGoal[];
  currentUserId: string;
  isSupervisor: boolean;
  isStudent: boolean;
  onApprove: (id: string, comment?: string) => Promise<void>;
  onComment: (id: string, comment: string) => Promise<void>;
  onEditLog: (id: string, updates: { content?: string; status?: string }) => Promise<void>;
  onDeleteLog: (id: string) => Promise<void>;
}

function groupLogsByWeek(logs: WeeklyLog[]) {
  const map = new Map<number, WeeklyLog[]>();
  for (const log of logs) {
    const existing = map.get(log.week_number) ?? [];
    existing.push(log);
    map.set(log.week_number, existing);
  }
  return Array.from(map.entries()).sort(([a], [b]) => b - a);
}

export function WeeklyLogTimeline({
  logs,
  goals,
  currentUserId,
  isSupervisor,
  isStudent,
  onApprove,
  onComment,
  onEditLog,
  onDeleteLog,
}: WeeklyLogTimelineProps) {
  const [commentingId, setCommentingId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  const goalMap = new Map(goals.map((g) => [g.id, g]));
  const grouped = groupLogsByWeek(logs);

  if (logs.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-2">
        No weekly logs have been recorded yet.
      </p>
    );
  }

  const handleApproveWithComment = async (logId: string) => {
    await onApprove(logId, commentText.trim() || undefined);
    setCommentingId(null);
    setCommentText("");
  };

  const handleSaveEdit = async (logId: string) => {
    await onEditLog(logId, { content: editContent.trim() });
    setEditingId(null);
    setEditContent("");
  };

  return (
    <div className="space-y-6">
      {grouped.map(([weekNum, weekLogs]) => (
        <div key={weekNum}>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-2 w-2 rounded-full bg-primary" />
            <h4 className="text-sm font-medium">Week {weekNum}</h4>
          </div>
          <div className="ml-3 border-l pl-4 space-y-3">
            {weekLogs.map((log) => {
              const goal = goalMap.get(log.goal_id);
              const isApproved = log.status === "approved";
              const isDraft = log.status === "draft";
              const isSubmitted = log.status === "submitted";

              return (
                <Card key={log.id} className={isApproved ? "opacity-80" : ""}>
                  <CardHeader className="pb-2 pt-3 px-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant={LOG_STATUS_VARIANT[log.status]}>
                          {LOG_STATUS_LABELS[log.status]}
                        </Badge>
                        {goal && (
                          <span className="text-xs text-muted-foreground">
                            {goal.title}
                          </span>
                        )}
                      </div>
                      <time className="text-xs text-muted-foreground" dateTime={log.created_at}>
                        {new Date(log.created_at).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })}
                      </time>
                    </div>
                  </CardHeader>
                  <CardContent className="px-4 pb-3">
                    {editingId === log.id ? (
                      <div className="space-y-2">
                        <Textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          rows={3}
                        />
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingId(null)}
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleSaveEdit(log.id)}
                          >
                            Save
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm whitespace-pre-wrap">{log.content}</p>
                    )}

                    {log.supervisor_comment && (
                      <div className="mt-3 p-2 rounded border bg-muted/50">
                        <p className="text-xs font-medium mb-1">Supervisor Comment</p>
                        <p className="text-sm">{log.supervisor_comment}</p>
                      </div>
                    )}

                    {/* Student actions on draft logs */}
                    {isStudent && isDraft && !editingId && (
                      <div className="flex gap-2 mt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingId(log.id);
                            setEditContent(log.content);
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          onClick={() =>
                            onEditLog(log.id, { status: "submitted" })
                          }
                        >
                          Submit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => onDeleteLog(log.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    )}

                    {/* Supervisor actions on submitted logs */}
                    {isSupervisor && isSubmitted && (
                      <div className="mt-3">
                        {commentingId === log.id ? (
                          <div className="space-y-2">
                            <Label className="text-xs">Comment (optional)</Label>
                            <Textarea
                              value={commentText}
                              onChange={(e) => setCommentText(e.target.value)}
                              placeholder="Add a comment before approving..."
                              rows={2}
                            />
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setCommentingId(null);
                                  setCommentText("");
                                }}
                              >
                                Cancel
                              </Button>
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={async () => {
                                  if (commentText.trim()) {
                                    await onComment(log.id, commentText.trim());
                                  }
                                  setCommentingId(null);
                                  setCommentText("");
                                }}
                                disabled={!commentText.trim()}
                              >
                                Comment Only
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleApproveWithComment(log.id)}
                              >
                                Approve
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setCommentingId(log.id)}
                            >
                              Review
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => onApprove(log.id)}
                            >
                              Approve
                            </Button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Audit footer */}
                    {isApproved && log.approved_at && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Approved on{" "}
                        {new Date(log.approved_at).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
