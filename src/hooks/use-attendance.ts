import { useCallback, useEffect, useState } from "react";
import {
  getAttendanceByInternship,
  markAttendance,
  updateAttendance,
  approveAttendance,
  bulkApproveAttendance,
  correctAttendance,
  computeSummary,
} from "@/lib/attendance";
import type {
  AttendanceRecord,
  AttendanceRecordInsert,
  AttendanceRecordUpdate,
  AttendanceCorrectionInsert,
  AttendanceSummary,
  AttendanceStatus,
} from "@/types/attendance";

export function useAttendance(internshipId: string) {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [month, setMonth] = useState(new Date().getMonth());
  const [year, setYear] = useState(new Date().getFullYear());

  const summary: AttendanceSummary = computeSummary(records);

  const fetchRecords = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAttendanceByInternship(internshipId, month, year);
      setRecords(data);
    } catch (err: any) {
      setError(err.message ?? "Failed to load attendance");
    } finally {
      setLoading(false);
    }
  }, [internshipId, month, year]);

  useEffect(() => {
    if (internshipId) fetchRecords();
  }, [internshipId, fetchRecords]);

  const mark = async (record: AttendanceRecordInsert) => {
    const created = await markAttendance(record);
    setRecords((prev) => {
      const idx = prev.findIndex((r) => r.date === created.date);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = created;
        return updated;
      }
      return [...prev, created].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );
    });
    return created;
  };

  const update = async (id: string, updates: AttendanceRecordUpdate) => {
    const updated = await updateAttendance(id, updates);
    setRecords((prev) => prev.map((r) => (r.id === id ? updated : r)));
    return updated;
  };

  const approve = async (id: string, approvedBy: string) => {
    const updated = await approveAttendance(id, approvedBy);
    setRecords((prev) => prev.map((r) => (r.id === id ? updated : r)));
    return updated;
  };

  const bulkApprove = async (ids: string[], approvedBy: string) => {
    const updated = await bulkApproveAttendance(ids, approvedBy);
    const map = new Map(updated.map((r) => [r.id, r]));
    setRecords((prev) => prev.map((r) => map.get(r.id) ?? r));
    return updated;
  };

  const correct = async (
    correction: AttendanceCorrectionInsert,
    newStatus: AttendanceRecordUpdate
  ) => {
    const result = await correctAttendance(correction, newStatus);
    setRecords((prev) =>
      prev.map((r) => (r.id === correction.attendance_id ? result.record : r))
    );
    return result;
  };

  const navigateMonth = (direction: "prev" | "next") => {
    if (direction === "prev") {
      if (month === 0) {
        setMonth(11);
        setYear((y) => y - 1);
      } else {
        setMonth((m) => m - 1);
      }
    } else {
      if (month === 11) {
        setMonth(0);
        setYear((y) => y + 1);
      } else {
        setMonth((m) => m + 1);
      }
    }
  };

  const getRecordForDate = (date: string): AttendanceRecord | undefined =>
    records.find((r) => r.date === date);

  return {
    records,
    loading,
    error,
    summary,
    month,
    year,
    navigateMonth,
    getRecordForDate,
    mark,
    update,
    approve,
    bulkApprove,
    correct,
    fetchRecords,
  };
}
