import { createClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import AvailabilityClient from './AvailabilityClient';

export default async function AvailabilityPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: allSlots } = await supabase
    .from('availability')
    .select('*')
    .eq('instructor_id', user.id)
    .eq('is_active', true)
    .order('day_of_week')
    .order('date')
    .order('start_time');

  const recurringSlots = (allSlots || []).filter(s => s.type === 'recurring');
  const manualSlots = (allSlots || []).filter(s => s.type === 'manual');

  return <AvailabilityClient initialRecurring={recurringSlots} initialManual={manualSlots} />;
}
