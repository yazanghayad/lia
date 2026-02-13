import { NextResponse } from 'next/server';
import { createClient } from '@/lib/appwrite/server';
import { auth } from '@clerk/nextjs/server';

// Helper function to check if user is admin
async function isAdmin(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<boolean> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();

  return profile?.role === 'admin';
}

// GET - Get all matches with admin filters
export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();

    if (!(await isAdmin(supabase, userId))) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const city = searchParams.get('city');
    const practiceType = searchParams.get('practice_type');
    const schoolId = searchParams.get('school_id');
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase.from('matches').select(
      `
      *,
      students!inner(
        id, full_name, email, city, practice_type, program, school_id,
        schools(id, name)
      ),
      companies(id, name, city, industry, contact_email)
    `,
      { count: 'exact' }
    );

    if (status) {
      query = query.eq('status', status);
    }
    if (city) {
      query = query.ilike('students.city', `%${city}%`);
    }
    if (practiceType) {
      query = query.eq('students.practice_type', practiceType);
    }
    if (schoolId) {
      query = query.eq('students.school_id', schoolId);
    }
    if (dateFrom) {
      query = query.gte('created_at', dateFrom);
    }
    if (dateTo) {
      query = query.lte('created_at', dateTo);
    }

    query = query
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    const { data, count, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Calculate stats
    const statsQuery = await supabase.from('matches').select('status');
    const statusCounts =
      statsQuery.data?.reduce(
        (acc: Record<string, number>, match: { status: string }) => {
          acc[match.status] = (acc[match.status] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      ) || {};

    return NextResponse.json({
      data,
      count,
      limit,
      offset,
      stats: {
        total: statsQuery.data?.length || 0,
        byStatus: statusCounts
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create manual match (admin only)
export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();

    if (!(await isAdmin(supabase, userId))) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      student_id,
      company_id,
      status = 'pending',
      match_score,
      notes
    } = body;

    if (!student_id || !company_id) {
      return NextResponse.json(
        { error: 'student_id and company_id are required' },
        { status: 400 }
      );
    }

    // Verify student and company exist
    const [studentResult, companyResult] = await Promise.all([
      supabase
        .from('students')
        .select('id, full_name, city')
        .eq('id', student_id)
        .single(),
      supabase
        .from('companies')
        .select('id, name, city')
        .eq('id', company_id)
        .single()
    ]);

    if (!studentResult.data) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }
    if (!companyResult.data) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    // Check if match already exists
    const { data: existingMatch } = await supabase
      .from('matches')
      .select('id')
      .eq('student_id', student_id)
      .eq('company_id', company_id)
      .single();

    if (existingMatch) {
      return NextResponse.json(
        { error: 'Match already exists', match_id: existingMatch.id },
        { status: 409 }
      );
    }

    // Calculate match score if not provided
    const calculatedScore =
      match_score ??
      calculateMatchScore(studentResult.data, companyResult.data);

    const { data, error } = await supabase
      .from('matches')
      .insert({
        student_id,
        company_id,
        status,
        match_score: calculatedScore,
        matched_by: 'admin',
        student_message: notes
      })
      .select(
        `
        *,
        students(id, full_name, email, city),
        companies(id, name, city)
      `
      )
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      {
        message: 'Match created successfully',
        data
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH - Bulk update match statuses
export async function PATCH(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();

    if (!(await isAdmin(supabase, userId))) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { match_ids, status, notes } = body;

    if (!Array.isArray(match_ids) || match_ids.length === 0) {
      return NextResponse.json(
        { error: 'match_ids array is required' },
        { status: 400 }
      );
    }

    if (!status) {
      return NextResponse.json(
        { error: 'status is required' },
        { status: 400 }
      );
    }

    const validStatuses = [
      'pending',
      'interested',
      'accepted',
      'rejected',
      'completed'
    ];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        {
          error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
        },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString()
    };

    // Add timestamps based on status
    if (status === 'interested') {
      updateData.student_interested_at = new Date().toISOString();
    }
    if (status === 'accepted' || status === 'rejected') {
      updateData.company_responded_at = new Date().toISOString();
    }
    if (status === 'completed') {
      updateData.completed_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('matches')
      .update(updateData)
      .in('id', match_ids)
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      message: `${data?.length || 0} matches updated`,
      updated: data?.length || 0,
      data
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Simple match score calculation
function calculateMatchScore(
  student: { city: string },
  company: { city: string }
): number {
  let score = 0;

  // Same city = 40 points
  if (student.city?.toLowerCase() === company.city?.toLowerCase()) {
    score += 40;
  }

  // Base score for being matched manually by admin
  score += 30;

  return Math.min(score, 100);
}
