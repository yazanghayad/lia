import { NextResponse } from 'next/server';
import { createClient } from '@/lib/appwrite/server';
import { auth } from '@clerk/nextjs/server';

interface CSVRow {
  'E-post'?: string;
  Email?: string;
  email?: string;
  Namn?: string;
  Name?: string;
  name?: string;
  Förnamn?: string;
  Efternamn?: string;
  Program?: string;
  Utbildning?: string;
  Stad?: string;
  City?: string;
  Praktiktyp?: string;
  Type?: string;
  Telefon?: string;
  Phone?: string;
  Startdatum?: string;
  Slutdatum?: string;
}

function mapPracticeType(
  type: string | undefined
): 'prao' | 'apl' | 'lia' | 'praktik' {
  if (!type) return 'praktik';
  const normalized = type.toLowerCase().trim();
  if (normalized.includes('prao')) return 'prao';
  if (normalized.includes('apl')) return 'apl';
  if (normalized.includes('lia')) return 'lia';
  return 'praktik';
}

function parseCSV(text: string): CSVRow[] {
  const lines = text.split('\n').filter((line) => line.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].split(';').map((h) => h.trim().replace(/"/g, ''));
  const rows: CSVRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(';').map((v) => v.trim().replace(/"/g, ''));
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    rows.push(row as CSVRow);
  }

  return rows;
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();

    // Get user's school
    const { data: school } = await supabase
      .from('schools')
      .select('id')
      .eq('user_id', userId)
      .single();

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const text = await file.text();
    const rows = parseCSV(text);

    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'No valid rows in CSV' },
        { status: 400 }
      );
    }

    const students = rows
      .map((row) => {
        const email = row['E-post'] || row['Email'] || row['email'] || '';
        const fullName =
          row['Namn'] ||
          row['Name'] ||
          row['name'] ||
          (row['Förnamn'] && row['Efternamn']
            ? `${row['Förnamn']} ${row['Efternamn']}`
            : '');

        return {
          email,
          full_name: fullName,
          program: row['Program'] || row['Utbildning'] || 'Okänt program',
          city: row['Stad'] || row['City'] || 'Stockholm',
          practice_type: mapPracticeType(row['Praktiktyp'] || row['Type']),
          phone: row['Telefon'] || row['Phone'] || null,
          start_date: row['Startdatum'] || null,
          end_date: row['Slutdatum'] || null,
          school_id: school?.id || null,
          imported_from_csv: true,
          gdpr_consent: false,
          status: 'searching'
        };
      })
      .filter((s) => s.email && s.full_name);

    if (students.length === 0) {
      return NextResponse.json(
        {
          error:
            'No valid students found. Ensure CSV has email and name columns.'
        },
        { status: 400 }
      );
    }

    // Insert students, skip duplicates by email
    const { data, error } = await supabase
      .from('students')
      .upsert(students, {
        onConflict: 'email',
        ignoreDuplicates: true
      })
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      {
        success: true,
        imported: data?.length || 0,
        total: students.length,
        message: `Importerade ${data?.length || 0} av ${students.length} studenter`
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
