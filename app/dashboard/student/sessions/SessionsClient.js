'use client';

import { useState } from 'react';
import { useLang } from '@/lib/LanguageContext';

const statusStyle = {
  confirmed: { bg: 'rgba(99,102,241,0.1)',  color: '#818cf8', label_en: 'Confirmed', label_zh: '已確認' },
  completed:  { bg: 'rgba(34,197,94,0.1)',  color: '#4ade80', label_en: 'Completed',  label_zh: '已完成' },
  cancelled:  { bg: 'rgba(239,68,68,0.1)',  color: '#f87171', label_en: 'Cancelled',  label_zh: '已取消' },
  no_show:    { bg: 'rgba(245,158,11,0.1)', color: '#fbbf24', label_en: 'No Show',    label_zh: '未出席' },
};

export default function SessionsClient({ sessions: initial, userRole }) {
  const { t, lang } = useLang();
  const [sessions, setSessions] = useState(initial);
  const [filter, setFilter] = useState('all');
  const [notesOpen, setNotesOpen] = useState(null);
  const [notesText, setNotesText] = useState('');
  const [toast, setToast] = useState(null);

  const showToast = (msg, isError = false) => {
    setToast({ msg, isError });
    setTimeout(() => setToast(null), 3500);
  };

  const filtered = sessions.filter(s => filter === 'all' || s.status === filter);
  const upcoming = sessions.filter(s => s.status === 'confirmed');
  const past = sessions.filter(s => ['completed', 'cancelled'].includes(s.status));

  const cancelSession = async (id) => {
    if (!confirm(lang === 'zh' ? '確定要取消這堂課嗎？' : 'Cancel this session?')) return;
    const res = await fetch(`/api/sessions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'cancel' }),
    });
    const data = await res.json();
    if (res.ok) {
      setSessions(prev => prev.map(s => s.id === id ? { ...s, status: 'cancelled' } : s));
      showToast(lang === 'zh' ? '課程已取消' : 'Session cancelled');
    } else {
      showToast(data.error, true);
    }
  };

  const saveNotes = async (id) => {
    const res = await fetch(`/api/sessions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'notes', notes: notesText }),
    });
    if (res.ok) {
      setSessions(prev => prev.map(s => s.id === id ? { ...s, notes: notesText } : s));
      setNotesOpen(null);
      showToast(lang === 'zh' ? '備註已儲存' : 'Notes saved');
    } else {
      showToast((await res.json()).error, true);
    }
  };

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
          {lang === 'zh'
            ? `${upcoming.length} 個即將到來 · ${past.length} 個歷史記錄`
            : `${upcoming.length} upcoming · ${past.length} past`}
        </p>
      </div>

      {/* Filter tabs */}
      <div style={{
        display: 'flex', gap: '6px', marginBottom: '1.5rem',
        background: 'rgba(255,255,255,0.03)', padding: '4px', borderRadius: '12px',
        width: 'fit-content', border: '1px solid rgba(255,255,255,0.08)',
      }}>
        {[
          { val: 'all',       en: 'All',       zh: '全部' },
          { val: 'confirmed', en: 'Upcoming',  zh: '即將到來' },
          { val: 'completed', en: 'Completed', zh: '已完成' },
          { val: 'cancelled', en: 'Cancelled', zh: '已取消' },
        ].map(tab => (
          <button key={tab.val} onClick={() => setFilter(tab.val)} style={{
            padding: '6px 16px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 500,
            border: 'none', cursor: 'pointer', transition: 'all 0.2s',
            background: filter === tab.val ? 'linear-gradient(135deg, #6366f1, #ec4899)' : 'transparent',
            color: filter === tab.val ? '#fff' : '#94a3b8',
          }}>
            {lang === 'zh' ? tab.zh : tab.en}
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
            const other = userRole === 'student'
              ? session.instructor?.full_name
              : (session.participants || []).map(p => p.user?.full_name).filter(Boolean).join(', ');
            const isFuture = new Date(session.start_time) > new Date();
            const isNotesOpen = notesOpen === session.id;

            return (
              <div key={session.id} style={{
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '16px', overflow: 'hidden',
                transition: 'transform 0.2s',
              }}>
                <div style={{ padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
                      {userRole === 'student'
                        ? (lang === 'zh' ? '老師：' : 'Instructor: ')
                        : (lang === 'zh' ? '學生：' : 'Student: ')}
                      {other || '—'}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
                      {start.toLocaleDateString(lang === 'zh' ? 'zh-TW' : 'en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      {' · '}
                      {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {' – '}
                      {end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    {session.notes && (
                      <div style={{ marginTop: '6px', fontSize: '0.78rem', color: '#64748b', fontStyle: 'italic' }}>
                        📝 {session.notes}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                    {session.meeting_url && session.status === 'confirmed' && (
                      <a href={session.meeting_url} target="_blank" rel="noopener noreferrer">
                        <button style={{
                          padding: '7px 16px', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 600,
                          background: 'linear-gradient(135deg, #6366f1, #ec4899)', color: '#fff',
                          border: 'none', cursor: 'pointer',
                        }}>
                          {lang === 'zh' ? '加入' : 'Join'}
                        </button>
                      </a>
                    )}
                    {userRole === 'teacher' && (
                      <button onClick={() => { setNotesOpen(isNotesOpen ? null : session.id); setNotesText(session.notes || ''); }} style={{
                        padding: '7px 14px', borderRadius: '10px', fontSize: '0.8rem',
                        border: '1px solid rgba(255,255,255,0.1)',
                        background: isNotesOpen ? 'rgba(255,255,255,0.08)' : 'transparent',
                        color: '#94a3b8', cursor: 'pointer',
                      }}>
                        📝
                      </button>
                    )}
                    {session.status === 'confirmed' && isFuture && (
                      <button onClick={() => cancelSession(session.id)} style={{
                        padding: '7px 14px', borderRadius: '10px', fontSize: '0.8rem',
                        border: '1px solid rgba(239,68,68,0.3)',
                        background: 'rgba(239,68,68,0.08)', color: '#f87171', cursor: 'pointer',
                      }}>
                        {lang === 'zh' ? '取消' : 'Cancel'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Notes panel (teacher only) */}
                {isNotesOpen && (
                  <div style={{
                    padding: '1rem 1.5rem', borderTop: '1px solid rgba(255,255,255,0.06)',
                    background: 'rgba(255,255,255,0.02)',
                  }}>
                    <textarea
                      value={notesText}
                      onChange={e => setNotesText(e.target.value)}
                      placeholder={lang === 'zh' ? '輸入課後備註...' : 'Enter session notes...'}
                      rows={3}
                      style={{
                        width: '100%', background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px',
                        padding: '10px 14px', color: '#f8fafc', fontSize: '0.875rem',
                        resize: 'vertical', fontFamily: 'inherit', outline: 'none',
                        marginBottom: '0.75rem', boxSizing: 'border-box',
                      }}
                    />
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => saveNotes(session.id)} className="submit-btn"
                        style={{ width: 'auto', padding: '8px 20px', marginTop: 0 }}>
                        {lang === 'zh' ? '儲存備註' : 'Save Notes'}
                      </button>
                      <button onClick={() => setNotesOpen(null)} style={{
                        padding: '8px 16px', borderRadius: '10px', fontSize: '0.875rem',
                        border: '1px solid rgba(255,255,255,0.1)', background: 'transparent',
                        color: '#94a3b8', cursor: 'pointer',
                      }}>
                        {lang === 'zh' ? '取消' : 'Cancel'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {toast && (
        <div className={`toast ${toast.isError ? 'toast-error' : 'toast-success'}`}>{toast.msg}</div>
      )}
    </div>
  );
}
