import { createClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import SessionsClient from './SessionsClient';

export default async function StudentSessionsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: rows } = await supabase
    .from('session_participants')
    .select(`
      session:sessions (
        id, type, start_time, end_time, status, meeting_url,
        subject:subjects (name_en, name_zh),
        instructor:profiles!sessions_instructor_id_fkey (id, full_name)
      )
    `)
    .eq('user_id', user.id)
    .eq('role', 'student')
    .order('created_at', { ascending: false });

  const sessions = (rows || []).map(r => r.session).filter(Boolean);
  return <SessionsClient sessions={sessions} userRole="student" />;
}
