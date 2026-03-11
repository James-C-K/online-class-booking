import { createClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import AdminAvailabilityClient from './AdminAvailabilityClient';

export default async function AdminAvailabilityPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Only admins
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!['org_admin', 'platform_admin'].includes(profile?.role)) redirect('/dashboard');

  // All teachers
  const { data: teachers } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('role', 'teacher')
    .order('full_name');

  // All availability for all teachers
  const teacherIds = (teachers || []).map(t => t.id);
  let allSlots = [];
  if (teacherIds.length > 0) {
    const { data } = await supabase
      .from('availability')
      .select('*')
      .in('instructor_id', teacherIds)
      .eq('is_active', true)
      .order('day_of_week')
      .order('date')
      .order('start_time');
    allSlots = data || [];
  }

  // Group slots by instructor_id
  const slotsByTeacher = {};
  allSlots.forEach(s => {
    if (!slotsByTeacher[s.instructor_id]) slotsByTeacher[s.instructor_id] = [];
    slotsByTeacher[s.instructor_id].push(s);
  });

  const teachersWithSlots = (teachers || []).map(t => ({
    ...t,
    slots: slotsByTeacher[t.id] || [],
  }));

  return <AdminAvailabilityClient teachers={teachersWithSlots} />;
}
