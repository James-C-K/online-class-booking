import { createClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import BookingClient from './BookingClient';

export default async function BookPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Assigned instructors
  const { data: assignments } = await supabase
    .from('student_instructor_assignments')
    .select(`teacher:profiles!student_instructor_assignments_teacher_id_fkey (id, full_name)`)
    .eq('student_id', user.id);

  // Available group sessions (not full, future, confirmed)
  // Get sessions the student has already joined
  const { data: joined } = await supabase
    .from('session_participants')
    .select('session_id')
    .eq('user_id', user.id);

  const joinedIds = (joined || []).map(j => j.session_id);

  const { data: groupSessions } = await supabase
    .from('sessions')
    .select(`
      id, start_time, end_time, status, capacity, meeting_url,
      subject:subjects (name_en, name_zh),
      instructor:profiles!sessions_instructor_id_fkey (id, full_name),
      participants:session_participants (role, status)
    `)
    .eq('type', 'group')
    .eq('status', 'confirmed')
    .gt('start_time', new Date().toISOString())
    .order('start_time', { ascending: true });

  // Enrich with enrollment count and availability
  const enrichedGroups = (groupSessions || []).map(s => {
    const enrolled = s.participants.filter(p => p.role === 'student' && p.status === 'confirmed').length;
    return {
      ...s,
      enrolled,
      isFull: enrolled >= s.capacity,
      hasJoined: joinedIds.includes(s.id),
    };
  });

  const instructors = (assignments || []).map(a => a.teacher).filter(Boolean);

  return (
    <BookingClient
      instructors={instructors}
      groupSessions={enrichedGroups}
    />
  );
}
