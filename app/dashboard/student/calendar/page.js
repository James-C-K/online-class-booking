import { createClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import CalendarView from '@/components/CalendarView';

export default async function StudentCalendarPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Fetch student's sessions (via session_participants)
  const { data: rows } = await supabase
    .from('session_participants')
    .select(`
      session:sessions (
        id, start_time, end_time, status, meeting_url,
        subject:subjects (name_en, name_zh),
        instructor:profiles!sessions_instructor_id_fkey (id, full_name)
      )
    `)
    .eq('user_id', user.id)
    .eq('role', 'student');

  // Flatten: each row has a .session object — spread to top level for CalendarView
  const sessions = (rows || [])
    .map(r => r.session)
    .filter(Boolean);

  return <CalendarView sessions={sessions} />;
}
