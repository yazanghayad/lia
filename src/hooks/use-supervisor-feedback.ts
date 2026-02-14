import { useCallback, useEffect, useState } from "react";
import {
  getFeedbackByInternship,
  createFeedback,
  updateFeedback,
  deleteFeedback,
} from "@/lib/supervisor-feedback";
import type {
  SupervisorFeedback,
  SupervisorFeedbackInsert,
  SupervisorFeedbackUpdate,
} from "@/types/supervisor-feedback";

export function useSupervisorFeedback(internshipId: string) {
  const [feedbackList, setFeedbackList] = useState<SupervisorFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFeedback = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getFeedbackByInternship(internshipId);
      setFeedbackList(data);
    } catch (err: any) {
      setError(err.message ?? "Failed to load feedback");
    } finally {
      setLoading(false);
    }
  }, [internshipId]);

  useEffect(() => {
    if (internshipId) fetchFeedback();
  }, [internshipId, fetchFeedback]);

  const addFeedback = async (feedback: SupervisorFeedbackInsert) => {
    const created = await createFeedback(feedback);
    setFeedbackList((prev) => [created, ...prev]);
    return created;
  };

  const editFeedback = async (id: string, updates: SupervisorFeedbackUpdate) => {
    const updated = await updateFeedback(id, updates);
    setFeedbackList((prev) =>
      prev.map((f) => (f.id === id ? updated : f))
    );
    return updated;
  };

  const removeFeedback = async (id: string) => {
    await deleteFeedback(id);
    setFeedbackList((prev) => prev.filter((f) => f.id !== id));
  };

  return {
    feedbackList,
    loading,
    error,
    fetchFeedback,
    addFeedback,
    editFeedback,
    removeFeedback,
  };
}
