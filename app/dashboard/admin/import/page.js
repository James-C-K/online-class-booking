import { createClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import ImportClient from './ImportClient';

export default async function ImportPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single();
  if (!['org_admin', 'platform_admin'].includes(profile?.role)) redirect('/dashboard');

  return <ImportClient />;
}
