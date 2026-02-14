import { useCallback, useEffect, useState } from "react";
import {
  getGoalsByInternship,
  createGoal,
  updateGoal,
  deleteGoal,
  getLogsByInternship,
  createLog,
  updateLog,
  deleteLog,
} from "@/lib/internship-goals";
import type {
  InternshipGoal,
  InternshipGoalInsert,
  WeeklyLog,
  WeeklyLogInsert,
  WeeklyLogUpdate,
} from "@/types/internship-goals";

export function useInternshipGoals(internshipId: string) {
  const [goals, setGoals] = useState<InternshipGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGoals = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getGoalsByInternship(internshipId);
      setGoals(data);
    } catch (err: any) {
      setError(err.message ?? "Failed to load goals");
    } finally {
      setLoading(false);
    }
  }, [internshipId]);

  useEffect(() => {
    if (internshipId) fetchGoals();
  }, [internshipId, fetchGoals]);

  const addGoal = async (goal: InternshipGoalInsert) => {
    const created = await createGoal(goal);
    setGoals((prev) => [...prev, created]);
    return created;
  };

  const editGoal = async (
    id: string,
    updates: Partial<Pick<InternshipGoal, "title" | "description" | "sort_order">>
  ) => {
    const updated = await updateGoal(id, updates);
    setGoals((prev) => prev.map((g) => (g.id === id ? updated : g)));
    return updated;
  };

  const removeGoal = async (id: string) => {
    await deleteGoal(id);
    setGoals((prev) => prev.filter((g) => g.id !== id));
  };

  return { goals, loading, error, fetchGoals, addGoal, editGoal, removeGoal };
}

export function useWeeklyLogs(internshipId: string) {
  const [logs, setLogs] = useState<WeeklyLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getLogsByInternship(internshipId);
      setLogs(data);
    } catch (err: any) {
      setError(err.message ?? "Failed to load logs");
    } finally {
      setLoading(false);
    }
  }, [internshipId]);

  useEffect(() => {
    if (internshipId) fetchLogs();
  }, [internshipId, fetchLogs]);

  const addLog = async (log: WeeklyLogInsert) => {
    const created = await createLog(log);
    setLogs((prev) => [...prev, created]);
    return created;
  };

  const editLog = async (id: string, updates: WeeklyLogUpdate) => {
    const updated = await updateLog(id, updates);
    setLogs((prev) => prev.map((l) => (l.id === id ? updated : l)));
    return updated;
  };

  const removeLog = async (id: string) => {
    await deleteLog(id);
    setLogs((prev) => prev.filter((l) => l.id !== id));
  };

  return { logs, loading, error, fetchLogs, addLog, editLog, removeLog };
}
