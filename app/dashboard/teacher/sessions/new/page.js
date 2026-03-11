import { createClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import CreateSessionClient from './CreateSessionClient';

export default async function NewGroupSessionPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: subjects } = await supabase
    .from('subjects')
    .select('id, name_en, name_zh')
    .eq('is_active', true)
    .order('name_en');

  return <CreateSessionClient subjects={subjects || []} />;
}
