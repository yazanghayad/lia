import type { ScoreBreakdown } from "@/types/employability-score";
import { SCORE_WEIGHTS } from "@/types/employability-score";

interface RawData {
  completedInternships: number;
  totalInternships: number;
  averageFeedbackRating: number;
  totalFeedbacks: number;
  uniqueSkills: number;
  targetSkillCount: number;
  averageAttendanceRate: number;
  internshipsWithAttendance: number;
  goalsAchieved: number;
  totalGoals: number;
}

/**
 * Compute employability score from raw data.
 * All formulas are transparent and documented.
 *
 * Each factor is scored 0–100, then weighted by its assigned weight.
 * Overall = sum(factor_score * weight) / sum(weights)
 */
export function computeEmployabilityScore(data: RawData) {
  // 1. Internship completion score (0-100)
  // Formula: (completed / max(total, 1)) * 100, capped + bonus for count
  const internshipRatio =
    data.totalInternships > 0
      ? data.completedInternships / data.totalInternships
      : 0;
  const internshipCountBonus = Math.min(data.completedInternships * 10, 30); // up to 30 bonus for volume
  const internshipRaw = Math.min(internshipRatio * 70 + internshipCountBonus, 100);

  // 2. Feedback quality score (0-100)
  // Formula: (avg_rating / 5) * 80 + min(total_feedbacks * 2, 20)
  const feedbackQuality =
    data.totalFeedbacks > 0 ? (data.averageFeedbackRating / 5) * 80 : 0;
  const feedbackVolume = Math.min(data.totalFeedbacks * 2, 20);
  const feedbackRaw = Math.min(feedbackQuality + feedbackVolume, 100);

  // 3. Skill coverage score (0-100)
  // Formula: (unique_skills / target) * 100
  const skillTarget = Math.max(data.targetSkillCount, 1);
  const skillRaw = Math.min((data.uniqueSkills / skillTarget) * 100, 100);

  // 4. Attendance score (0-100)
  // Direct from average attendance rate
  const attendanceRaw =
    data.internshipsWithAttendance > 0 ? Math.min(data.averageAttendanceRate, 100) : 0;

  // 5. Goal achievement score (0-100)
  // Formula: (goals_achieved / max(total, 1)) * 100
  const goalRaw =
    data.totalGoals > 0
      ? Math.min((data.goalsAchieved / data.totalGoals) * 100, 100)
      : 0;

  // Round subscores
  const scores = {
    internship: Math.round(internshipRaw * 100) / 100,
    feedback: Math.round(feedbackRaw * 100) / 100,
    skill: Math.round(skillRaw * 100) / 100,
    attendance: Math.round(attendanceRaw * 100) / 100,
    goal: Math.round(goalRaw * 100) / 100,
  };

  // Weighted overall
  const totalWeight =
    SCORE_WEIGHTS.internships +
    SCORE_WEIGHTS.feedback +
    SCORE_WEIGHTS.skills +
    SCORE_WEIGHTS.attendance +
    SCORE_WEIGHTS.goals;

  const overall =
    (scores.internship * SCORE_WEIGHTS.internships +
      scores.feedback * SCORE_WEIGHTS.feedback +
      scores.skill * SCORE_WEIGHTS.skills +
      scores.attendance * SCORE_WEIGHTS.attendance +
      scores.goal * SCORE_WEIGHTS.goals) /
    totalWeight;

  const breakdown: ScoreBreakdown = {
    internships: {
      completed: data.completedInternships,
      total: data.totalInternships,
      weight: SCORE_WEIGHTS.internships,
      explanation: `${data.completedInternships}/${data.totalInternships} internships completed. Completion rate contributes 70%, volume bonus up to 30%.`,
    },
    feedback: {
      average_rating: data.averageFeedbackRating,
      total_feedbacks: data.totalFeedbacks,
      weight: SCORE_WEIGHTS.feedback,
      explanation: `Average supervisor rating: ${data.averageFeedbackRating.toFixed(1)}/5 across ${data.totalFeedbacks} reviews. Rating quality contributes 80%, volume up to 20%.`,
    },
    skills: {
      unique_skills: data.uniqueSkills,
      target_skills: data.targetSkillCount,
      weight: SCORE_WEIGHTS.skills,
      explanation: `${data.uniqueSkills} unique skills demonstrated out of ${data.targetSkillCount} target skills.`,
    },
    attendance: {
      average_rate: data.averageAttendanceRate,
      internships_counted: data.internshipsWithAttendance,
      weight: SCORE_WEIGHTS.attendance,
      explanation: `Average attendance rate of ${data.averageAttendanceRate.toFixed(1)}% across ${data.internshipsWithAttendance} internship(s).`,
    },
    goals: {
      achieved: data.goalsAchieved,
      total: data.totalGoals,
      weight: SCORE_WEIGHTS.goals,
      explanation: `${data.goalsAchieved}/${data.totalGoals} internship goals achieved.`,
    },
  };

  return {
    overall_score: Math.round(overall * 100) / 100,
    internship_score: scores.internship,
    feedback_score: scores.feedback,
    skill_score: scores.skill,
    attendance_score: scores.attendance,
    goal_score: scores.goal,
    breakdown,
  };
}
