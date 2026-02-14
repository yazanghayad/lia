"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { InternshipGoal, WeeklyLog } from "@/types/internship-goals";
import { GoalForm } from "./goal-form";

interface GoalListProps {
  goals: InternshipGoal[];
  logs: WeeklyLog[];
  internshipId: string;
  currentUserId: string;
  isSupervisor: boolean;
  onEditGoal: (id: string, data: { title: string; description?: string }) => Promise<void>;
  onDeleteGoal: (id: string) => Promise<void>;
}

export function GoalList({
  goals,
  logs,
  internshipId,
  currentUserId,
  isSupervisor,
  onEditGoal,
  onDeleteGoal,
}: GoalListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);

  if (goals.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-2">
        {isSupervisor
          ? "No goals defined yet. Add goals to get started."
          : "No goals have been defined for this internship yet."}
      </p>
    );
  }

  const getGoalLogStats = (goalId: string) => {
    const goalLogs = logs.filter((l) => l.goal_id === goalId);
    const approved = goalLogs.filter((l) => l.status === "approved").length;
    const submitted = goalLogs.filter((l) => l.status === "submitted").length;
    return { total: goalLogs.length, approved, submitted };
  };

  return (
    <div className="space-y-2">
      {goals.map((goal, idx) => {
        const stats = getGoalLogStats(goal.id);
        const hasApprovedLogs = stats.approved > 0;

        if (editingId === goal.id) {
          return (
            <Card key={goal.id}>
              <CardContent className="pt-4">
                <GoalForm
                  internshipId={internshipId}
                  supervisorId={currentUserId}
                  existingGoal={goal}
                  onSubmit={async (data) => {
                    await onEditGoal(goal.id, {
                      title: data.title,
                      description: data.description,
                    });
                    setEditingId(null);
                  }}
                  onCancel={() => setEditingId(null)}
                />
              </CardContent>
            </Card>
          );
        }

        return (
          <Card key={goal.id}>
            <CardContent className="flex items-start justify-between gap-3 pt-4">
              <div className="flex items-start gap-3 min-w-0">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-medium">
                  {idx + 1}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium leading-tight">{goal.title}</p>
                  {goal.description && (
                    <p className="text-xs text-muted-foreground mt-1">{goal.description}</p>
                  )}
                  <div className="flex gap-1.5 mt-2">
                    {stats.total > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {stats.total} log{stats.total !== 1 ? "s" : ""}
                      </Badge>
                    )}
                    {stats.approved > 0 && (
                      <Badge variant="outline" className="text-xs">
                        {stats.approved} approved
                      </Badge>
                    )}
                    {stats.submitted > 0 && (
                      <Badge variant="default" className="text-xs">
                        {stats.submitted} pending
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              {isSupervisor && (
                <div className="flex gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingId(goal.id)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    disabled={hasApprovedLogs}
                    onClick={() => onDeleteGoal(goal.id)}
                    title={hasApprovedLogs ? "Cannot delete a goal with approved logs" : undefined}
                  >
                    Delete
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
