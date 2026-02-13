import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { Webhook } from 'svix';
import { createAdminClient } from '@/lib/appwrite/server';

// Use API key for webhook (admin-level access)
const supabase = createAdminClient();

interface ClerkUserData {
  id: string;
  email_addresses: Array<{ email_address: string; id: string }>;
  first_name: string | null;
  last_name: string | null;
  image_url: string | null;
  public_metadata?: {
    role?: string;
  };
}

export async function POST(request: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    console.error('Missing CLERK_WEBHOOK_SECRET');
    return NextResponse.json(
      { error: 'Server configuration error' },
      { status: 500 }
    );
  }

  // Get headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return NextResponse.json(
      { error: 'Missing svix headers' },
      { status: 400 }
    );
  }

  // Get body
  const payload = await request.json();
  const body = JSON.stringify(payload);

  // Verify webhook
  const wh = new Webhook(WEBHOOK_SECRET);
  let evt: { type: string; data: ClerkUserData };

  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature
    }) as { type: string; data: ClerkUserData };
  } catch (err) {
    console.error('Webhook verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const { type, data } = evt;

  switch (type) {
    case 'user.created': {
      const primaryEmail = data.email_addresses.find(
        (e) => e.email_address
      )?.email_address;

      if (!primaryEmail) {
        return NextResponse.json({ error: 'No email found' }, { status: 400 });
      }

      const fullName =
        [data.first_name, data.last_name].filter(Boolean).join(' ') || null;
      const role = data.public_metadata?.role || 'student';

      const { error } = await supabase.from('profiles').insert({
        id: data.id,
        email: primaryEmail,
        full_name: fullName,
        avatar_url: data.image_url,
        role: role
      });

      if (error) {
        console.error('Failed to create profile:', error);
        return NextResponse.json(
          { error: 'Failed to create profile' },
          { status: 500 }
        );
      }

      console.log(`Created profile for user ${data.id}`);
      break;
    }

    case 'user.updated': {
      const primaryEmail = data.email_addresses.find(
        (e) => e.email_address
      )?.email_address;
      const fullName =
        [data.first_name, data.last_name].filter(Boolean).join(' ') || null;

      const { error } = await supabase
        .from('profiles')
        .update({
          email: primaryEmail,
          full_name: fullName,
          avatar_url: data.image_url,
          updated_at: new Date().toISOString()
        })
        .eq('id', data.id);

      if (error) {
        console.error('Failed to update profile:', error);
        return NextResponse.json(
          { error: 'Failed to update profile' },
          { status: 500 }
        );
      }

      console.log(`Updated profile for user ${data.id}`);
      break;
    }

    case 'user.deleted': {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', data.id);

      if (error) {
        console.error('Failed to delete profile:', error);
        return NextResponse.json(
          { error: 'Failed to delete profile' },
          { status: 500 }
        );
      }

      console.log(`Deleted profile for user ${data.id}`);
      break;
    }
  }

  return NextResponse.json({ success: true });
}
