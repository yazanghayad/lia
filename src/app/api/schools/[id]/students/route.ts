import { NextResponse } from 'next/server';
import { createClient } from '@/lib/appwrite/server';
import { auth } from '@clerk/nextjs/server';

// GET - Get all students for a specific school
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);

    // Query parameters for filtering
    const status = searchParams.get('status');
    const practiceType = searchParams.get('practice_type');
    const city = searchParams.get('city');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const supabase = await createClient();

    // First, verify the school exists and check permissions
    const { data: school, error: schoolError } = await supabase
      .from('schools')
      .select('id, user_id, name')
      .eq('id', id)
      .single();

    if (schoolError || !school) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 });
    }

    // Check if user owns this school or is admin
    if (school.user_id !== userId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      if (!profile || profile.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    // Build query for students
    let query = supabase
      .from('students')
      .select('*', { count: 'exact' })
      .eq('school_id', id);

    if (status) {
      query = query.eq('status', status);
    }
    if (practiceType) {
      query = query.eq('practice_type', practiceType);
    }
    if (city) {
      query = query.ilike('city', `%${city}%`);
    }

    query = query
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    const { data, count, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      school: {
        id: school.id,
        name: school.name
      },
      students: data,
      count,
      limit,
      offset
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Add a student to a school (bulk import or single add)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const supabase = await createClient();

    // Verify school ownership/admin
    const { data: school, error: schoolError } = await supabase
      .from('schools')
      .select('id, user_id')
      .eq('id', id)
      .single();

    if (schoolError || !school) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 });
    }

    if (school.user_id !== userId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      if (!profile || profile.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    // Handle single student or array of students
    const students = Array.isArray(body.students) ? body.students : [body];

    // Validate required fields for each student
    const validStudents = students.filter(
      (student: Record<string, unknown>) =>
        student.email && student.full_name && student.program && student.city
    );

    if (validStudents.length === 0) {
      return NextResponse.json(
        {
          error:
            'No valid students provided. Required fields: email, full_name, program, city'
        },
        { status: 400 }
      );
    }

    // Add school_id to each student
    const studentsWithSchool = validStudents.map(
      (student: Record<string, unknown>) => ({
        ...student,
        school_id: id,
        status: student.status || 'seeking',
        gdpr_consent: student.gdpr_consent || false
      })
    );

    const { data, error } = await supabase
      .from('students')
      .upsert(studentsWithSchool, {
        onConflict: 'email',
        ignoreDuplicates: false
      })
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Update student count on school
    const { count } = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true })
      .eq('school_id', id);

    await supabase
      .from('schools')
      .update({ student_count: count || 0 })
      .eq('id', id);

    return NextResponse.json(
      {
        message: `Successfully added ${data?.length || 0} students`,
        added: data?.length || 0,
        skipped: students.length - validStudents.length,
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
