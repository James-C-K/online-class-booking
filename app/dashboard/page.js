import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const role = profile?.role || 'student';

  if (role === 'platform_admin' || role === 'org_admin') redirect('/dashboard/admin');
  if (role === 'teacher') redirect('/dashboard/teacher');
  redirect('/dashboard/student');
}
