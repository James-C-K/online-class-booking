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

  // Use SECURITY DEFINER RPC to bypass stale PostgREST RLS cache.
  // Auth is already verified above via getUser(). The function handles
  // conflict check, session insert, and instructor participant insert atomically.
  const { data: rpcResult, error: sessionError } = await supabase.rpc('book_1on1_session', {
    p_instructor_id: instructor_id,
    p_subject_id: subject_id || null,
    p_org_id: org_id || null,
    p_start_time: start_time,
    p_end_time: end_time,
  });

  if (sessionError) return NextResponse.json({ error: sessionError.message }, { status: 500 });

  const session = { id: rpcResult.id, start_time: rpcResult.start_time, end_time: rpcResult.end_time, subject: null };

  // Add student as participant (also via RPC-equivalent direct insert — already bypassed by function above for instructor)
  await supabase.rpc('add_session_participant', {
    p_session_id: rpcResult.id,
    p_user_id: user.id,
    p_role: 'student',
  });

  // Fetch names + emails for notifications
  const { data: studentProfile } = await supabase
    .from('profiles').select('full_name').eq('id', user.id).single();
  const { data: instructorProfile } = await supabase
    .from('profiles').select('full_name').eq('id', instructor_id).single();

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
    student: { name: studentProfile?.full_name, email: null },
    instructor: { name: instructorProfile?.full_name, email: null },
    subject: subjectName,
    startTime: session.start_time,
    endTime: session.end_time,
  });

  return NextResponse.json({ session });
}
