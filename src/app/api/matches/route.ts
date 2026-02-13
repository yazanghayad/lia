import { NextResponse } from 'next/server';
import { createClient } from '@/lib/appwrite/server';
import { auth } from '@clerk/nextjs/server';

// GET - List all matches with filters
export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const studentId = searchParams.get('student_id');
    const companyId = searchParams.get('company_id');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const supabase = await createClient();

    let query = supabase.from('matches').select(
      `
      *,
      students(id, full_name, email, city, practice_type, program),
      companies(id, name, city, industry)
    `,
      { count: 'exact' }
    );

    if (status) {
      query = query.eq('status', status);
    }
    if (studentId) {
      query = query.eq('student_id', studentId);
    }
    if (companyId) {
      query = query.eq('company_id', companyId);
    }

    query = query
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    const { data, count, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data, count, limit, offset });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create a new match
export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { student_id, company_id, match_score, student_message } = body;

    if (!student_id || !company_id) {
      return NextResponse.json(
        { error: 'student_id and company_id are required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Check if match already exists
    const { data: existingMatch } = await supabase
      .from('matches')
      .select('id')
      .eq('student_id', student_id)
      .eq('company_id', company_id)
      .single();

    if (existingMatch) {
      return NextResponse.json(
        { error: 'Match already exists' },
        { status: 409 }
      );
    }

    const { data, error } = await supabase
      .from('matches')
      .insert({
        student_id,
        company_id,
        status: 'pending',
        match_score,
        matched_by: userId,
        student_message
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
