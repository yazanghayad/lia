import { NextResponse } from 'next/server';
import { createClient } from '@/lib/appwrite/server';
import { auth } from '@clerk/nextjs/server';

// GET - List all schools or get school for current user
export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const city = searchParams.get('city');
    const verified = searchParams.get('verified');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const supabase = await createClient();
    let query = supabase.from('schools').select('*', { count: 'exact' });

    if (city) {
      query = query.ilike('city', `%${city}%`);
    }
    if (verified !== null) {
      query = query.eq('is_verified', verified === 'true');
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

// POST - Create a new school (for handläggare)
export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      org_number,
      city,
      address,
      contact_name,
      contact_email,
      contact_phone,
      plan_type = 'free',
      student_count = 0
    } = body;

    if (!name || !city || !contact_email) {
      return NextResponse.json(
        { error: 'Name, city and contact_email are required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('schools')
      .insert({
        user_id: userId,
        name,
        org_number,
        city,
        address,
        contact_name,
        contact_email,
        contact_phone,
        plan_type,
        student_count,
        is_verified: false
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
