export interface InternshipGoal {
  id: string;
  internship_id: string;
  created_by: string;
  title: string;
  description: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface InternshipGoalInsert {
  internship_id: string;
  created_by: string;
  title: string;
  description?: string;
  sort_order?: number;
}

export type WeeklyLogStatus = "draft" | "submitted" | "approved";

export interface WeeklyLog {
  id: string;
  internship_id: string;
  student_id: string;
  goal_id: string;
  week_number: number;
  content: string;
  status: WeeklyLogStatus;
  supervisor_comment: string | null;
  commented_by: string | null;
  submitted_at: string | null;
  approved_at: string | null;
  approved_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface WeeklyLogInsert {
  internship_id: string;
  student_id: string;
  goal_id: string;
  week_number: number;
  content: string;
  status?: WeeklyLogStatus;
}

export interface WeeklyLogUpdate {
  content?: string;
  status?: WeeklyLogStatus;
  supervisor_comment?: string;
  commented_by?: string;
  approved_by?: string;
}

export const LOG_STATUS_LABELS: Record<WeeklyLogStatus, string> = {
  draft: "Draft",
  submitted: "Submitted",
  approved: "Approved",
};

export const LOG_STATUS_VARIANT: Record<WeeklyLogStatus, "secondary" | "default" | "outline"> = {
  draft: "secondary",
  submitted: "default",
  approved: "outline",
};
