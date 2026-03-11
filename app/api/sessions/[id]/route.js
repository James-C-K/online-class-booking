import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

// Cancel or complete a session, add notes
export async function PATCH(request, { params }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const { action, notes } = body; // action: 'cancel' | 'complete' | 'notes'

  // Fetch the session
  const { data: session } = await supabase
    .from('sessions')
    .select('*, org:organizations(cancellation_window_hours)')
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
  if (!participant && !isInstructor) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (action === 'cancel') {
    // Enforce cancellation window (default 24h)
    const windowHours = session.org?.cancellation_window_hours ?? 24;
    const sessionStart = new Date(session.start_time);
    const now = new Date();
    const hoursUntil = (sessionStart - now) / (1000 * 60 * 60);

    if (hoursUntil < windowHours && !isInstructor) {
      return NextResponse.json({
        error: `Cannot cancel within ${windowHours} hours of session start.`,
      }, { status: 422 });
    }

    const { error } = await supabase
      .from('sessions')
      .update({ status: 'cancelled' })
      .eq('id', id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Update participant status
    await supabase
      .from('session_participants')
      .update({ status: 'cancelled' })
      .eq('session_id', id);

    return NextResponse.json({ success: true });
  }

  if (action === 'notes' && notes !== undefined) {
    if (!isInstructor) return NextResponse.json({ error: 'Only instructors can add notes' }, { status: 403 });
    const { error } = await supabase.from('sessions').update({ notes }).eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
