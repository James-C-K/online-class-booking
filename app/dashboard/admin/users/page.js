import { createClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import UsersClient from './UsersClient';

export default async function UsersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single();
  if (!['org_admin', 'platform_admin'].includes(profile?.role)) redirect('/dashboard');

  const [
    { data: users },
    { data: teachers },
    { data: students },
    { data: assignments },
    { data: subjects },
    { data: teacherSubjects },
    { data: organizations },
    { data: orgMemberships },
  ] = await Promise.all([
    supabase.from('profiles').select('id, full_name, role, created_at').order('created_at', { ascending: false }),
    supabase.from('profiles').select('id, full_name').eq('role', 'teacher'),
    supabase.from('profiles').select('id, full_name').eq('role', 'student'),
    supabase.from('student_instructor_assignments').select('id, student_id, teacher_id'),
    supabase.from('subjects').select('id, name_en, name_zh').eq('is_active', true).order('name_en'),
    supabase.from('teacher_subjects').select('teacher_id, subject_id'),
    supabase.from('organizations').select('id, name').eq('is_active', true).order('name'),
    supabase.from('org_memberships').select('user_id, org_id'),
  ]);

  return (
    <UsersClient
      users={users || []}
      teachers={teachers || []}
      students={students || []}
      assignments={assignments || []}
      subjects={subjects || []}
      teacherSubjects={teacherSubjects || []}
      organizations={organizations || []}
      orgMemberships={orgMemberships || []}
    />
  );
}
