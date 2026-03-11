import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';
import { sendBookingConfirmation } from '@/lib/email';

// ─── Helper: create in-app notification ──────────────────────────────────────
async function createNotification(supabase, { userId, type, titleEn, titleZh, bodyEn, bodyZh, sessionId }) {
  await supabase.from('notifications').insert({
    user_id: userId,
    type,
    title_en: titleEn,
    title_zh: titleZh,
    body_en: bodyEn,
    body_zh: bodyZh,
    session_id: sessionId,
  });
}

// ─── GET ──────────────────────────────────────────────────────────────────────
export async function GET(request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const role = searchParams.get('role');
  const type = searchParams.get('type'); // '1on1' | 'group' | null (all)

  let data, error;

  if (role === 'teacher') {
    let q = supabase
      .from('sessions')
      .select(`
        id, type, start_time, end_time, status, meeting_url, capacity,
        subject:subjects (name_en, name_zh),
        participants:session_participants (
          user:profiles (id, full_name)
        )
      `)
      .eq('instructor_id', user.id)
      .order('start_time', { ascending: false });
    if (type) q = q.eq('type', type);
    ({ data, error } = await q);
  } else {
    let q = supabase
      .from('session_participants')
      .select(`
        session:sessions (
          id, type, start_time, end_time, status, meeting_url, capacity,
          subject:subjects (name_en, name_zh),
          instructor:profiles!sessions_instructor_id_fkey (id, full_name)
        )
      `)
      .eq('user_id', user.id)
      .eq('role', 'student')
      .order('created_at', { ascending: false });
    ({ data, error } = await q);
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// ─── POST — create 1on1 or group session ─────────────────────────────────────
export async function POST(request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { type = '1on1', instructor_id, subject_id, start_time, end_time, org_id, capacity, meeting_url } = body;

  if (!start_time || !end_time) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // ── Group session creation (teacher/admin only) ──
  if (type === 'group') {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (!['teacher', 'org_admin', 'platform_admin'].includes(profile?.role)) {
      return NextResponse.json({ error: 'Only teachers or admins can create group sessions' }, { status: 403 });
    }

    const { data: session, error } = await supabase
      .from('sessions')
      .insert({
        type: 'group',
        instructor_id: user.id,
        subject_id: subject_id || null,
        org_id: org_id || null,
        start_time,
        end_time,
        status: 'confirmed',
        capacity: capacity || 10,
        meeting_url: meeting_url || null,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Add instructor as participant
    await supabase.from('session_participants').insert({
      session_id: session.id, user_id: user.id, role: 'instructor', status: 'confirmed',
    });

    return NextResponse.json({ session });
  }

  // ── 1-on-1 session booking ──
  if (!instructor_id) return NextResponse.json({ error: 'instructor_id required for 1on1' }, { status: 400 });

  // Conflict check
  const { data: conflict } = await supabase
    .from('sessions')
    .select('id')
    .eq('instructor_id', instructor_id)
    .eq('status', 'confirmed')
    .lt('start_time', end_time)
    .gt('end_time', start_time)
    .single();

  if (conflict) return NextResponse.json({ error: 'This time slot is already booked.' }, { status: 409 });

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
    .select(`
      id, start_time, end_time,
      subject:subjects (name_en, name_zh)
    `)
    .single();

  if (sessionError) return NextResponse.json({ error: sessionError.message }, { status: 500 });

  // Add participants
  await supabase.from('session_participants').insert([
    { session_id: session.id, user_id: instructor_id, role: 'instructor', status: 'confirmed' },
    { session_id: session.id, user_id: user.id, role: 'student', status: 'confirmed' },
  ]);

  // Fetch names + emails for notifications
  const { data: studentProfile } = await supabase
    .from('profiles').select('full_name, email').eq('id', user.id).single();
  const { data: instructorProfile } = await supabase
    .from('profiles').select('full_name, email').eq('id', instructor_id).single();

  const subjectName = session.subject?.name_zh || session.subject?.name_en || '—';

  // In-app notifications (fire and forget)
  Promise.allSettled([
    createNotification(supabase, {
      userId: user.id,
      type: 'booking_confirmed',
      titleEn: 'Booking Confirmed',
      titleZh: '課程預約成功',
      bodyEn: `Your session with ${instructorProfile?.full_name} has been confirmed.`,
      bodyZh: `您與 ${instructorProfile?.full_name} 的課程已確認。`,
      sessionId: session.id,
    }),
    createNotification(supabase, {
      userId: instructor_id,
      type: 'booking_confirmed',
      titleEn: 'New Booking',
      titleZh: '新課程預約',
      bodyEn: `${studentProfile?.full_name} has booked a session with you.`,
      bodyZh: `${studentProfile?.full_name} 已預約您的課程。`,
      sessionId: session.id,
    }),
  ]);

  // Send emails (fire and forget)
  sendBookingConfirmation({
    student: { name: studentProfile?.full_name, email: studentProfile?.email },
    instructor: { name: instructorProfile?.full_name, email: instructorProfile?.email },
    subject: subjectName,
    startTime: session.start_time,
    endTime: session.end_time,
  });

  return NextResponse.json({ session });
}
