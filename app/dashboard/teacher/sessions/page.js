import { createClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import SessionsClient from '@/app/dashboard/student/sessions/SessionsClient';

export default async function TeacherSessionsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: sessions } = await supabase
    .from('sessions')
    .select(`
      id, type, start_time, end_time, status, meeting_url,
      subject:subjects (name_en, name_zh),
      participants:session_participants (
        user:profiles (id, full_name)
      )
    `)
    .eq('instructor_id', user.id)
    .order('start_time', { ascending: false });

  return <SessionsClient sessions={sessions || []} userRole="teacher" />;
}
