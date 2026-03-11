import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const instructorId = searchParams.get('instructor_id') || user.id;
  const type = searchParams.get('type'); // 'recurring' | 'manual' | null (all)

  let query = supabase
    .from('availability')
    .select('*')
    .eq('instructor_id', instructorId)
    .eq('is_active', true);

  if (type) query = query.eq('type', type);

  query = query.order('day_of_week').order('date').order('start_time');

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { type, slots, date } = body;

  if (type === 'recurring') {
    // Replace all recurring slots for this instructor
    await supabase
      .from('availability')
      .delete()
      .eq('instructor_id', user.id)
      .eq('type', 'recurring');

    if (!slots || slots.length === 0) return NextResponse.json({ success: true });

    const rows = slots
      .filter(s => s.start_time && s.end_time && s.start_time < s.end_time)
      .map(s => ({
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

  if (type === 'manual') {
    // Replace all manual slots for a specific date
    if (!date) return NextResponse.json({ error: 'date required for manual type' }, { status: 400 });

    await supabase
      .from('availability')
      .delete()
      .eq('instructor_id', user.id)
      .eq('type', 'manual')
      .eq('date', date);

    if (!slots || slots.length === 0) return NextResponse.json({ success: true });

    const rows = slots
      .filter(s => s.start_time && s.end_time && s.start_time < s.end_time)
      .map(s => ({
        instructor_id: user.id,
        type: 'manual',
        date,
        start_time: s.start_time,
        end_time: s.end_time,
        is_active: true,
      }));

    const { error } = await supabase.from('availability').insert(rows);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'type must be recurring or manual' }, { status: 400 });
}
