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
  available_spots: number;
}

function calculateMatchScore(student: Student, company: Company): number {
  let score = 0;

  // City match (40 points)
  if (student.city.toLowerCase() === company.city.toLowerCase()) {
    score += 40;
  }

  // Practice type match (35 points)
  const practiceTypeAccepted =
    (student.practice_type === 'prao' && company.accepts_prao) ||
    (student.practice_type === 'apl' && company.accepts_apl) ||
    (student.practice_type === 'lia' && company.accepts_lia) ||
    (student.practice_type === 'praktik' && company.accepts_praktik);

  if (practiceTypeAccepted) {
    score += 35;
  }

  // Industry match (25 points)
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

// POST - Find matches for a student
export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { student_id, limit = 10, min_score = 50 } = body;

    if (!student_id) {
      return NextResponse.json(
        { error: 'student_id is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get student
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id, city, practice_type, preferred_industries')
      .eq('id', student_id)
      .single();

    if (studentError || !student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Get companies with available spots
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select(
        'id, name, city, industry, accepts_prao, accepts_apl, accepts_lia, accepts_praktik, available_spots'
      )
      .gt('available_spots', 0)
      .eq('is_verified', true);

    if (companiesError) {
      return NextResponse.json(
        { error: companiesError.message },
        { status: 500 }
      );
    }

    // Get existing matches for this student
    const { data: existingMatches } = await supabase
      .from('matches')
      .select('company_id')
      .eq('student_id', student_id);

    const matchedCompanyIds = new Set(
      existingMatches?.map((m) => m.company_id) || []
    );

    // Calculate scores and filter
    const matches = (companies || [])
      .filter((company) => !matchedCompanyIds.has(company.id))
      .map((company) => ({
        company_id: company.id,
        company_name: company.name,
        city: company.city,
        industry: company.industry,
        score: calculateMatchScore(student as Student, company as Company)
      }))
      .filter((match) => match.score >= min_score)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return NextResponse.json({
      student_id,
      matches,
      total_companies: companies?.length || 0,
      matching_companies: matches.length
    });
  } catch (error) {
    console.error('Match error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
