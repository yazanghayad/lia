import { supabase } from "@/lib/supabase";
import type {
  InternshipGoal,
  InternshipGoalInsert,
  WeeklyLog,
  WeeklyLogInsert,
  WeeklyLogUpdate,
} from "@/types/internship-goals";

// --- Goals ---

export async function getGoalsByInternship(internshipId: string): Promise<InternshipGoal[]> {
  const { data, error } = await supabase
    .from("internship_goals")
    .select("*")
    .eq("internship_id", internshipId)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function createGoal(goal: InternshipGoalInsert): Promise<InternshipGoal> {
  const { data, error } = await supabase
    .from("internship_goals")
    .insert(goal)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateGoal(
  id: string,
  updates: Partial<Pick<InternshipGoal, "title" | "description" | "sort_order">>
): Promise<InternshipGoal> {
  const { data, error } = await supabase
    .from("internship_goals")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteGoal(id: string): Promise<void> {
  const { error } = await supabase
    .from("internship_goals")
    .delete()
    .eq("id", id);
  if (error) throw error;
}

// --- Weekly Logs ---

export async function getLogsByInternship(internshipId: string): Promise<WeeklyLog[]> {
  const { data, error } = await supabase
    .from("weekly_logs")
    .select("*")
    .eq("internship_id", internshipId)
    .order("week_number", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function createLog(log: WeeklyLogInsert): Promise<WeeklyLog> {
  const { data, error } = await supabase
    .from("weekly_logs")
    .insert(log)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateLog(id: string, updates: WeeklyLogUpdate): Promise<WeeklyLog> {
  const { data, error } = await supabase
    .from("weekly_logs")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteLog(id: string): Promise<void> {
  const { error } = await supabase
    .from("weekly_logs")
    .delete()
    .eq("id", id);
  if (error) throw error;
}
