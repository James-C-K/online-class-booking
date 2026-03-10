import { createClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import InstructorsClient from './InstructorsClient';

export default async function StudentInstructorsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: assignments } = await supabase
    .from('student_instructor_assignments')
    .select(`
      id,
      teacher:profiles!student_instructor_assignments_teacher_id_fkey (id, full_name)
    `)
    .eq('student_id', user.id);

  const instructors = (assignments || []).map(a => a.teacher).filter(Boolean);

  // Fetch availability for each instructor
  const availabilityByInstructor = {};
  if (instructors.length > 0) {
    const { data: avail } = await supabase
      .from('availability')
      .select('*')
      .in('instructor_id', instructors.map(i => i.id))
      .eq('type', 'recurring')
      .eq('is_active', true)
      .order('day_of_week')
      .order('start_time');

    (avail || []).forEach(a => {
      if (!availabilityByInstructor[a.instructor_id]) availabilityByInstructor[a.instructor_id] = [];
      availabilityByInstructor[a.instructor_id].push(a);
    });
  }

  return <InstructorsClient instructors={instructors} availabilityByInstructor={availabilityByInstructor} />;
}
