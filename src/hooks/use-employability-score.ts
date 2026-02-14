import { useCallback, useEffect, useState } from "react";
import type { EmployabilityScore } from "@/types/employability-score";

export function useEmployabilityScore(studentId: string) {
  const [score, setScore] = useState<EmployabilityScore | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchScore = useCallback(
    async (recalculate = false) => {
      try {
        setLoading(true);
        setError(null);
        const url = `/api/employability/${studentId}${recalculate ? "?recalculate=true" : ""}`;
        const res = await fetch(url);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error);
        setScore(json.score);
      } catch (err: any) {
        setError(err.message ?? "Failed to load score");
      } finally {
        setLoading(false);
      }
    },
    [studentId]
  );

  useEffect(() => {
    if (studentId) fetchScore();
  }, [studentId, fetchScore]);

  const recalculate = () => fetchScore(true);

  return { score, loading, error, recalculate };
}
