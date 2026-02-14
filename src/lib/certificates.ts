import { supabase } from "@/lib/supabase";
import type { Certificate } from "@/types/certificate";

export async function getCertificateByInternship(
  internshipId: string
): Promise<Certificate | null> {
  const { data, error } = await supabase
    .from("certificates")
    .select("*")
    .eq("internship_id", internshipId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getCertificatesByStudent(
  studentId: string
): Promise<Certificate[]> {
  const { data, error } = await supabase
    .from("certificates")
    .select("*")
    .eq("student_id", studentId)
    .order("issued_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function verifyCertificate(
  certificateNumber: string,
  verificationHash: string
): Promise<Certificate | null> {
  const { data, error } = await supabase
    .from("certificates")
    .select("*")
    .eq("certificate_number", certificateNumber)
    .eq("verification_hash", verificationHash)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export function generateCertificateNumber(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `CERT-${y}${m}-${rand}`;
}

export async function generateVerificationHash(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const buf = await crypto.subtle.digest("SHA-256", encoder.encode(data));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
