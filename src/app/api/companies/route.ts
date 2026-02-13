import { NextResponse } from 'next/server';
import { createClient } from '@/lib/appwrite/server';
import { auth } from '@clerk/nextjs/server';

// GET - List all companies with filters
export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const city = searchParams.get('city');
    const industry = searchParams.get('industry');
    const practiceType = searchParams.get('practice_type');
    const verified = searchParams.get('verified');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const supabase = await createClient();
    let query = supabase.from('companies').select('*', { count: 'exact' });

    if (city) {
      query = query.ilike('city', `%${city}%`);
    }
    if (industry) {
      query = query.ilike('industry', `%${industry}%`);
    }
    if (verified !== null) {
      query = query.eq('is_verified', verified === 'true');
    }

    // Filter by practice type
    if (practiceType) {
      switch (practiceType) {
        case 'prao':
          query = query.eq('accepts_prao', true);
          break;
        case 'apl':
          query = query.eq('accepts_apl', true);
          break;
        case 'lia':
          query = query.eq('accepts_lia', true);
          break;
        case 'praktik':
          query = query.eq('accepts_praktik', true);
          break;
      }
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

// POST - Create a new company
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
      industry,
      website,
      description,
      contact_name,
      contact_email,
      contact_phone,
      accepts_prao = false,
      accepts_apl = false,
      accepts_lia = false,
      accepts_praktik = false,
      available_spots = 0,
      plan_type = 'free'
    } = body;

    if (!name || !city || !contact_email) {
      return NextResponse.json(
        { error: 'Name, city and contact_email are required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('companies')
      .insert({
        user_id: userId,
        name,
        org_number,
        city,
        industry,
        website,
        description,
        contact_name,
        contact_email,
        contact_phone,
        accepts_prao,
        accepts_apl,
        accepts_lia,
        accepts_praktik,
        available_spots,
        plan_type,
        is_claimed: true,
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
