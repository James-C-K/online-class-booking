'use client';

import { useState } from 'react';
import { useLang } from '@/lib/LanguageContext';

const statusStyle = {
  confirmed: { bg: 'rgba(99,102,241,0.1)',  color: '#818cf8', label_en: 'Confirmed', label_zh: '已確認' },
  completed:  { bg: 'rgba(34,197,94,0.1)',  color: '#4ade80', label_en: 'Completed',  label_zh: '已完成' },
  cancelled:  { bg: 'rgba(239,68,68,0.1)',  color: '#f87171', label_en: 'Cancelled',  label_zh: '已取消' },
  no_show:    { bg: 'rgba(245,158,11,0.1)', color: '#fbbf24', label_en: 'No Show',    label_zh: '未出席' },
};

export default function SessionsClient({ sessions, userRole }) {
  const { t, lang } = useLang();
  const [filter, setFilter] = useState('all');

  const filtered = sessions.filter(s => filter === 'all' || s.status === filter);
  const upcoming = sessions.filter(s => s.status === 'confirmed' && new Date(s.start_time) > new Date());
  const past = sessions.filter(s => s.status === 'completed' || s.status === 'cancelled');

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{
          fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.25rem',
          background: 'linear-gradient(to right, #fff, #94a3b8)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>
          {t.mySessions}
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
          {lang === 'zh' ? `${upcoming.length} 個即將到來 · ${past.length} 個歷史記錄` : `${upcoming.length} upcoming · ${past.length} past`}
        </p>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '1.5rem', background: 'rgba(255,255,255,0.03)', padding: '4px', borderRadius: '12px', width: 'fit-content', border: '1px solid rgba(255,255,255,0.08)' }}>
        {[
          { val: 'all',       label_en: 'All',       label_zh: '全部' },
          { val: 'confirmed', label_en: 'Upcoming',  label_zh: '即將到來' },
          { val: 'completed', label_en: 'Completed', label_zh: '已完成' },
          { val: 'cancelled', label_en: 'Cancelled', label_zh: '已取消' },
        ].map(tab => (
          <button key={tab.val} onClick={() => setFilter(tab.val)} style={{
            padding: '6px 16px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 500,
            border: 'none', cursor: 'pointer', transition: 'all 0.2s',
            background: filter === tab.val ? 'linear-gradient(135deg, #6366f1, #ec4899)' : 'transparent',
            color: filter === tab.val ? '#fff' : '#94a3b8',
          }}>
            {lang === 'zh' ? tab.label_zh : tab.label_en}
          </button>
        ))}
      </div>

      {/* Sessions list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {filtered.length === 0 ? (
          <div style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '16px', padding: '3rem', textAlign: 'center',
          }}>
            <p style={{ color: '#94a3b8' }}>{t.noUpcomingSessions}</p>
          </div>
        ) : (
          filtered.map(session => {
            const ss = statusStyle[session.status] || statusStyle.confirmed;
            const start = new Date(session.start_time);
            const end = new Date(session.end_time);
            const subject = lang === 'zh' ? session.subject?.name_zh : session.subject?.name_en;
            const other = userRole === 'student' ? session.instructor?.full_name : session.participants?.map(p => p.user?.full_name).filter(Boolean).join(', ');

            return (
              <div key={session.id} style={{
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '16px', padding: '1.25rem 1.5rem',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                transition: 'transform 0.2s',
              }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                    <span style={{ fontWeight: 600, color: '#f8fafc', fontSize: '0.95rem' }}>
                      {subject || (lang === 'zh' ? '未指定科目' : 'No subject')}
                    </span>
                    <span style={{
                      fontSize: '0.7rem', padding: '2px 8px', borderRadius: '999px',
                      background: ss.bg, color: ss.color,
                    }}>
                      {lang === 'zh' ? ss.label_zh : ss.label_en}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                    {userRole === 'student' ? (lang === 'zh' ? '老師：' : 'Instructor: ') : (lang === 'zh' ? '學生：' : 'Student: ')}
                    {other || '—'}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
                    {start.toLocaleDateString(lang === 'zh' ? 'zh-TW' : 'en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    {' · '}
                    {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – {end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                {session.meeting_url && session.status === 'confirmed' && (
                  <a href={session.meeting_url} target="_blank" rel="noopener noreferrer">
                    <button style={{
                      padding: '8px 18px', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 600,
                      background: 'linear-gradient(135deg, #6366f1, #ec4899)', color: '#fff',
                      border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
                    }}>
                      {lang === 'zh' ? '加入課程' : 'Join'}
                    </button>
                  </a>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
