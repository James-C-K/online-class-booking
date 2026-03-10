import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import TeacherDashboardClient from './TeacherDashboardClient';

export default async function TeacherDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profile?.role === 'student') redirect('/dashboard/student');
  if (profile?.role === 'org_admin' || profile?.role === 'platform_admin') redirect('/dashboard/admin');

  // Upcoming sessions today
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const { data: todaySessions } = await supabase
    .from('sessions')
    .select(`
      id, start_time, end_time, status, type,
      subject:subjects (name_en, name_zh)
    `)
    .eq('instructor_id', user.id)
    .gte('start_time', todayStart.toISOString())
    .lte('start_time', todayEnd.toISOString())
    .order('start_time');

  // Upcoming sessions (next 7 days)
  const { data: upcomingSessions } = await supabase
    .from('sessions')
    .select(`
      id, start_time, end_time, status, type,
      subject:subjects (name_en, name_zh)
    `)
    .eq('instructor_id', user.id)
    .eq('status', 'confirmed')
    .gte('start_time', new Date().toISOString())
    .order('start_time')
    .limit(5);

  // Student count
  const { count: studentCount } = await supabase
    .from('student_instructor_assignments')
    .select('*', { count: 'exact', head: true })
    .eq('teacher_id', user.id);

  // Availability count
  const { count: availabilityCount } = await supabase
    .from('availability')
    .select('*', { count: 'exact', head: true })
    .eq('instructor_id', user.id)
    .eq('is_active', true);

  return (
    <TeacherDashboardClient
      profile={profile}
      todaySessions={todaySessions || []}
      upcomingSessions={upcomingSessions || []}
      studentCount={studentCount || 0}
      hasAvailability={availabilityCount > 0}
    />
  );
}
