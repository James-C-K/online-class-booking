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

  // Fetch subjects for each instructor
  const subjectsByInstructor = {};
  if (instructors.length > 0) {
    const { data: ts } = await supabase
      .from('teacher_subjects')
      .select('teacher_id, subject:subjects(id, name_en, name_zh)')
      .in('teacher_id', instructors.map(i => i.id));

    (ts || []).forEach(r => {
      if (!subjectsByInstructor[r.teacher_id]) subjectsByInstructor[r.teacher_id] = [];
      if (r.subject) subjectsByInstructor[r.teacher_id].push(r.subject);
    });
  }

  return <InstructorsClient instructors={instructors} availabilityByInstructor={availabilityByInstructor} subjectsByInstructor={subjectsByInstructor} />;
}
