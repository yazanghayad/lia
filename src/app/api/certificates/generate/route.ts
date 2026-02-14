import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  generateCertificateNumber,
  generateVerificationHash,
} from "@/lib/certificates";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { internship_id } = await req.json();
    if (!internship_id) {
      return NextResponse.json({ error: "internship_id required" }, { status: 400 });
    }

    // Fetch internship with related data
    const { data: internship, error: intError } = await supabaseAdmin
      .from("internships")
      .select("*")
      .eq("id", internship_id)
      .single();
    if (intError || !internship) {
      return NextResponse.json({ error: "Internship not found" }, { status: 404 });
    }
    if (internship.status !== "completed") {
      return NextResponse.json(
        { error: "Internship must be completed to generate certificate" },
        { status: 400 }
      );
    }

    // Check if certificate already exists
    const { data: existing } = await supabaseAdmin
      .from("certificates")
      .select("id")
      .eq("internship_id", internship_id)
      .maybeSingle();
    if (existing) {
      return NextResponse.json(
        { error: "Certificate already generated", certificate_id: existing.id },
        { status: 409 }
      );
    }

    // Fetch student profile
    const { data: student } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", internship.student_id)
      .single();

    // Fetch company
    const { data: company } = await supabaseAdmin
      .from("companies")
      .select("*")
      .eq("id", internship.company_id)
      .single();

    // Fetch school (optional)
    let schoolName: string | null = null;
    if (student?.school_id) {
      const { data: school } = await supabaseAdmin
        .from("schools")
        .select("name")
        .eq("id", student.school_id)
        .single();
      schoolName = school?.name ?? null;
    }

    // Fetch achieved goals
    const { data: goals } = await supabaseAdmin
      .from("internship_goals")
      .select("title")
      .eq("internship_id", internship_id);
    const goalsAchieved = (goals ?? []).map((g: any) => g.title);

    // Fetch attendance stats
    const { data: attendance } = await supabaseAdmin
      .from("attendance_records")
      .select("status, approved")
      .eq("internship_id", internship_id);
    const totalDays = attendance?.length ?? 0;
    const presentDays = attendance?.filter(
      (a: any) => a.status === "present" || a.status === "remote"
    ).length ?? 0;
    const attendanceRate = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

    const certNumber = generateCertificateNumber();
    const hashInput = `${certNumber}:${internship_id}:${internship.student_id}:${new Date().toISOString()}`;
    const verificationHash = await generateVerificationHash(hashInput);

    const studentName =
      student?.full_name ??
      `${student?.first_name ?? ""} ${student?.last_name ?? ""}`.trim() ??
      "Student";

    const { data: certificate, error: certError } = await supabaseAdmin
      .from("certificates")
      .insert({
        internship_id,
        student_id: internship.student_id,
        company_id: internship.company_id,
        certificate_number: certNumber,
        student_name: studentName,
        company_name: company?.name ?? "Company",
        school_name: schoolName,
        internship_title: internship.title ?? internship.position ?? "Internship",
        start_date: internship.start_date,
        end_date: internship.end_date,
        goals_achieved: goalsAchieved,
        total_days_attended: presentDays,
        attendance_rate: attendanceRate,
        verification_hash: verificationHash,
        metadata: {
          total_attendance_records: totalDays,
          goals_count: goalsAchieved.length,
        },
      })
      .select()
      .single();

    if (certError) throw certError;

    return NextResponse.json({ certificate }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}
