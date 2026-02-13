import { NextResponse } from 'next/server';
import { createClient } from '@/lib/appwrite/server';
import { auth } from '@clerk/nextjs/server';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();

    // Get counts in parallel
    const [
      studentsResult,
      companiesResult,
      schoolsResult,
      matchesResult,
      pendingMatchesResult,
      acceptedMatchesResult,
      waitlistResult
    ] = await Promise.all([
      supabase.from('students').select('*', { count: 'exact', head: true }),
      supabase.from('companies').select('*', { count: 'exact', head: true }),
      supabase.from('schools').select('*', { count: 'exact', head: true }),
      supabase.from('matches').select('*', { count: 'exact', head: true }),
      supabase
        .from('matches')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending'),
      supabase
        .from('matches')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'accepted'),
      supabase.from('waitlist').select('*', { count: 'exact', head: true })
    ]);

    // Get recent activity
    const [recentStudents, recentMatches, recentCompanies] = await Promise.all([
      supabase
        .from('students')
        .select('id, full_name, city, practice_type, created_at')
        .order('created_at', { ascending: false })
        .limit(5),
      supabase
        .from('matches')
        .select(
          `
          id, status, created_at,
          students(full_name),
          companies(name)
        `
        )
        .order('created_at', { ascending: false })
        .limit(5),
      supabase
        .from('companies')
        .select('id, name, city, industry, created_at')
        .order('created_at', { ascending: false })
        .limit(5)
    ]);

    // Get practice type distribution
    const practiceTypes = await supabase
      .from('students')
      .select('practice_type');

    const practiceTypeCount = {
      prao: 0,
      apl: 0,
      lia: 0,
      praktik: 0
    };

    practiceTypes.data?.forEach((s: { practice_type: string }) => {
      if (s.practice_type in practiceTypeCount) {
        practiceTypeCount[s.practice_type as keyof typeof practiceTypeCount]++;
      }
    });

    // Get city distribution
    const cities = await supabase.from('students').select('city');

    const cityCount: Record<string, number> = {};
    cities.data?.forEach((s: { city: string }) => {
      cityCount[s.city] = (cityCount[s.city] || 0) + 1;
    });

    // Get top 5 cities
    const topCities = Object.entries(cityCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([city, count]) => ({ city, count }));

    // Match rate calculation
    const totalStudents = studentsResult.count || 0;
    const acceptedMatches = acceptedMatchesResult.count || 0;
    const matchRate =
      totalStudents > 0
        ? Math.round((acceptedMatches / totalStudents) * 100)
        : 0;

    return NextResponse.json({
      totals: {
        students: studentsResult.count || 0,
        companies: companiesResult.count || 0,
        schools: schoolsResult.count || 0,
        matches: matchesResult.count || 0,
        waitlist: waitlistResult.count || 0
      },
      matchStatus: {
        pending: pendingMatchesResult.count || 0,
        accepted: acceptedMatchesResult.count || 0,
        rate: matchRate
      },
      practiceTypes: practiceTypeCount,
      topCities,
      recent: {
        students: recentStudents.data || [],
        matches: recentMatches.data || [],
        companies: recentCompanies.data || []
      }
    });
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
