import { NextResponse } from 'next/server';
import { createClient } from '@/lib/appwrite/server';

// GET - List waitlist entries (admin only)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const invited = searchParams.get('invited');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const supabase = await createClient();
    let query = supabase.from('waitlist').select('*', { count: 'exact' });

    if (role) {
      query = query.eq('role', role);
    }
    if (invited !== null) {
      query = query.eq('invited', invited === 'true');
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

// POST - Add to waitlist (public)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, role, company_name, school_name, city } = body;

    if (!email || !role) {
      return NextResponse.json(
        { error: 'Email and role are required' },
        { status: 400 }
      );
    }

    if (!['school', 'company'].includes(role)) {
      return NextResponse.json(
        { error: 'Role must be "school" or "company"' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Check if already on waitlist
    const { data: existing } = await supabase
      .from('waitlist')
      .select('id')
      .eq('email', email)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'Email already on waitlist', alreadyRegistered: true },
        { status: 409 }
      );
    }

    const { data, error } = await supabase
      .from('waitlist')
      .insert({
        email,
        role,
        company_name: role === 'company' ? company_name : null,
        school_name: role === 'school' ? school_name : null,
        city,
        invited: false,
        converted: false
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
