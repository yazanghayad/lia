export type FeedbackType = "weekly" | "mid_term" | "final";

export interface SupervisorFeedback {
  id: string;
  internship_id: string;
  supervisor_id: string;
  feedback_type: FeedbackType;
  rating: number;
  content: string;
  visible_to_school: boolean;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface SupervisorFeedbackInsert {
  internship_id: string;
  supervisor_id: string;
  feedback_type: FeedbackType;
  rating: number;
  content: string;
  visible_to_school?: boolean;
}

export interface SupervisorFeedbackUpdate {
  rating?: number;
  content?: string;
  visible_to_school?: boolean;
}

export const FEEDBACK_TYPE_LABELS: Record<FeedbackType, string> = {
  weekly: "Weekly",
  mid_term: "Mid-term",
  final: "Final",
};

export const RATING_LABELS: Record<number, string> = {
  1: "Unsatisfactory",
  2: "Needs Improvement",
  3: "Satisfactory",
  4: "Good",
  5: "Excellent",
};
