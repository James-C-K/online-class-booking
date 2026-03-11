import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';
import { sendCancellationEmail, sendGroupJoinEmail } from '@/lib/email';

async function createNotification(supabase, { userId, type, titleEn, titleZh, bodyEn, bodyZh, sessionId }) {
  await supabase.from('notifications').insert({
    user_id: userId, type,
    title_en: titleEn, title_zh: titleZh,
    body_en: bodyEn, body_zh: bodyZh,
    session_id: sessionId,
  });
}

export async function PATCH(request, { params }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const { action, notes } = body;

  // Fetch session with full detail
  const { data: session } = await supabase
    .from('sessions')
    .select(`
      *,
      org:organizations(cancellation_window_hours),
      subject:subjects(name_en, name_zh),
      participants:session_participants(
        user_id, role,
        user:profiles(id, full_name, email)
      )
    `)
    .eq('id', id)
    .single();

  if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });

  // Verify user is a participant or instructor
  const { data: participant } = await supabase
    .from('session_participants')
    .select('role')
    .eq('session_id', id)
    .eq('user_id', user.id)
    .single();

  const isInstructor = session.instructor_id === user.id;

  // ── JOIN group session ────────────────────────────────────────────────────
  if (action === 'join') {
    if (session.type !== 'group') return NextResponse.json({ error: 'Not a group session' }, { status: 400 });
    if (session.status !== 'confirmed') return NextResponse.json({ error: 'Session is not available' }, { status: 400 });
    if (participant) return NextResponse.json({ error: 'Already joined' }, { status: 409 });

    // Check capacity
    const studentCount = session.participants.filter(p => p.role === 'student').length;
    if (studentCount >= session.capacity) {
      return NextResponse.json({ error: 'Session is full' }, { status: 409 });
    }

    const { error } = await supabase.from('session_participants').insert({
      session_id: id, user_id: user.id, role: 'student', status: 'confirmed',
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Fetch student + instructor info
    const { data: studentProfile } = await supabase.from('profiles').select('full_name, email').eq('id', user.id).single();
    const instructorParticipant = session.participants.find(p => p.role === 'instructor');
    const instructorName = instructorParticipant?.user?.full_name || '—';
    const subjectName = session.subject?.name_zh || session.subject?.name_en || '—';

    // Notification
    createNotification(supabase, {
      userId: user.id, type: 'group_joined',
      titleEn: 'Joined Group Session', titleZh: '已加入團體課程',
      bodyEn: `You joined a group session: ${subjectName}`,
      bodyZh: `您已加入團體課程：${subjectName}`,
      sessionId: id,
    });

    // Email
    sendGroupJoinEmail({
      student: { name: studentProfile?.full_name, email: studentProfile?.email },
      instructor: { name: instructorName, email: instructorParticipant?.user?.email },
      subject: subjectName,
      startTime: session.start_time,
    });

    return NextResponse.json({ success: true });
  }

  // For all remaining actions, must be participant or instructor
  if (!participant && !isInstructor) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // ── CANCEL ───────────────────────────────────────────────────────────────
  if (action === 'cancel') {
    const windowHours = session.org?.cancellation_window_hours ?? 24;
    const sessionStart = new Date(session.start_time);
    const hoursUntil = (sessionStart - new Date()) / (1000 * 60 * 60);

    if (hoursUntil < windowHours && !isInstructor) {
      return NextResponse.json({
        error: `Cannot cancel within ${windowHours} hours of session start.`,
      }, { status: 422 });
    }

    const { error } = await supabase.from('sessions').update({ status: 'cancelled' }).eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await supabase.from('session_participants').update({ status: 'cancelled' }).eq('session_id', id);

    // Build participant list for notifications + emails
    const students = session.participants.filter(p => p.role === 'student');
    const instructorParticipant = session.participants.find(p => p.role === 'instructor');
    const instructorName = instructorParticipant?.user?.full_name || '—';
    const subjectName = session.subject?.name_zh || session.subject?.name_en || '—';

    // Notifications + emails (fire and forget)
    Promise.allSettled([
      ...students.map(s => createNotification(supabase, {
        userId: s.user_id, type: 'booking_cancelled',
        titleEn: 'Session Cancelled', titleZh: '課程已取消',
        bodyEn: `Your session on ${new Date(session.start_time).toLocaleDateString('en-US')} has been cancelled.`,
        bodyZh: `您在 ${new Date(session.start_time).toLocaleDateString('zh-TW')} 的課程已取消。`,
        sessionId: id,
      })),
      isInstructor
        ? null
        : createNotification(supabase, {
            userId: session.instructor_id, type: 'booking_cancelled',
            titleEn: 'Session Cancelled', titleZh: '課程已取消',
            bodyEn: `A session on ${new Date(session.start_time).toLocaleDateString('en-US')} was cancelled by the student.`,
            bodyZh: `學生取消了 ${new Date(session.start_time).toLocaleDateString('zh-TW')} 的課程。`,
            sessionId: id,
          }),
      ...students.map(s => sendCancellationEmail({
        student: { name: s.user?.full_name, email: s.user?.email },
        instructor: { name: instructorName, email: instructorParticipant?.user?.email },
        subject: subjectName,
        startTime: session.start_time,
      })),
    ].filter(Boolean));

    return NextResponse.json({ success: true });
  }

  // ── NOTES ────────────────────────────────────────────────────────────────
  if (action === 'notes' && notes !== undefined) {
    if (!isInstructor) return NextResponse.json({ error: 'Only instructors can add notes' }, { status: 403 });
    const { error } = await supabase.from('sessions').update({ notes }).eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
