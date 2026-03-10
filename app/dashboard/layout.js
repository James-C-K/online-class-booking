import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import Sidebar from '@/components/Sidebar';

export default async function DashboardLayout({ children }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar user={user} profile={profile} />
      <main style={{
        marginLeft: '240px',
        flex: 1,
        padding: '2rem',
        minHeight: '100vh',
      }}>
        {children}
      </main>
    </div>
  );
}
