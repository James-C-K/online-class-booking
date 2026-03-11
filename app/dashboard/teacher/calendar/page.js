import { createClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import CalendarView from '@/components/CalendarView';

export default async function TeacherCalendarPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Fetch teacher's sessions (as instructor)
  const { data: sessions } = await supabase
    .from('sessions')
    .select(`
      id, start_time, end_time, status, meeting_url,
      subject:subjects (name_en, name_zh),
      participants:session_participants (
        user:profiles (id, full_name)
      )
    `)
    .eq('instructor_id', user.id)
    .order('start_time', { ascending: true });

  return <CalendarView sessions={sessions || []} />;
}
