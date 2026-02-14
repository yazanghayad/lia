export type AttendanceStatus = "present" | "absent" | "remote";

export interface AttendanceRecord {
  id: string;
  internship_id: string;
  student_id: string;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  note: string | null;
  submitted_at: string;
  approved: boolean;
  approved_at: string | null;
  approved_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface AttendanceRecordInsert {
  internship_id: string;
  student_id: string;
  date: string;
  status: AttendanceStatus;
  note?: string;
}

export interface AttendanceRecordUpdate {
  status?: AttendanceStatus;
  note?: string;
  approved?: boolean;
  approved_at?: string;
  approved_by?: string;
}

export interface AttendanceCorrection {
  id: string;
  attendance_id: string;
  corrected_by: string;
  previous_status: string;
  new_status: string;
  previous_note: string | null;
  new_note: string | null;
  reason: string;
  created_at: string;
}

export interface AttendanceCorrectionInsert {
  attendance_id: string;
  corrected_by: string;
  previous_status: string;
  new_status: string;
  previous_note?: string;
  new_note?: string;
  reason: string;
}

export interface AttendanceSummary {
  total_days: number;
  present: number;
  absent: number;
  remote: number;
  approved: number;
  pending: number;
  attendance_rate: number; // percentage (present + remote) / total
}

export const STATUS_LABELS: Record<AttendanceStatus, string> = {
  present: "Present",
  absent: "Absent",
  remote: "Remote",
};

export const STATUS_COLORS: Record<AttendanceStatus, string> = {
  present: "bg-green-500",
  absent: "bg-red-500",
  remote: "bg-blue-500",
};
