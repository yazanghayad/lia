import { NextResponse } from 'next/server';
import { createClient } from '@/lib/appwrite/server';
import { auth } from '@clerk/nextjs/server';

// POST - Claim a company profile (for pre-filled companies)
export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { company_id, verification_code, contact_email } = body;

    if (!company_id) {
      return NextResponse.json(
        { error: 'company_id is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get the company to claim
    const { data: company, error: fetchError } = await supabase
      .from('companies')
      .select('*')
      .eq('id', company_id)
      .single();

    if (fetchError || !company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    // Check if company is already claimed
    if (company.is_claimed && company.user_id) {
      return NextResponse.json(
        { error: 'Company has already been claimed' },
        { status: 409 }
      );
    }

    // Verify the contact email matches (basic verification)
    if (contact_email && company.contact_email !== contact_email) {
      return NextResponse.json(
        { error: 'Contact email does not match company records' },
        { status: 403 }
      );
    }

    // Optional: verify with a code sent via email
    // This would require a separate verification flow
    // For now, we trust the email verification from Clerk

    // Check if user already owns a company
    const { data: existingCompany } = await supabase
      .from('companies')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (existingCompany) {
      return NextResponse.json(
        { error: 'User already owns a company profile' },
        { status: 409 }
      );
    }

    // Claim the company
    const { data, error } = await supabase
      .from('companies')
      .update({
        user_id: userId,
        is_claimed: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', company_id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Company claimed successfully',
      data
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET - Get claim status for a company
export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('company_id');

    if (!companyId) {
      return NextResponse.json(
        { error: 'company_id is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data: company, error } = await supabase
      .from('companies')
      .select('id, name, is_claimed, user_id')
      .eq('id', companyId)
      .single();

    if (error || !company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    return NextResponse.json({
      company_id: company.id,
      name: company.name,
      is_claimed: company.is_claimed,
      is_owner: company.user_id === userId
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
