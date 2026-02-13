import { NextResponse } from 'next/server';
import { createClient } from '@/lib/appwrite/server';
import { auth } from '@clerk/nextjs/server';

interface Student {
  id: string;
  city: string;
  practice_type: string;
  preferred_industries: string[] | null;
}

interface Company {
  id: string;
  city: string;
  industry: string | null;
  accepts_prao: boolean;
  accepts_apl: boolean;
  accepts_lia: boolean;
  accepts_praktik: boolean;
}

function calculateMatchScore(student: Student, company: Company): number {
  let score = 0;

  if (student.city.toLowerCase() === company.city.toLowerCase()) {
    score += 40;
  }

  const practiceTypeAccepted =
    (student.practice_type === 'prao' && company.accepts_prao) ||
    (student.practice_type === 'apl' && company.accepts_apl) ||
    (student.practice_type === 'lia' && company.accepts_lia) ||
    (student.practice_type === 'praktik' && company.accepts_praktik);

  if (practiceTypeAccepted) {
    score += 35;
  }

  if (student.preferred_industries && company.industry) {
    const matchingIndustry = student.preferred_industries.some((ind) =>
      company.industry?.toLowerCase().includes(ind.toLowerCase())
    );
    if (matchingIndustry) {
      score += 25;
    }
  }

  return score;
}

// POST - Create matches in bulk for multiple students
export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();

    // Verify admin or school role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    if (!profile || !['admin', 'school'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { student_ids, min_score = 50, max_matches_per_student = 3 } = body;

    if (
      !student_ids ||
      !Array.isArray(student_ids) ||
      student_ids.length === 0
    ) {
      return NextResponse.json(
        { error: 'student_ids array is required' },
        { status: 400 }
      );
    }

    // Get students
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('id, city, practice_type, preferred_industries')
      .in('id', student_ids);

    if (studentsError) {
      return NextResponse.json(
        { error: studentsError.message },
        { status: 500 }
      );
    }

    // Get companies with available spots
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select(
        'id, city, industry, accepts_prao, accepts_apl, accepts_lia, accepts_praktik, available_spots'
      )
      .gt('available_spots', 0)
      .eq('is_verified', true);

    if (companiesError) {
      return NextResponse.json(
        { error: companiesError.message },
        { status: 500 }
      );
    }

    // Get existing matches
    const { data: existingMatches } = await supabase
      .from('matches')
      .select('student_id, company_id')
      .in('student_id', student_ids);

    const existingPairs = new Set(
      existingMatches?.map((m) => `${m.student_id}:${m.company_id}`) || []
    );

    // Generate matches
    const newMatches: Array<{
      student_id: string;
      company_id: string;
      match_score: number;
      matched_by: string;
      status: string;
    }> = [];

    for (const student of students || []) {
      let matchCount = 0;

      for (const company of companies || []) {
        if (matchCount >= max_matches_per_student) break;

        const pairKey = `${student.id}:${company.id}`;
        if (existingPairs.has(pairKey)) continue;

        const score = calculateMatchScore(
          student as Student,
          company as Company
        );
        if (score >= min_score) {
          newMatches.push({
            student_id: student.id,
            company_id: company.id,
            match_score: score,
            matched_by: 'auto',
            status: 'pending'
          });
          existingPairs.add(pairKey);
          matchCount++;
        }
      }
    }

    if (newMatches.length === 0) {
      return NextResponse.json({
        success: true,
        created: 0,
        message: 'No new matches found above minimum score'
      });
    }

    // Insert matches
    const { data: createdMatches, error: insertError } = await supabase
      .from('matches')
      .insert(newMatches)
      .select();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json(
      {
        success: true,
        created: createdMatches?.length || 0,
        students_processed: students?.length || 0,
        message: `Created ${createdMatches?.length || 0} new matches`
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Bulk match error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
