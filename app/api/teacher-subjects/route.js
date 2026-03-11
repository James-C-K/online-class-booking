import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const teacherId = searchParams.get('teacher_id');

  const query = supabase
    .from('teacher_subjects')
    .select('id, subject_id, subject:subjects(id, name_en, name_zh)');

  if (teacherId) query.eq('teacher_id', teacherId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { teacher_id, subject_id } = await request.json();

  const { data: existing } = await supabase
    .from('teacher_subjects')
    .select('id')
    .eq('teacher_id', teacher_id)
    .eq('subject_id', subject_id)
    .maybeSingle();

  if (existing) return NextResponse.json({ success: true });

  const { error } = await supabase
    .from('teacher_subjects')
    .insert({ teacher_id, subject_id });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function DELETE(request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { teacher_id, subject_id } = await request.json();
  const { error } = await supabase
    .from('teacher_subjects')
    .delete()
    .eq('teacher_id', teacher_id)
    .eq('subject_id', subject_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
