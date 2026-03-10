import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import AdminDashboardClient from './AdminDashboardClient';

export default async function AdminDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profile?.role === 'student') redirect('/dashboard/student');
  if (profile?.role === 'teacher') redirect('/dashboard/teacher');

  const [
    { count: totalUsers },
    { count: totalTeachers },
    { count: totalOrgs },
    { count: totalSessions },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'teacher'),
    supabase.from('organizations').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('sessions').select('*', { count: 'exact', head: true }),
  ]);

  // Recent users
  const { data: recentUsers } = await supabase
    .from('profiles')
    .select('id, full_name, role, created_at')
    .order('created_at', { ascending: false })
    .limit(5);

  return (
    <AdminDashboardClient
      profile={profile}
      stats={{ totalUsers, totalTeachers, totalOrgs, totalSessions }}
      recentUsers={recentUsers || []}
    />
  );
}
