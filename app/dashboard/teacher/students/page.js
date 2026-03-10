import { createClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import StudentsClient from './StudentsClient';

export default async function TeacherStudentsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: assignments } = await supabase
    .from('student_instructor_assignments')
    .select(`
      id,
      student:profiles!student_instructor_assignments_student_id_fkey (id, full_name, created_at)
    `)
    .eq('teacher_id', user.id);

  const students = (assignments || []).map(a => a.student).filter(Boolean);

  // Sessions count per student
  const sessionCounts = {};
  if (students.length > 0) {
    const { data: parts } = await supabase
      .from('session_participants')
      .select('user_id, session:sessions(id, status)')
      .in('user_id', students.map(s => s.id))
      .eq('role', 'student');

    (parts || []).forEach(p => {
      if (!sessionCounts[p.user_id]) sessionCounts[p.user_id] = { total: 0, completed: 0 };
      sessionCounts[p.user_id].total++;
      if (p.session?.status === 'completed') sessionCounts[p.user_id].completed++;
    });
  }

  return <StudentsClient students={students} sessionCounts={sessionCounts} />;
}
