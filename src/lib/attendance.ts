import { supabase } from "@/lib/supabase";
import type {
  AttendanceRecord,
  AttendanceRecordInsert,
  AttendanceRecordUpdate,
  AttendanceCorrection,
  AttendanceCorrectionInsert,
  AttendanceSummary,
} from "@/types/attendance";

export async function getAttendanceByInternship(
  internshipId: string,
  month?: number,
  year?: number
): Promise<AttendanceRecord[]> {
  let query = supabase
    .from("attendance_records")
    .select("*")
    .eq("internship_id", internshipId)
    .order("date", { ascending: true });

  if (month !== undefined && year !== undefined) {
    const startDate = `${year}-${String(month + 1).padStart(2, "0")}-01`;
    const endMonth = month + 1 > 11 ? 0 : month + 1;
    const endYear = month + 1 > 11 ? year + 1 : year;
    const endDate = `${endYear}-${String(endMonth + 1).padStart(2, "0")}-01`;
    query = query.gte("date", startDate).lt("date", endDate);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function markAttendance(
  record: AttendanceRecordInsert
): Promise<AttendanceRecord> {
  const { data, error } = await supabase
    .from("attendance_records")
    .upsert(record, { onConflict: "internship_id,student_id,date" })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateAttendance(
  id: string,
  updates: AttendanceRecordUpdate
): Promise<AttendanceRecord> {
  const { data, error } = await supabase
    .from("attendance_records")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function approveAttendance(
  id: string,
  approvedBy: string
): Promise<AttendanceRecord> {
  return updateAttendance(id, {
    approved: true,
    approved_at: new Date().toISOString(),
    approved_by: approvedBy,
  });
}

export async function bulkApproveAttendance(
  ids: string[],
  approvedBy: string
): Promise<AttendanceRecord[]> {
  const { data, error } = await supabase
    .from("attendance_records")
    .update({
      approved: true,
      approved_at: new Date().toISOString(),
      approved_by: approvedBy,
    })
    .in("id", ids)
    .select();
  if (error) throw error;
  return data ?? [];
}

export async function correctAttendance(
  correction: AttendanceCorrectionInsert,
  newStatus: AttendanceRecordUpdate
): Promise<{ record: AttendanceRecord; correction: AttendanceCorrection }> {
  // Insert correction record
  const { data: correctionData, error: correctionError } = await supabase
    .from("attendance_corrections")
    .insert(correction)
    .select()
    .single();
  if (correctionError) throw correctionError;

  // Update the attendance record
  const record = await updateAttendance(correction.attendance_id, newStatus);

  return { record, correction: correctionData };
}

export async function getCorrections(
  attendanceId: string
): Promise<AttendanceCorrection[]> {
  const { data, error } = await supabase
    .from("attendance_corrections")
    .select("*")
    .eq("attendance_id", attendanceId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export function computeSummary(records: AttendanceRecord[]): AttendanceSummary {
  const total_days = records.length;
  const present = records.filter((r) => r.status === "present").length;
  const absent = records.filter((r) => r.status === "absent").length;
  const remote = records.filter((r) => r.status === "remote").length;
  const approved = records.filter((r) => r.approved).length;
  const pending = total_days - approved;
  const attendance_rate =
    total_days > 0 ? Math.round(((present + remote) / total_days) * 100) : 0;

  return { total_days, present, absent, remote, approved, pending, attendance_rate };
}
