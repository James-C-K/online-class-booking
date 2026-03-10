import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const role = searchParams.get('role'); // 'student' or 'teacher'

  let data, error;

  if (role === 'teacher') {
    ({ data, error } = await supabase
      .from('sessions')
      .select(`
        id, type, start_time, end_time, status, meeting_url,
        subject:subjects (name_en, name_zh),
        participants:session_participants (
          user:profiles (id, full_name)
        )
      `)
      .eq('instructor_id', user.id)
      .order('start_time', { ascending: false }));
  } else {
    ({ data, error } = await supabase
      .from('session_participants')
      .select(`
        session:sessions (
          id, type, start_time, end_time, status, meeting_url,
          subject:subjects (name_en, name_zh),
          instructor:profiles!sessions_instructor_id_fkey (id, full_name)
        )
      `)
      .eq('user_id', user.id)
      .eq('role', 'student')
      .order('created_at', { ascending: false }));
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { instructor_id, subject_id, start_time, end_time, org_id } = body;

  if (!instructor_id || !start_time || !end_time) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // Check for conflicts
  const { data: conflict } = await supabase
    .from('sessions')
    .select('id')
    .eq('instructor_id', instructor_id)
    .eq('status', 'confirmed')
    .lt('start_time', end_time)
    .gt('end_time', start_time)
    .single();

  if (conflict) {
    return NextResponse.json({ error: 'This time slot is already booked.' }, { status: 409 });
  }

  // Create session
  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .insert({
      type: '1on1',
      instructor_id,
      subject_id: subject_id || null,
      org_id: org_id || null,
      start_time,
      end_time,
      status: 'confirmed',
    })
    .select()
    .single();

  if (sessionError) return NextResponse.json({ error: sessionError.message }, { status: 500 });

  // Add participants
  await supabase.from('session_participants').insert([
    { session_id: session.id, user_id: instructor_id, role: 'instructor', status: 'confirmed' },
    { session_id: session.id, user_id: user.id, role: 'student', status: 'confirmed' },
  ]);

  return NextResponse.json({ session });
}
