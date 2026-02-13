// Database types for Supabase

export type UserRole = 'admin' | 'school' | 'company' | 'student';
export type PracticeType = 'prao' | 'apl' | 'lia' | 'praktik';
export type MatchStatus =
  | 'pending'
  | 'interested'
  | 'accepted'
  | 'rejected'
  | 'completed';
export type PlanType = 'free' | 'pro' | 'enterprise';

export interface Profile {
  id: string;
  role: UserRole;
  email: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface School {
  id: string;
  user_id: string | null;
  name: string;
  org_number: string | null;
  city: string;
  address: string | null;
  contact_name: string | null;
  contact_email: string;
  contact_phone: string | null;
  plan_type: PlanType;
  student_count: number;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface Company {
  id: string;
  user_id: string | null;
  name: string;
  org_number: string | null;
  city: string;
  industry: string | null;
  website: string | null;
  description: string | null;
  contact_name: string | null;
  contact_email: string;
  contact_phone: string | null;
  accepts_prao: boolean;
  accepts_apl: boolean;
  accepts_lia: boolean;
  accepts_praktik: boolean;
  available_spots: number;
  plan_type: PlanType;
  is_claimed: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface Student {
  id: string;
  user_id: string | null;
  school_id: string | null;
  email: string;
  full_name: string;
  phone: string | null;
  program: string;
  education_level: string | null;
  city: string;
  practice_type: PracticeType;
  preferred_industries: string[] | null;
  start_date: string | null;
  end_date: string | null;
  weeks_duration: number | null;
  status: string;
  imported_from_csv: boolean;
  gdpr_consent: boolean;
  gdpr_consent_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface Match {
  id: string;
  student_id: string;
  company_id: string;
  status: MatchStatus;
  match_score: number | null;
  matched_by: string | null;
  student_message: string | null;
  company_response: string | null;
  created_at: string;
  student_interested_at: string | null;
  company_responded_at: string | null;
  completed_at: string | null;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Profile, 'id'>>;
      };
      schools: {
        Row: School;
        Insert: Omit<School, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<School, 'id'>>;
      };
      companies: {
        Row: Company;
        Insert: Omit<Company, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Company, 'id'>>;
      };
      students: {
        Row: Student;
        Insert: Omit<Student, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Student, 'id'>>;
      };
      matches: {
        Row: Match;
        Insert: Omit<Match, 'id' | 'created_at'>;
        Update: Partial<Omit<Match, 'id'>>;
      };
    };
    Enums: {
      user_role: UserRole;
      practice_type: PracticeType;
      match_status: MatchStatus;
      plan_type: PlanType;
    };
  };
}
