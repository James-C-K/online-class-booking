import { createClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import AnalyticsClient from './AnalyticsClient';

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!['org_admin', 'platform_admin'].includes(profile?.role)) redirect('/dashboard');

  const [
    { count: totalUsers },
    { count: totalTeachers },
    { count: totalStudents },
    { count: totalSessions },
    { count: completedSessions },
    { count: cancelledSessions },
    { data: allSessions },
    { data: subjectStats },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'teacher'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
    supabase.from('sessions').select('*', { count: 'exact', head: true }),
    supabase.from('sessions').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
    supabase.from('sessions').select('*', { count: 'exact', head: true }).eq('status', 'cancelled'),
    supabase.from('sessions').select('id, start_time, status').order('start_time', { ascending: false }).limit(90),
    supabase.from('sessions').select('subject:subjects(name_en, name_zh), status').not('subject_id', 'is', null),
  ]);

  // Sessions per day (last 14 days)
  const sessionsPerDay = {};
  const today = new Date();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    sessionsPerDay[d.toISOString().split('T')[0]] = 0;
  }
  (allSessions || []).forEach(s => {
    const day = s.start_time?.split('T')[0];
    if (day && sessionsPerDay[day] !== undefined) sessionsPerDay[day]++;
  });

  // Top subjects
  const subjectCounts = {};
  (subjectStats || []).forEach(s => {
    const name = s.subject?.name_en;
    if (name) subjectCounts[name] = (subjectCounts[name] || 0) + 1;
  });
  const topSubjects = Object.entries(subjectCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6)
    .map(([name, count]) => ({ name, count }));

  return (
    <AnalyticsClient
      stats={{ totalUsers, totalTeachers, totalStudents, totalSessions, completedSessions, cancelledSessions }}
      sessionsPerDay={sessionsPerDay}
      topSubjects={topSubjects}
    />
  );
}
