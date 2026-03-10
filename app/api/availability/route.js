import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const instructorId = searchParams.get('instructor_id') || user.id;

  const { data, error } = await supabase
    .from('availability')
    .select('*')
    .eq('instructor_id', instructorId)
    .eq('is_active', true)
    .order('day_of_week')
    .order('start_time');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { slots } = body; // Array of { day_of_week, start_time, end_time }

  // Delete existing recurring availability for this instructor
  await supabase
    .from('availability')
    .delete()
    .eq('instructor_id', user.id)
    .eq('type', 'recurring');

  if (!slots || slots.length === 0) {
    return NextResponse.json({ success: true });
  }

  const rows = slots.map(s => ({
    instructor_id: user.id,
    type: 'recurring',
    day_of_week: s.day_of_week,
    start_time: s.start_time,
    end_time: s.end_time,
    is_active: true,
  }));

  const { error } = await supabase.from('availability').insert(rows);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
