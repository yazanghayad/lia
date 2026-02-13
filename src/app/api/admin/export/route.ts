import { NextResponse } from 'next/server';
import { createClient } from '@/lib/appwrite/server';
import { auth } from '@clerk/nextjs/server';

type ExportType = 'students' | 'companies' | 'schools' | 'matches' | 'all';
type ExportFormat = 'json' | 'csv';

// GET - Export data (admin only)
export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();

    // Check if user is admin
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

    const { searchParams } = new URL(request.url);
    const type = (searchParams.get('type') || 'all') as ExportType;
    const format = (searchParams.get('format') || 'json') as ExportFormat;
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');
    const city = searchParams.get('city');
    const status = searchParams.get('status');

    const exportData: Record<string, unknown[]> = {};

    // Export students
    if (type === 'students' || type === 'all') {
      let query = supabase.from('students').select(`
        id, email, full_name, phone, program, education_level,
        city, practice_type, preferred_industries, start_date, end_date,
        weeks_duration, status, gdpr_consent, created_at,
        schools(name)
      `);
      if (dateFrom) query = query.gte('created_at', dateFrom);
      if (dateTo) query = query.lte('created_at', dateTo);
      if (city) query = query.ilike('city', `%${city}%`);
      if (status) query = query.eq('status', status);

      const { data, error } = await query;
      if (error) {
        return NextResponse.json(
          { error: `Failed to export students: ${error.message}` },
          { status: 500 }
        );
      }
      exportData.students = data || [];
    }

    // Export companies
    if (type === 'companies' || type === 'all') {
      let query = supabase.from('companies').select(`
        id, name, org_number, city, industry, website, description,
        contact_name, contact_email, contact_phone,
        accepts_prao, accepts_apl, accepts_lia, accepts_praktik,
        available_spots, plan_type, is_claimed, is_verified, created_at
      `);
      if (dateFrom) query = query.gte('created_at', dateFrom);
      if (dateTo) query = query.lte('created_at', dateTo);
      if (city) query = query.ilike('city', `%${city}%`);

      const { data, error } = await query;
      if (error) {
        return NextResponse.json(
          { error: `Failed to export companies: ${error.message}` },
          { status: 500 }
        );
      }
      exportData.companies = data || [];
    }

    // Export schools
    if (type === 'schools' || type === 'all') {
      let query = supabase.from('schools').select(`
        id, name, org_number, city, address,
        contact_name, contact_email, contact_phone,
        plan_type, student_count, is_verified, created_at
      `);
      if (dateFrom) query = query.gte('created_at', dateFrom);
      if (dateTo) query = query.lte('created_at', dateTo);
      if (city) query = query.ilike('city', `%${city}%`);

      const { data, error } = await query;
      if (error) {
        return NextResponse.json(
          { error: `Failed to export schools: ${error.message}` },
          { status: 500 }
        );
      }
      exportData.schools = data || [];
    }

    // Export matches
    if (type === 'matches' || type === 'all') {
      let query = supabase.from('matches').select(`
        id, status, match_score, matched_by, student_message, company_response,
        created_at, student_interested_at, company_responded_at, completed_at,
        students(full_name, email, city, practice_type, program),
        companies(name, city, industry, contact_email)
      `);
      if (dateFrom) query = query.gte('created_at', dateFrom);
      if (dateTo) query = query.lte('created_at', dateTo);
      if (status) query = query.eq('status', status);

      const { data, error } = await query;
      if (error) {
        return NextResponse.json(
          { error: `Failed to export matches: ${error.message}` },
          { status: 500 }
        );
      }
      exportData.matches = data || [];
    }

    // Return based on format
    if (format === 'csv') {
      const csvContent = convertToCSV(exportData, type);

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="praktikfinder-export-${type}-${new Date().toISOString().split('T')[0]}.csv"`
        }
      });
    }

    // Default: JSON
    return NextResponse.json({
      exported_at: new Date().toISOString(),
      type,
      filters: { dateFrom, dateTo, city, status },
      data: exportData,
      counts: Object.fromEntries(
        Object.entries(exportData).map(([key, value]) => [key, value.length])
      )
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function convertToCSV(
  data: Record<string, unknown[]>,
  type: ExportType
): string {
  const lines: string[] = [];

  for (const [tableName, rows] of Object.entries(data)) {
    if (type !== 'all') {
      // Single type export - no table headers
      if (rows.length === 0) {
        return '';
      }

      // Get headers from first row, flatten nested objects
      const flattenedRows = rows.map((row) =>
        flattenObject(row as Record<string, unknown>)
      );
      const headers = Object.keys(flattenedRows[0] || {});

      lines.push(headers.map(escapeCSV).join(','));

      for (const row of flattenedRows) {
        const values = headers.map((header) =>
          escapeCSV(String(row[header] ?? ''))
        );
        lines.push(values.join(','));
      }
    } else {
      // Multiple tables - add table headers
      lines.push(`\n# ${tableName.toUpperCase()}`);

      if (rows.length === 0) {
        lines.push('No data');
        continue;
      }

      const flattenedRows = rows.map((row) =>
        flattenObject(row as Record<string, unknown>)
      );
      const headers = Object.keys(flattenedRows[0] || {});

      lines.push(headers.map(escapeCSV).join(','));

      for (const row of flattenedRows) {
        const values = headers.map((header) =>
          escapeCSV(String(row[header] ?? ''))
        );
        lines.push(values.join(','));
      }
    }
  }

  return lines.join('\n');
}

function flattenObject(
  obj: Record<string, unknown>,
  prefix = ''
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    const newKey = prefix ? `${prefix}_${key}` : key;

    if (value && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(
        result,
        flattenObject(value as Record<string, unknown>, newKey)
      );
    } else if (Array.isArray(value)) {
      result[newKey] = value.join('; ');
    } else {
      result[newKey] = value;
    }
  }

  return result;
}

function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
