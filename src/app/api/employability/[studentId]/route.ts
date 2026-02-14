import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { computeEmployabilityScore } from "@/lib/employability-engine";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TARGET_SKILL_COUNT = 10; // configurable baseline

export async function GET(
  req: NextRequest,
  { params }: { params: { studentId: string } }
) {
  try {
    const { studentId } = params;
    const recalculate = req.nextUrl.searchParams.get("recalculate") === "true";

    // Return cached if not recalculating
    if (!recalculate) {
      const { data: cached } = await supabaseAdmin
        .from("employability_scores")
        .select("*")
        .eq("student_id", studentId)
        .maybeSingle();
      if (cached) {
        return NextResponse.json({ score: cached });
      }
    }

    // Fetch all internships for student
    const { data: internships } = await supabaseAdmin
      .from("internships")
      .select("id, status")
      .eq("student_id", studentId);
    const allInternships = internships ?? [];
    const completedInternships = allInternships.filter((i) => i.status === "completed");
    const internshipIds = allInternships.map((i) => i.id);

    // Fetch supervisor feedback ratings
    let averageFeedbackRating = 0;
    let totalFeedbacks = 0;
    if (internshipIds.length > 0) {
      const { data: feedbacks } = await supabaseAdmin
        .from("supervisor_feedback")
        .select("rating")
        .in("internship_id", internshipIds);
      if (feedbacks && feedbacks.length > 0) {
        totalFeedbacks = feedbacks.length;
        averageFeedbackRating =
          feedbacks.reduce((sum: number, f: any) => sum + f.rating, 0) / totalFeedbacks;
      }
    }

    // Fetch unique skills (from internship skills or profile skills)
    let uniqueSkills = 0;
    const { data: skills } = await supabaseAdmin
      .from("skills")
      .select("id")
      .eq("student_id", studentId);
    uniqueSkills = skills?.length ?? 0;

    // If no skills table exists for students, try internship-level
    if (uniqueSkills === 0 && internshipIds.length > 0) {
      const { data: intSkills } = await supabaseAdmin
        .from("internship_skills")
        .select("skill_name")
        .in("internship_id", internshipIds);
      if (intSkills) {
        const unique = new Set(intSkills.map((s: any) => s.skill_name));
        uniqueSkills = unique.size;
      }
    }

    // Fetch attendance rates across internships
    let averageAttendanceRate = 0;
    let internshipsWithAttendance = 0;
    if (internshipIds.length > 0) {
      const { data: attendance } = await supabaseAdmin
        .from("attendance_records")
        .select("internship_id, status")
        .in("internship_id", internshipIds);
      if (attendance && attendance.length > 0) {
        const byInternship = new Map<string, { total: number; present: number }>();
        for (const a of attendance) {
          const entry = byInternship.get(a.internship_id) ?? { total: 0, present: 0 };
          entry.total++;
          if (a.status === "present" || a.status === "remote") entry.present++;
          byInternship.set(a.internship_id, entry);
        }
        internshipsWithAttendance = byInternship.size;
        const rates = Array.from(byInternship.values()).map(
          (e) => (e.present / e.total) * 100
        );
        averageAttendanceRate =
          rates.reduce((sum, r) => sum + r, 0) / rates.length;
      }
    }

    // Fetch goals
    let goalsAchieved = 0;
    let totalGoals = 0;
    if (internshipIds.length > 0) {
      const { data: goals } = await supabaseAdmin
        .from("internship_goals")
        .select("id")
        .in("internship_id", internshipIds);
      totalGoals = goals?.length ?? 0;

      // Goals with at least one approved log are "achieved"
      if (totalGoals > 0) {
        const { data: approvedLogs } = await supabaseAdmin
          .from("weekly_logs")
          .select("goal_id")
          .in("internship_id", internshipIds)
          .eq("status", "approved");
        if (approvedLogs) {
          goalsAchieved = new Set(approvedLogs.map((l: any) => l.goal_id)).size;
        }
      }
    }

    const result = computeEmployabilityScore({
      completedInternships: completedInternships.length,
      totalInternships: allInternships.length,
      averageFeedbackRating,
      totalFeedbacks,
      uniqueSkills,
      targetSkillCount: TARGET_SKILL_COUNT,
      averageAttendanceRate,
      internshipsWithAttendance,
      goalsAchieved,
      totalGoals,
    });

    // Upsert cached score
    const { data: score, error: upsertError } = await supabaseAdmin
      .from("employability_scores")
      .upsert(
        {
          student_id: studentId,
          ...result,
          computed_at: new Date().toISOString(),
        },
        { onConflict: "student_id" }
      )
      .select()
      .single();

    if (upsertError) throw upsertError;

    return NextResponse.json({ score });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Failed to compute score" },
      { status: 500 }
    );
  }
}
