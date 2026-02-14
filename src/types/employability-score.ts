export interface EmployabilityScore {
  id: string;
  student_id: string;
  overall_score: number;
  internship_score: number;
  feedback_score: number;
  skill_score: number;
  attendance_score: number;
  goal_score: number;
  breakdown: ScoreBreakdown;
  computed_at: string;
  created_at: string;
  updated_at: string;
}

export interface ScoreBreakdown {
  internships: {
    completed: number;
    total: number;
    weight: number;
    explanation: string;
  };
  feedback: {
    average_rating: number;
    total_feedbacks: number;
    weight: number;
    explanation: string;
  };
  skills: {
    unique_skills: number;
    target_skills: number;
    weight: number;
    explanation: string;
  };
  attendance: {
    average_rate: number;
    internships_counted: number;
    weight: number;
    explanation: string;
  };
  goals: {
    achieved: number;
    total: number;
    weight: number;
    explanation: string;
  };
}

export interface ScoreFactor {
  label: string;
  score: number;
  maxScore: number;
  weight: number;
  explanation: string;
  color: string;
}

export const SCORE_WEIGHTS = {
  internships: 25,
  feedback: 25,
  skills: 20,
  attendance: 15,
  goals: 15,
} as const;
