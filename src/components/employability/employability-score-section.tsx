"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useEmployabilityScore } from "@/hooks/use-employability-score";
import type { ScoreFactor } from "@/types/employability-score";
import { cn } from "@/lib/utils";

interface EmployabilityScoreSectionProps {
  studentId: string;
  showRecalculate?: boolean;
}

function ScoreRing({ score, size = 100 }: { score: number; size?: number }) {
  const radius = (size - 10) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color =
    score >= 75 ? "text-green-500" : score >= 50 ? "text-yellow-500" : "text-red-500";

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={6}
          className="text-muted"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={6}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={color}
        />
      </svg>
      <span className="absolute text-xl font-bold">{Math.round(score)}</span>
    </div>
  );
}

function FactorBar({ factor }: { factor: ScoreFactor }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{factor.label}</span>
          <Badge variant="outline" className="text-xs">
            {factor.weight}%
          </Badge>
        </div>
        <span className="text-sm font-semibold">
          {Math.round(factor.score)}/100
        </span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all", factor.color)}
          style={{ width: `${Math.min(factor.score, 100)}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground">{factor.explanation}</p>
    </div>
  );
}

export function EmployabilityScoreSection({
  studentId,
  showRecalculate = false,
}: EmployabilityScoreSectionProps) {
  const { score, loading, error, recalculate } =
    useEmployabilityScore(studentId);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Employability Score</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Computing score...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Employability Score</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!score) return null;

  const factors: ScoreFactor[] = [
    {
      label: "Internship Completion",
      score: score.internship_score,
      maxScore: 100,
      weight: score.breakdown.internships.weight,
      explanation: score.breakdown.internships.explanation,
      color: "bg-purple-500",
    },
    {
      label: "Supervisor Feedback",
      score: score.feedback_score,
      maxScore: 100,
      weight: score.breakdown.feedback.weight,
      explanation: score.breakdown.feedback.explanation,
      color: "bg-blue-500",
    },
    {
      label: "Skill Coverage",
      score: score.skill_score,
      maxScore: 100,
      weight: score.breakdown.skills.weight,
      explanation: score.breakdown.skills.explanation,
      color: "bg-indigo-500",
    },
    {
      label: "Attendance",
      score: score.attendance_score,
      maxScore: 100,
      weight: score.breakdown.attendance.weight,
      explanation: score.breakdown.attendance.explanation,
      color: "bg-green-500",
    },
    {
      label: "Goal Achievement",
      score: score.goal_score,
      maxScore: 100,
      weight: score.breakdown.goals.weight,
      explanation: score.breakdown.goals.explanation,
      color: "bg-amber-500",
    },
  ];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Employability Score</CardTitle>
        {showRecalculate && (
          <Button variant="outline" size="sm" onClick={recalculate}>
            Recalculate
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center mb-6">
          <ScoreRing score={score.overall_score} size={120} />
          <p className="text-sm text-muted-foreground mt-2">
            Overall Employability Score
          </p>
          <p className="text-xs text-muted-foreground">
            Last computed{" "}
            {new Date(score.computed_at).toLocaleDateString(undefined, {
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>

        <div className="space-y-4">
          <h4 className="text-sm font-medium">Score Breakdown</h4>
          {factors.map((f) => (
            <FactorBar key={f.label} factor={f} />
          ))}
        </div>

        <div className="mt-4 p-3 rounded-lg border bg-muted/30">
          <p className="text-xs text-muted-foreground">
            <strong>How is this calculated?</strong> Each factor is scored 0–100
            based on your data, then weighted by its percentage. The overall
            score is the weighted average. Internship completion and feedback
            quality each contribute 25%, skill coverage 20%, and attendance and
            goal achievement each contribute 15%.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
