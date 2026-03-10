import { createClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import BookingClient from './BookingClient';

export default async function BookPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Get assigned instructors
  const { data: assignments } = await supabase
    .from('student_instructor_assignments')
    .select(`
      teacher:profiles!student_instructor_assignments_teacher_id_fkey (id, full_name)
    `)
    .eq('student_id', user.id);

  // Get subjects
  const { data: subjects } = await supabase
    .from('subjects')
    .select('id, name_en, name_zh')
    .eq('is_active', true)
    .order('name_en');

  const instructors = (assignments || []).map(a => a.teacher).filter(Boolean);

  return <BookingClient instructors={instructors} subjects={subjects || []} />;
}
