import { NextResponse } from 'next/server';
import { createClient } from '@/lib/appwrite/server';
import { auth } from '@clerk/nextjs/server';

// GET - List all students with filters
export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const city = searchParams.get('city');
    const schoolId = searchParams.get('school_id');
    const practiceType = searchParams.get('practice_type');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const supabase = await createClient();

    // Check user role for access control
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    let query = supabase
      .from('students')
      .select('*, schools(name)', { count: 'exact' });

    // School users can only see their own students
    if (profile?.role === 'school') {
      const { data: school } = await supabase
        .from('schools')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (school) {
        query = query.eq('school_id', school.id);
      }
    }

    if (city) {
      query = query.ilike('city', `%${city}%`);
    }
    if (schoolId) {
      query = query.eq('school_id', schoolId);
    }
    if (practiceType) {
      query = query.eq('practice_type', practiceType);
    }
    if (status) {
      query = query.eq('status', status);
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

// POST - Create a new student (by school)
export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      email,
      full_name,
      phone,
      program,
      education_level,
      city,
      practice_type,
      preferred_industries,
      start_date,
      end_date,
      weeks_duration,
      gdpr_consent = false
    } = body;

    if (!email || !full_name || !city || !practice_type || !program) {
      return NextResponse.json(
        {
          error:
            'Email, full_name, city, program and practice_type are required'
        },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get school_id from user if they are a school
    const { data: school } = await supabase
      .from('schools')
      .select('id')
      .eq('user_id', userId)
      .single();

    const { data, error } = await supabase
      .from('students')
      .insert({
        user_id: null, // Student doesn't have own account yet
        school_id: school?.id || null,
        email,
        full_name,
        phone,
        program,
        education_level,
        city,
        practice_type,
        preferred_industries,
        start_date,
        end_date,
        weeks_duration,
        status: 'searching',
        imported_from_csv: false,
        gdpr_consent,
        gdpr_consent_date: gdpr_consent ? new Date().toISOString() : null
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
