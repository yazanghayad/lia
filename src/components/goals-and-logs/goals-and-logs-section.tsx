"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useInternshipGoals, useWeeklyLogs } from "@/hooks/use-internship-goals";
import { GoalForm } from "./goal-form";
import { GoalList } from "./goal-list";
import { WeeklyLogForm } from "./weekly-log-form";
import { WeeklyLogTimeline } from "./weekly-log-timeline";

interface GoalsAndLogsSectionProps {
  internshipId: string;
  currentUserId: string;
  userRole: "student" | "supervisor" | "school" | "company" | "admin";
}

export function GoalsAndLogsSection({
  internshipId,
  currentUserId,
  userRole,
}: GoalsAndLogsSectionProps) {
  const {
    goals,
    loading: goalsLoading,
    error: goalsError,
    addGoal,
    editGoal,
    removeGoal,
  } = useInternshipGoals(internshipId);
  const {
    logs,
    loading: logsLoading,
    error: logsError,
    addLog,
    editLog,
    removeLog,
  } = useWeeklyLogs(internshipId);

  const [showGoalForm, setShowGoalForm] = useState(false);
  const [showLogForm, setShowLogForm] = useState(false);

  const isSupervisor = userRole === "supervisor";
  const isStudent = userRole === "student";
  const loading = goalsLoading || logsLoading;
  const error = goalsError || logsError;

  const handleApprove = async (logId: string, comment?: string) => {
    await editLog(logId, {
      status: "approved",
      approved_by: currentUserId,
      ...(comment ? { supervisor_comment: comment, commented_by: currentUserId } : {}),
    });
  };

  const handleComment = async (logId: string, comment: string) => {
    await editLog(logId, {
      supervisor_comment: comment,
      commented_by: currentUserId,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Goals &amp; Weekly Logs</CardTitle>
      </CardHeader>
      <CardContent>
        {error && <p className="text-sm text-destructive mb-4">{error}</p>}

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : (
          <Tabs defaultValue="goals">
            <TabsList>
              <TabsTrigger value="goals">
                Goals ({goals.length})
              </TabsTrigger>
              <TabsTrigger value="logs">
                Weekly Logs ({logs.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="goals" className="mt-4 space-y-4">
              {isSupervisor && !showGoalForm && (
                <Button size="sm" onClick={() => setShowGoalForm(true)}>
                  Add Goal
                </Button>
              )}
              {isSupervisor && showGoalForm && (
                <div className="p-4 border rounded-lg">
                  <GoalForm
                    internshipId={internshipId}
                    supervisorId={currentUserId}
                    nextSortOrder={goals.length}
                    onSubmit={async (data) => {
                      await addGoal(data);
                      setShowGoalForm(false);
                    }}
                    onCancel={() => setShowGoalForm(false)}
                  />
                </div>
              )}
              <GoalList
                goals={goals}
                logs={logs}
                internshipId={internshipId}
                currentUserId={currentUserId}
                isSupervisor={isSupervisor}
                onEditGoal={async (id, data) => {
                  await editGoal(id, data);
                }}
                onDeleteGoal={removeGoal}
              />
            </TabsContent>

            <TabsContent value="logs" className="mt-4 space-y-4">
              {isStudent && goals.length > 0 && !showLogForm && (
                <Button size="sm" onClick={() => setShowLogForm(true)}>
                  New Log Entry
                </Button>
              )}
              {isStudent && goals.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Goals must be defined before you can submit weekly logs.
                </p>
              )}
              {isStudent && showLogForm && (
                <div className="p-4 border rounded-lg">
                  <WeeklyLogForm
                    internshipId={internshipId}
                    studentId={currentUserId}
                    goals={goals}
                    onSubmit={async (data) => {
                      await addLog(data);
                      setShowLogForm(false);
                    }}
                    onCancel={() => setShowLogForm(false)}
                  />
                </div>
              )}
              <WeeklyLogTimeline
                logs={logs}
                goals={goals}
                currentUserId={currentUserId}
                isSupervisor={isSupervisor}
                isStudent={isStudent}
                onApprove={handleApprove}
                onComment={handleComment}
                onEditLog={async (id, updates) => {
                  await editLog(id, updates);
                }}
                onDeleteLog={removeLog}
              />
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}
