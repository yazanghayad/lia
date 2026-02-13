import { NextResponse } from 'next/server';
import { createClient } from '@/lib/appwrite/server';
import { auth } from '@clerk/nextjs/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

type EmailTemplate =
  | 'match-found'
  | 'company-interest'
  | 'welcome-student'
  | 'welcome-company'
  | 'beta-invite'
  | 'reminder'
  | 'custom';

interface SendEmailRequest {
  to: string;
  template: EmailTemplate;
  subject?: string;
  data?: Record<string, unknown>;
  html?: string; // For custom templates
  text?: string;
}

// POST - Send an email
export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin (only admins can send emails)
    const supabase = await createClient();
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const body: SendEmailRequest = await request.json();
    const { to, template, subject, data, html, text } = body;

    if (!to) {
      return NextResponse.json(
        { error: 'Recipient email (to) is required' },
        { status: 400 }
      );
    }

    if (!template) {
      return NextResponse.json(
        { error: 'Template is required' },
        { status: 400 }
      );
    }

    // Generate email content based on template
    const emailContent = generateEmailContent(
      template,
      data,
      subject,
      html,
      text
    );

    if (!emailContent) {
      return NextResponse.json(
        { error: 'Invalid template or missing content' },
        { status: 400 }
      );
    }

    // Send email via Resend
    const { data: emailData, error: emailError } = await resend.emails.send({
      from:
        process.env.RESEND_FROM_EMAIL ||
        'PraktikFinder <noreply@praktikfinder.se>',
      to,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text
    });

    if (emailError) {
      return NextResponse.json({ error: emailError.message }, { status: 500 });
    }

    // Log the email
    await supabase.from('email_logs').insert({
      recipient_email: to,
      recipient_type: determineRecipientType(template),
      template_id: template,
      subject: emailContent.subject,
      status: 'sent',
      metadata: { data, resend_id: emailData?.id }
    });

    return NextResponse.json({
      message: 'Email sent successfully',
      id: emailData?.id
    });
  } catch (error) {
    console.error('Email send error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function generateEmailContent(
  template: EmailTemplate,
  data?: Record<string, unknown>,
  customSubject?: string,
  customHtml?: string,
  customText?: string
): { subject: string; html: string; text: string } | null {
  switch (template) {
    case 'match-found':
      return {
        subject: customSubject || `Vi hittade praktikplatser för dig! 🎉`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #333;">Hej ${data?.studentName || 'där'}! 🎉</h1>
            <p style="color: #555; font-size: 16px;">
              Vi har hittat ${data?.matchCount || 'flera'} företag som matchar din profil.
            </p>
            <p style="color: #555; font-size: 16px;">
              Logga in på PraktikFinder för att se dina matchningar och visa intresse.
            </p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://praktikfinder.se'}/dashboard/matches" 
               style="display: inline-block; background: #0066ff; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin-top: 16px;">
              Se dina matchningar →
            </a>
            <p style="color: #888; font-size: 14px; margin-top: 32px;">
              Lycka till med praktikjakten!<br/>– PraktikFinder
            </p>
          </div>
        `,
        text: `Hej ${data?.studentName || 'där'}! Vi har hittat ${data?.matchCount || 'flera'} företag som matchar din profil. Logga in på PraktikFinder för att se dina matchningar.`
      };

    case 'company-interest':
      return {
        subject:
          customSubject || `En student är intresserad av praktik hos er!`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #333;">Nytt praktikintresse! 📬</h1>
            <p style="color: #555; font-size: 16px;">
              <strong>${data?.studentName || 'En student'}</strong> har visat intresse för praktik hos ${data?.companyName || 'ert företag'}.
            </p>
            <p style="color: #555; font-size: 16px;">
              <strong>Program:</strong> ${data?.program || 'Ej angivet'}<br/>
              <strong>Praktiktyp:</strong> ${data?.practiceType || 'Ej angivet'}<br/>
              <strong>Period:</strong> ${data?.period || 'Ej angivet'}
            </p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://praktikfinder.se'}/dashboard/matches" 
               style="display: inline-block; background: #0066ff; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin-top: 16px;">
              Svara på förfrågan →
            </a>
            <p style="color: #888; font-size: 14px; margin-top: 32px;">
              – PraktikFinder
            </p>
          </div>
        `,
        text: `${data?.studentName || 'En student'} har visat intresse för praktik hos ${data?.companyName || 'ert företag'}. Logga in för att svara.`
      };

    case 'welcome-student':
      return {
        subject: customSubject || `Välkommen till PraktikFinder! 🎓`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #333;">Välkommen, ${data?.name || 'student'}! 🎓</h1>
            <p style="color: #555; font-size: 16px;">
              Tack för att du registrerade dig på PraktikFinder. Vi hjälper dig hitta den perfekta praktikplatsen.
            </p>
            <p style="color: #555; font-size: 16px;">
              Nästa steg:
            </p>
            <ul style="color: #555; font-size: 16px;">
              <li>Fyll i din profil</li>
              <li>Ange dina preferenser</li>
              <li>Vänta på matchningar!</li>
            </ul>
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://praktikfinder.se'}/dashboard/profile" 
               style="display: inline-block; background: #0066ff; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin-top: 16px;">
              Fyll i din profil →
            </a>
          </div>
        `,
        text: `Välkommen till PraktikFinder, ${data?.name || 'student'}! Logga in för att fylla i din profil och börja få matchningar.`
      };

    case 'welcome-company':
      return {
        subject: customSubject || `Välkommen till PraktikFinder! 🏢`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #333;">Välkommen, ${data?.companyName || 'företag'}! 🏢</h1>
            <p style="color: #555; font-size: 16px;">
              Tack för att ni registrerat er på PraktikFinder. Snart kommer ni kunna ta emot praktikanter.
            </p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://praktikfinder.se'}/dashboard" 
               style="display: inline-block; background: #0066ff; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin-top: 16px;">
              Kom igång →
            </a>
          </div>
        `,
        text: `Välkommen till PraktikFinder, ${data?.companyName || 'företag'}! Logga in för att börja ta emot praktikanter.`
      };

    case 'beta-invite':
      return {
        subject: customSubject || `Du är inbjuden till PraktikFinder beta! 🚀`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #333;">Du är inbjuden! 🚀</h1>
            <p style="color: #555; font-size: 16px;">
              Grattis! Du har blivit utvald att delta i PraktikFinder beta.
            </p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://praktikfinder.se'}/auth/signup?invite=${data?.inviteCode || ''}" 
               style="display: inline-block; background: #0066ff; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin-top: 16px;">
              Skapa konto →
            </a>
          </div>
        `,
        text: `Du är inbjuden till PraktikFinder beta! Använd länken för att skapa ditt konto.`
      };

    case 'reminder':
      return {
        subject: customSubject || `Påminnelse från PraktikFinder`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #333;">Påminnelse 📝</h1>
            <p style="color: #555; font-size: 16px;">
              ${data?.message || 'Du har olästa notifikationer på PraktikFinder.'}
            </p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://praktikfinder.se'}/dashboard" 
               style="display: inline-block; background: #0066ff; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin-top: 16px;">
              Gå till dashboard →
            </a>
          </div>
        `,
        text:
          (data?.message as string) ||
          'Du har olästa notifikationer på PraktikFinder.'
      };

    case 'custom':
      if (!customHtml && !customText) {
        return null;
      }
      return {
        subject: customSubject || 'Meddelande från PraktikFinder',
        html: customHtml || `<p>${customText}</p>`,
        text: customText || ''
      };

    default:
      return null;
  }
}

function determineRecipientType(template: EmailTemplate): string {
  switch (template) {
    case 'match-found':
    case 'welcome-student':
      return 'student';
    case 'company-interest':
    case 'welcome-company':
      return 'company';
    case 'beta-invite':
      return 'waitlist';
    default:
      return 'other';
  }
}
