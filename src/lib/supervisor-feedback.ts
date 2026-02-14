import { supabase } from "@/lib/supabase";
import type {
  SupervisorFeedback,
  SupervisorFeedbackInsert,
  SupervisorFeedbackUpdate,
} from "@/types/supervisor-feedback";

export async function getFeedbackByInternship(
  internshipId: string
): Promise<SupervisorFeedback[]> {
  const { data, error } = await supabase
    .from("supervisor_feedback")
    .select("*")
    .eq("internship_id", internshipId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function createFeedback(
  feedback: SupervisorFeedbackInsert
): Promise<SupervisorFeedback> {
  const { data, error } = await supabase
    .from("supervisor_feedback")
    .insert(feedback)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateFeedback(
  id: string,
  updates: SupervisorFeedbackUpdate
): Promise<SupervisorFeedback> {
  const { data, error } = await supabase
    .from("supervisor_feedback")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteFeedback(id: string): Promise<void> {
  const { error } = await supabase
    .from("supervisor_feedback")
    .delete()
    .eq("id", id);

  if (error) throw error;
}
