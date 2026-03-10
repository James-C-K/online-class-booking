import { createClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import SubjectsClient from './SubjectsClient';

export default async function SubjectsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!['org_admin', 'platform_admin'].includes(profile?.role)) redirect('/dashboard');

  const { data: subjects } = await supabase
    .from('subjects').select('*').order('name_en');

  return <SubjectsClient subjects={subjects || []} />;
}
