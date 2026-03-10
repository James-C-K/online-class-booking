import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import StudentDashboardClient from './StudentDashboardClient';

export default async function StudentDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profile?.role === 'teacher') redirect('/dashboard/teacher');
  if (profile?.role === 'org_admin' || profile?.role === 'platform_admin') redirect('/dashboard/admin');

  // Fetch upcoming sessions
  const { data: sessions } = await supabase
    .from('session_participants')
    .select(`
      session:sessions (
        id, start_time, end_time, status, type,
        instructor:profiles!sessions_instructor_id_fkey (full_name),
        subject:subjects (name_en, name_zh)
      )
    `)
    .eq('user_id', user.id)
    .eq('role', 'student')
    .order('created_at', { ascending: false })
    .limit(5);

  // Fetch assigned instructors
  const { data: assignments } = await supabase
    .from('student_instructor_assignments')
    .select(`
      teacher:profiles!student_instructor_assignments_teacher_id_fkey (id, full_name, role)
    `)
    .eq('student_id', user.id)
    .limit(5);

  return (
    <StudentDashboardClient
      profile={profile}
      sessions={sessions || []}
      assignments={assignments || []}
    />
  );
}
