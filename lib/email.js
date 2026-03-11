import { Resend } from 'resend';

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}
const FROM = process.env.EMAIL_FROM || 'Class-Booking <noreply@resend.dev>';
const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://learning-online-booking.zeabur.app';

// ─── Shared HTML shell ────────────────────────────────────────────────────────

function emailShell(bodyHtml) {
  return `<!DOCTYPE html>
<html lang="zh">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>Class-Booking</title>
</head>
<body style="margin:0;padding:0;background:#0f172a;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0"
    style="background:linear-gradient(135deg,#1e1b4b 0%,#0f172a 50%,#020617 100%);min-height:100vh;">
    <tr>
      <td align="center" valign="middle" style="padding:40px 16px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:480px;">
          <tr>
            <td style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:24px;padding:40px 36px;text-align:center;">
              <!-- Logo -->
              <div style="margin-bottom:24px;">
                <span style="font-size:20px;font-weight:700;background:linear-gradient(to right,#6366f1,#ec4899);-webkit-background-clip:text;color:transparent;">
                  Class-Booking
                </span>
              </div>
              <!-- Divider -->
              <div style="width:40px;height:3px;background:linear-gradient(to right,#6366f1,#ec4899);border-radius:999px;margin:0 auto 24px;"></div>
              ${bodyHtml}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 0 0;text-align:center;">
              <p style="margin:0;font-size:11px;color:#334155;">
                © 2026 Class-Booking &nbsp;·&nbsp;
                <a href="${SITE}" style="color:#6366f1;text-decoration:none;">${SITE.replace('https://', '')}</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString('zh-TW', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'long',
  });
}
function fmtTime(iso) {
  return new Date(iso).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });
}
function fmtDateEn(iso) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'long',
  });
}
function fmtTimeEn(iso) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

// ─── Booking Confirmation ─────────────────────────────────────────────────────

function bookingConfirmedHtml({ recipientName, otherName, otherRole, subject, startTime, endTime }) {
  const dateZh = fmtDate(startTime);
  const timeZh = `${fmtTime(startTime)} – ${fmtTime(endTime)}`;
  const dateEn = fmtDateEn(startTime);
  const timeEn = `${fmtTimeEn(startTime)} – ${fmtTimeEn(endTime)}`;
  const subjectLabel = subject || '—';
  const otherLabel = otherRole === 'instructor'
    ? `老師 / Instructor: <strong style="color:#f8fafc;">${otherName}</strong>`
    : `學生 / Student: <strong style="color:#f8fafc;">${otherName}</strong>`;

  return emailShell(`
    <div style="font-size:36px;margin-bottom:16px;">✅</div>
    <h1 style="margin:0 0 6px;font-size:22px;font-weight:700;color:#f8fafc;">課程預約已確認</h1>
    <h2 style="margin:0 0 24px;font-size:15px;font-weight:400;color:#94a3b8;">Booking Confirmed</h2>
    <p style="margin:0 0 24px;font-size:14px;color:#94a3b8;line-height:1.7;">
      您好 ${recipientName}，您的課程已成功預約。<br/>
      Hi ${recipientName}, your session has been confirmed.
    </p>
    <!-- Detail table -->
    <table width="100%" cellpadding="0" cellspacing="0" style="border-radius:12px;overflow:hidden;margin-bottom:28px;">
      ${[
        ['科目 / Subject', subjectLabel],
        ['日期 / Date', `${dateZh}<br/><span style="color:#64748b;font-size:12px;">${dateEn}</span>`],
        ['時間 / Time', `${timeZh}<br/><span style="color:#64748b;font-size:12px;">${timeEn}</span>`],
        [otherRole === 'instructor' ? '老師 / Instructor' : '學生 / Student', otherName],
      ].map(([label, val], i) => `
        <tr style="background:${i % 2 === 0 ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.02)'};">
          <td style="padding:10px 16px;font-size:12px;color:#64748b;text-align:left;width:45%;">${label}</td>
          <td style="padding:10px 16px;font-size:13px;color:#f8fafc;text-align:left;">${val}</td>
        </tr>
      `).join('')}
    </table>
    <a href="${SITE}/dashboard"
      style="display:inline-block;background:linear-gradient(135deg,#6366f1,#ec4899);color:#fff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 32px;border-radius:10px;">
      查看課程 / View Session
    </a>
  `);
}

export async function sendBookingConfirmation({ student, instructor, subject, startTime, endTime }) {
  if (!process.env.RESEND_API_KEY) return; // skip if not configured

  const subjectLabel = subject || '—';

  await Promise.allSettled([
    // To student
    student.email && getResend().emails.send({
      from: FROM,
      to: student.email,
      subject: `✅ 課程預約確認 — ${subjectLabel}`,
      html: bookingConfirmedHtml({
        recipientName: student.name,
        otherName: instructor.name,
        otherRole: 'instructor',
        subject: subjectLabel,
        startTime,
        endTime,
      }),
    }),
    // To instructor
    instructor.email && getResend().emails.send({
      from: FROM,
      to: instructor.email,
      subject: `📅 新課程預約 — ${subjectLabel}`,
      html: bookingConfirmedHtml({
        recipientName: instructor.name,
        otherName: student.name,
        otherRole: 'student',
        subject: subjectLabel,
        startTime,
        endTime,
      }),
    }),
  ]);
}

// ─── Cancellation ─────────────────────────────────────────────────────────────

function cancellationHtml({ recipientName, otherName, subject, startTime }) {
  const dateZh = fmtDate(startTime);
  const dateEn = fmtDateEn(startTime);
  const subjectLabel = subject || '—';

  return emailShell(`
    <div style="font-size:36px;margin-bottom:16px;">❌</div>
    <h1 style="margin:0 0 6px;font-size:22px;font-weight:700;color:#f8fafc;">課程已取消</h1>
    <h2 style="margin:0 0 24px;font-size:15px;font-weight:400;color:#94a3b8;">Session Cancelled</h2>
    <p style="margin:0 0 24px;font-size:14px;color:#94a3b8;line-height:1.7;">
      您好 ${recipientName}，以下課程已被取消。<br/>
      Hi ${recipientName}, the following session has been cancelled.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="border-radius:12px;overflow:hidden;margin-bottom:28px;">
      ${[
        ['科目 / Subject', subjectLabel],
        ['原定日期 / Date', `${dateZh}<br/><span style="color:#64748b;font-size:12px;">${dateEn}</span>`],
        ['對方 / Other Party', otherName],
      ].map(([label, val], i) => `
        <tr style="background:${i % 2 === 0 ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.02)'};">
          <td style="padding:10px 16px;font-size:12px;color:#64748b;text-align:left;width:45%;">${label}</td>
          <td style="padding:10px 16px;font-size:13px;color:#f8fafc;text-align:left;">${val}</td>
        </tr>
      `).join('')}
    </table>
    <a href="${SITE}/dashboard"
      style="display:inline-block;background:linear-gradient(135deg,#6366f1,#ec4899);color:#fff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 32px;border-radius:10px;">
      重新預約 / Book Again
    </a>
  `);
}

export async function sendCancellationEmail({ student, instructor, subject, startTime }) {
  if (!process.env.RESEND_API_KEY) return;

  const subjectLabel = subject || '—';

  await Promise.allSettled([
    student.email && getResend().emails.send({
      from: FROM,
      to: student.email,
      subject: `❌ 課程已取消 — ${subjectLabel}`,
      html: cancellationHtml({ recipientName: student.name, otherName: instructor.name, subject: subjectLabel, startTime }),
    }),
    instructor.email && getResend().emails.send({
      from: FROM,
      to: instructor.email,
      subject: `❌ 課程已取消 — ${subjectLabel}`,
      html: cancellationHtml({ recipientName: instructor.name, otherName: student.name, subject: subjectLabel, startTime }),
    }),
  ]);
}

// ─── Group Session Join ───────────────────────────────────────────────────────

export async function sendGroupJoinEmail({ student, instructor, subject, startTime }) {
  if (!process.env.RESEND_API_KEY) return;

  const subjectLabel = subject || '—';
  const dateZh = fmtDate(startTime);
  const dateEn = fmtDateEn(startTime);

  const html = emailShell(`
    <div style="font-size:36px;margin-bottom:16px;">👥</div>
    <h1 style="margin:0 0 6px;font-size:22px;font-weight:700;color:#f8fafc;">已加入團體課程</h1>
    <h2 style="margin:0 0 24px;font-size:15px;font-weight:400;color:#94a3b8;">Joined Group Session</h2>
    <p style="margin:0 0 24px;font-size:14px;color:#94a3b8;line-height:1.7;">
      ${student.name} 已成功加入以下團體課程。<br/>
      ${student.name} has joined the group session below.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="border-radius:12px;overflow:hidden;margin-bottom:28px;">
      ${[
        ['科目 / Subject', subjectLabel],
        ['日期 / Date', `${dateZh}<br/><span style="color:#64748b;font-size:12px;">${dateEn}</span>`],
        ['老師 / Instructor', instructor.name],
      ].map(([label, val], i) => `
        <tr style="background:${i % 2 === 0 ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.02)'};">
          <td style="padding:10px 16px;font-size:12px;color:#64748b;text-align:left;width:45%;">${label}</td>
          <td style="padding:10px 16px;font-size:13px;color:#f8fafc;text-align:left;">${val}</td>
        </tr>
      `).join('')}
    </table>
    <a href="${SITE}/dashboard"
      style="display:inline-block;background:linear-gradient(135deg,#6366f1,#ec4899);color:#fff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 32px;border-radius:10px;">
      查看課程 / View Session
    </a>
  `);

  await Promise.allSettled([
    student.email && getResend().emails.send({
      from: FROM, to: student.email,
      subject: `👥 已加入團體課程 — ${subjectLabel}`,
      html,
    }),
  ]);
}
