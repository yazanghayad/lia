"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSupervisorFeedback } from "@/hooks/use-supervisor-feedback";
import { FeedbackForm } from "./feedback-form";
import { FeedbackList } from "./feedback-list";

interface SupervisorFeedbackSectionProps {
  internshipId: string;
  currentUserId: string;
  userRole: "student" | "supervisor" | "school" | "company" | "admin";
}

export function SupervisorFeedbackSection({
  internshipId,
  currentUserId,
  userRole,
}: SupervisorFeedbackSectionProps) {
  const {
    feedbackList,
    loading,
    error,
    addFeedback,
    editFeedback,
    removeFeedback,
  } = useSupervisorFeedback(internshipId);
  const [showForm, setShowForm] = useState(false);
  const isSupervisor = userRole === "supervisor";

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Supervisor Feedback</CardTitle>
        {isSupervisor && !showForm && (
          <Button size="sm" onClick={() => setShowForm(true)}>
            Add Feedback
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {error && (
          <p className="text-sm text-destructive mb-4">{error}</p>
        )}

        {isSupervisor && showForm && (
          <div className="mb-6 p-4 border rounded-lg">
            <FeedbackForm
              internshipId={internshipId}
              supervisorId={currentUserId}
              onSubmit={async (data) => {
                await addFeedback(data);
                setShowForm(false);
              }}
              onCancel={() => setShowForm(false)}
            />
          </div>
        )}

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading feedback...</p>
        ) : (
          <FeedbackList
            feedbackList={feedbackList}
            currentUserId={currentUserId}
            isSupervisor={isSupervisor}
            internshipId={internshipId}
            onEdit={editFeedback}
            onDelete={removeFeedback}
          />
        )}
      </CardContent>
    </Card>
  );
}
