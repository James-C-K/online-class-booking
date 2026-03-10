import { createClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import UsersClient from './UsersClient';

export default async function UsersPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single();

  if (!['org_admin', 'platform_admin'].includes(profile?.role)) redirect('/dashboard');

  const [{ data: users }, { data: teachers }, { data: students }] = await Promise.all([
    supabase.from('profiles').select('id, full_name, role, created_at').order('created_at', { ascending: false }),
    supabase.from('profiles').select('id, full_name').eq('role', 'teacher'),
    supabase.from('profiles').select('id, full_name').eq('role', 'student'),
  ]);

  const { data: assignments } = await supabase
    .from('student_instructor_assignments')
    .select('id, student_id, teacher_id');

  return (
    <UsersClient
      users={users || []}
      teachers={teachers || []}
      students={students || []}
      assignments={assignments || []}
    />
  );
}
