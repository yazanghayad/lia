import { NextResponse } from 'next/server';
import { createClient } from '@/lib/appwrite/server';
import { headers } from 'next/headers';
import crypto from 'crypto';

// Resend webhook event types
type ResendWebhookEvent =
  | 'email.sent'
  | 'email.delivered'
  | 'email.delivery_delayed'
  | 'email.complained'
  | 'email.bounced'
  | 'email.opened'
  | 'email.clicked';

interface ResendWebhookPayload {
  type: ResendWebhookEvent;
  created_at: string;
  data: {
    email_id: string;
    from: string;
    to: string[];
    subject: string;
    click?: {
      link: string;
    };
  };
}

// POST - Handle Resend webhooks
export async function POST(request: Request) {
  try {
    const body = await request.text();
    const headersList = await headers();

    // Verify webhook signature (Resend uses svix for webhooks)
    const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;

    if (webhookSecret) {
      const svixId = headersList.get('svix-id');
      const svixTimestamp = headersList.get('svix-timestamp');
      const svixSignature = headersList.get('svix-signature');

      if (!svixId || !svixTimestamp || !svixSignature) {
        return NextResponse.json(
          { error: 'Missing webhook signature headers' },
          { status: 401 }
        );
      }

      // Verify the signature
      const signedContent = `${svixId}.${svixTimestamp}.${body}`;
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(signedContent)
        .digest('base64');

      // Svix signature format: v1,signature
      const signatures = svixSignature
        .split(' ')
        .map((s) => s.replace('v1,', ''));
      const isValid = signatures.some((sig) => sig === expectedSignature);

      if (!isValid) {
        console.error('Invalid webhook signature');
        return NextResponse.json(
          { error: 'Invalid webhook signature' },
          { status: 401 }
        );
      }
    }

    const payload: ResendWebhookPayload = JSON.parse(body);
    const { type, data, created_at } = payload;

    const supabase = await createClient();

    // Find the email log entry by recipient email
    const recipientEmail = data.to[0];

    // Map webhook event type to our status
    const statusMap: Record<ResendWebhookEvent, string> = {
      'email.sent': 'sent',
      'email.delivered': 'delivered',
      'email.delivery_delayed': 'delayed',
      'email.complained': 'complained',
      'email.bounced': 'bounced',
      'email.opened': 'opened',
      'email.clicked': 'clicked'
    };

    const newStatus = statusMap[type] || 'unknown';

    // Update the email log - find the most recent matching entry
    const { data: existingLog, error: findError } = await supabase
      .from('email_logs')
      .select('id, metadata')
      .eq('recipient_email', recipientEmail)
      .order('sent_at', { ascending: false })
      .limit(1)
      .single();

    if (findError || !existingLog) {
      // Log the webhook event even if we can't match it
      console.warn('No matching email log found for:', recipientEmail);

      // Insert a new log entry for tracking
      await supabase.from('email_logs').insert({
        recipient_email: recipientEmail,
        recipient_type: 'unknown',
        template_id: 'webhook-tracking',
        subject: data.subject || 'Unknown',
        status: newStatus,
        metadata: {
          resend_id: data.email_id,
          webhook_type: type,
          click_link: data.click?.link
        },
        ...(type === 'email.opened' ? { opened_at: created_at } : {}),
        ...(type === 'email.clicked' ? { clicked_at: created_at } : {})
      });

      return NextResponse.json({ received: true, matched: false });
    }

    // Update the existing log entry
    const updateData: Record<string, unknown> = {
      status: newStatus,
      metadata: {
        ...((existingLog.metadata as Record<string, unknown>) || {}),
        resend_id: data.email_id,
        last_webhook: type,
        last_webhook_at: created_at,
        ...(data.click?.link ? { last_clicked_link: data.click.link } : {})
      }
    };

    if (type === 'email.opened') {
      updateData.opened_at = created_at;
    }
    if (type === 'email.clicked') {
      updateData.clicked_at = created_at;
    }

    const { error: updateError } = await supabase
      .from('email_logs')
      .update(updateData)
      .eq('id', existingLog.id);

    if (updateError) {
      console.error('Failed to update email log:', updateError);
      return NextResponse.json(
        { error: 'Failed to process webhook' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      received: true,
      matched: true,
      status: newStatus
    });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET - Health check for webhook endpoint
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    endpoint: 'email-webhooks',
    description: 'Resend webhook receiver for email tracking'
  });
}
