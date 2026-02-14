export interface Certificate {
  id: string;
  internship_id: string;
  student_id: string;
  company_id: string;
  issued_at: string;
  certificate_number: string;
  student_name: string;
  company_name: string;
  school_name: string | null;
  internship_title: string;
  start_date: string;
  end_date: string;
  goals_achieved: string[];
  total_days_attended: number;
  attendance_rate: number;
  verification_hash: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface CertificateGenerateRequest {
  internship_id: string;
}

export interface CertificateVerifyRequest {
  certificate_number: string;
  verification_hash: string;
}
