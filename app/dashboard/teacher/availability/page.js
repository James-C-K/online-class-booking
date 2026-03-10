import { createClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import AvailabilityClient from './AvailabilityClient';

export default async function AvailabilityPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: slots } = await supabase
    .from('availability')
    .select('*')
    .eq('instructor_id', user.id)
    .eq('type', 'recurring')
    .eq('is_active', true)
    .order('day_of_week')
    .order('start_time');

  return <AvailabilityClient initialSlots={slots || []} />;
}
