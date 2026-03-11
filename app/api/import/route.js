import { createClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import { NextResponse } from 'next/server';

export async function POST(request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single();
  if (!['org_admin', 'platform_admin'].includes(profile?.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { type, rows } = await request.json();
  const results = { success: 0, failed: 0, errors: [] };

  // ── Members ──────────────────────────────────────────────────────────────
  if (type === 'members') {
    const admin = createAdminClient();
    for (const row of rows) {
      const full_name = row.full_name?.trim();
      const email = row.email?.trim().toLowerCase();
      const role = row.role?.trim() || 'student';

      if (!full_name || !email) {
        results.failed++;
        results.errors.push(`缺少姓名或信箱 / Missing name or email: ${JSON.stringify(row)}`);
        continue;
      }

      const validRoles = ['student', 'teacher', 'org_admin', 'platform_admin'];
      if (!validRoles.includes(role)) {
        results.failed++;
        results.errors.push(`${email}: 無效角色 / Invalid role "${role}"`);
        continue;
      }

      const { error } = await admin.auth.admin.inviteUserByEmail(email, {
        data: { full_name, role },
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      });

      if (error) {
        results.failed++;
        results.errors.push(`${email}: ${error.message}`);
      } else {
        results.success++;
      }
    }

  // ── Subjects ─────────────────────────────────────────────────────────────
  } else if (type === 'subjects') {
    const inserts = rows
      .filter(r => r.name_en?.trim() && r.name_zh?.trim())
      .map(r => ({
        name_en: r.name_en.trim(),
        name_zh: r.name_zh.trim(),
        category: r.category?.trim() || null,
        is_active: true,
      }));

    const skipped = rows.length - inserts.length;
    if (skipped > 0) {
      results.errors.push(`略過 ${skipped} 筆缺少名稱的資料 / Skipped ${skipped} rows missing name_en or name_zh`);
    }

    if (inserts.length > 0) {
      const { error } = await supabase.from('subjects').insert(inserts);
      if (error) {
        results.failed = inserts.length;
        results.errors.push(error.message);
      } else {
        results.success = inserts.length;
        results.failed = skipped;
      }
    } else {
      results.failed = skipped;
    }

  // ── Assignments ───────────────────────────────────────────────────────────
  } else if (type === 'assignments') {
    const admin = createAdminClient();
    // Collect all unique emails to batch-fetch profiles
    const allEmails = [];
    for (const row of rows) {
      if (row.student_email) allEmails.push(row.student_email.trim().toLowerCase());
      if (row.teacher_email) allEmails.push(row.teacher_email.trim().toLowerCase());
    }
    const uniqueEmails = [...new Set(allEmails)];

    const { data: profileList, error: profileErr } = await admin
      .from('profiles')
      .select('id, email, role')
      .in('email', uniqueEmails);

    if (profileErr) {
      return NextResponse.json(
        { error: '無法查詢成員 / Could not query profiles. Make sure phase2.sql has been run: ' + profileErr.message },
        { status: 500 }
      );
    }

    const profileMap = {};
    for (const p of (profileList || [])) profileMap[p.email] = p;

    for (const row of rows) {
      const se = row.student_email?.trim().toLowerCase();
      const te = row.teacher_email?.trim().toLowerCase();

      if (!se || !te) {
        results.failed++;
        results.errors.push(`缺少信箱 / Missing email: ${JSON.stringify(row)}`);
        continue;
      }

      const student = profileMap[se];
      const teacher = profileMap[te];

      if (!student) {
        results.failed++;
        results.errors.push(`找不到學生 / Student not found: ${se}`);
        continue;
      }
      if (!teacher) {
        results.failed++;
        results.errors.push(`找不到老師 / Teacher not found: ${te}`);
        continue;
      }

      // Deduplicate
      const { data: existing } = await supabase
        .from('student_instructor_assignments')
        .select('id')
        .eq('student_id', student.id)
        .eq('teacher_id', teacher.id)
        .is('org_id', null)
        .maybeSingle();

      if (existing) {
        results.success++;
        continue;
      }

      const { error } = await supabase
        .from('student_instructor_assignments')
        .insert({ student_id: student.id, teacher_id: teacher.id, assigned_by: user.id });

      if (error) {
        results.failed++;
        results.errors.push(`${se} → ${te}: ${error.message}`);
      } else {
        results.success++;
      }
    }
  } else {
    return NextResponse.json({ error: 'Unknown import type' }, { status: 400 });
  }

  return NextResponse.json(results);
}
