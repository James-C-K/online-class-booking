'use client';

import { useState } from 'react';
import { useLang } from '@/lib/LanguageContext';

const DAYS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAYS_ZH = ['日', '一', '二', '三', '四', '五', '六'];

const STATUS_STYLE = {
  confirmed: { bg: 'rgba(99,102,241,0.25)', color: '#a5b4fc', label_en: 'Confirmed', label_zh: '已確認' },
  completed:  { bg: 'rgba(34,197,94,0.2)',  color: '#4ade80', label_en: 'Completed',  label_zh: '已完成' },
  cancelled:  { bg: 'rgba(239,68,68,0.2)',  color: '#f87171', label_en: 'Cancelled',  label_zh: '已取消' },
  no_show:    { bg: 'rgba(245,158,11,0.2)', color: '#fbbf24', label_en: 'No Show',    label_zh: '未出席' },
};

function fmt(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function CalendarView({ sessions, title, subtitle }) {
  const { t, lang } = useLang();
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(fmt(today));

  const days = lang === 'zh' ? DAYS_ZH : DAYS_EN;

  // Build session map: { 'YYYY-MM-DD': [session, ...] }
  const sessionMap = {};
  (sessions || []).forEach(s => {
    const raw = s.start_time || s.session?.start_time;
    if (!raw) return;
    const d = fmt(new Date(raw));
    if (!sessionMap[d]) sessionMap[d] = [];
    sessionMap[d].push(s);
  });

  // Build calendar cells
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDow = firstDay.getDay();

  const cells = [];
  for (let i = 0; i < startDow; i++) {
    cells.push({ date: new Date(year, month, 1 - (startDow - i)), inMonth: false });
  }
  for (let d = 1; d <= lastDay.getDate(); d++) {
    cells.push({ date: new Date(year, month, d), inMonth: true });
  }
  const trailing = 7 - (cells.length % 7);
  if (trailing < 7) {
    for (let i = 1; i <= trailing; i++) {
      cells.push({ date: new Date(year, month + 1, i), inMonth: false });
    }
  }

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1);
  };

  const monthLabel = new Date(year, month, 1).toLocaleDateString(
    lang === 'zh' ? 'zh-TW' : 'en-US',
    { year: 'numeric', month: 'long' }
  );

  const selectedSessions = sessionMap[selectedDate] || [];
  const selectedDateLabel = selectedDate
    ? new Date(selectedDate + 'T00:00:00').toLocaleDateString(
        lang === 'zh' ? 'zh-TW' : 'en-US',
        { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
      )
    : '';

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{
          fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.25rem',
          background: 'linear-gradient(to right, #fff, #94a3b8)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>
          {title || t.calendarTitle}
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>{subtitle || t.calendarSubtitle}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
        {/* Calendar card */}
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '20px',
          padding: '1.5rem',
        }}>
          {/* Month navigation */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <button onClick={prevMonth} style={navBtnStyle}>‹</button>
            <span style={{ fontWeight: 700, color: '#f8fafc', fontSize: '1.05rem' }}>{monthLabel}</span>
            <button onClick={nextMonth} style={navBtnStyle}>›</button>
          </div>

          {/* Day headers */}
          <div className="cal-grid" style={{ marginBottom: '6px' }}>
            {days.map(d => (
              <div key={d} style={{ textAlign: 'center', fontSize: '0.72rem', color: '#64748b', fontWeight: 600, padding: '4px 0' }}>
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="cal-grid">
            {cells.map(({ date, inMonth }, i) => {
              const key = fmt(date);
              const daySessions = sessionMap[key] || [];
              const isToday = key === fmt(today);
              const isSelected = key === selectedDate;
              const hasSessions = daySessions.length > 0;

              return (
                <div
                  key={i}
                  onClick={() => inMonth && setSelectedDate(key)}
                  className={`cal-day${isToday ? ' today' : ''}${isSelected ? ' selected' : ''}${!inMonth ? ' other-month' : ''}${hasSessions ? ' has-sessions' : ''}`}
                  style={{
                    cursor: inMonth ? 'pointer' : 'default',
                    minHeight: '56px',
                  }}
                >
                  <span className="cal-day-num">{date.getDate()}</span>
                  {/* Session dots (desktop) */}
                  {daySessions.slice(0, 3).map((s, si) => {
                    const raw = s.start_time || s.session?.start_time;
                    const status = s.status || s.session?.status || 'confirmed';
                    const ss = STATUS_STYLE[status] || STATUS_STYLE.confirmed;
                    const subjectEn = s.subject?.name_en || s.session?.subject?.name_en;
                    const subjectZh = s.subject?.name_zh || s.session?.subject?.name_zh;
                    const label = (lang === 'zh' ? subjectZh : subjectEn) ||
                      (raw ? new Date(raw).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—');
                    return (
                      <div key={si} className="cal-session-dot" style={{ background: ss.bg, color: ss.color }}>
                        {label}
                      </div>
                    );
                  })}
                  {daySessions.length > 3 && (
                    <div style={{ fontSize: '0.6rem', color: '#64748b' }}>+{daySessions.length - 3}</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected day detail */}
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '20px',
          padding: '1.5rem',
        }}>
          <div style={{ fontWeight: 600, color: '#f8fafc', fontSize: '1rem', marginBottom: '1rem' }}>
            {selectedDateLabel}
          </div>

          {selectedSessions.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '2.5rem 1rem',
              color: '#475569', fontSize: '0.875rem',
              border: '1px dashed rgba(255,255,255,0.07)',
              borderRadius: '12px',
            }}>
              {selectedDate ? t.noSessionsDay : t.selectDay}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {selectedSessions.map((s, i) => {
                const raw = s.start_time || s.session?.start_time;
                const rawEnd = s.end_time || s.session?.end_time;
                const status = s.status || s.session?.status || 'confirmed';
                const ss = STATUS_STYLE[status] || STATUS_STYLE.confirmed;
                const subjectEn = s.subject?.name_en || s.session?.subject?.name_en;
                const subjectZh = s.subject?.name_zh || s.session?.subject?.name_zh;
                const subject = (lang === 'zh' ? subjectZh : subjectEn) || (lang === 'zh' ? '未指定科目' : 'No subject');
                const instructorName = s.instructor?.full_name || s.session?.instructor?.full_name;
                const studentNames = (s.participants || s.session?.participants || [])
                  .map(p => p.user?.full_name).filter(Boolean).join(', ');
                const start = raw ? new Date(raw) : null;
                const end = rawEnd ? new Date(rawEnd) : null;
                const meetingUrl = s.meeting_url || s.session?.meeting_url;

                return (
                  <div key={i} style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: `1px solid ${ss.bg}`,
                    borderRadius: '12px',
                    padding: '1rem 1.25rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '0.75rem',
                  }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 600, color: '#f8fafc', fontSize: '0.9rem' }}>{subject}</span>
                        <span style={{
                          fontSize: '0.7rem', padding: '2px 8px', borderRadius: '999px',
                          background: ss.bg, color: ss.color,
                        }}>
                          {lang === 'zh' ? ss.label_zh : ss.label_en}
                        </span>
                      </div>
                      {start && (
                        <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                          {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {end && ` – ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                        </div>
                      )}
                      {instructorName && (
                        <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>
                          {lang === 'zh' ? '老師：' : 'Instructor: '}{instructorName}
                        </div>
                      )}
                      {studentNames && (
                        <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>
                          {lang === 'zh' ? '學生：' : 'Student: '}{studentNames}
                        </div>
                      )}
                    </div>
                    {meetingUrl && status === 'confirmed' && (
                      <a href={meetingUrl} target="_blank" rel="noopener noreferrer">
                        <button style={{
                          padding: '7px 16px', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 600,
                          background: 'linear-gradient(135deg, #6366f1, #ec4899)', color: '#fff',
                          border: 'none', cursor: 'pointer',
                        }}>
                          {lang === 'zh' ? '加入' : 'Join'}
                        </button>
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const navBtnStyle = {
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '10px',
  color: '#f8fafc',
  cursor: 'pointer',
  fontSize: '1.3rem',
  padding: '3px 14px',
  lineHeight: 1.5,
  transition: 'background 0.2s',
};
