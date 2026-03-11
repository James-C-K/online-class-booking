import { createClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import CalendarView from '@/components/CalendarView';

export default async function AdminCalendarPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Admin sees all sessions (requires sessions_select_admin RLS policy)
  const { data: sessions } = await supabase
    .from('sessions')
    .select(`
      id, start_time, end_time, status, meeting_url,
      subject:subjects (name_en, name_zh),
      instructor:profiles!sessions_instructor_id_fkey (id, full_name),
      participants:session_participants (
        user:profiles (id, full_name)
      )
    `)
    .order('start_time', { ascending: true });

  return <CalendarView sessions={sessions || []} />;
}
