'use client';

import { useState } from 'react';
import { useLang } from '@/lib/LanguageContext';

const DAYS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAYS_ZH = ['週日', '週一', '週二', '週三', '週四', '週五', '週六'];

export default function AdminAvailabilityClient({ teachers }) {
  const { lang } = useLang();
  const [expanded, setExpanded] = useState(null);
  const [search, setSearch] = useState('');

  const days = lang === 'zh' ? DAYS_ZH : DAYS_EN;

  const filtered = teachers.filter(t =>
    !search || t.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;

  function slotHours(slots) {
    return slots.reduce((sum, s) => {
      const [sh, sm] = s.start_time.split(':').map(Number);
      const [eh, em] = s.end_time.split(':').map(Number);
      return sum + (eh + em / 60) - (sh + sm / 60);
    }, 0);
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{
          fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.25rem',
          background: 'linear-gradient(to right, #fff, #94a3b8)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>
          {lang === 'zh' ? '老師排程總覽' : 'Teacher Availability'}
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
          {lang === 'zh'
            ? `共 ${teachers.length} 位老師 · 點擊展開查看排程`
            : `${teachers.length} teachers · Click to expand schedule`}
        </p>
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder={lang === 'zh' ? '搜尋老師...' : 'Search teacher...'}
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="glass-input"
        style={{ maxWidth: '280px', marginBottom: '1.25rem' }}
      />

      {/* Teacher list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {filtered.length === 0 && (
          <div style={{
            textAlign: 'center', padding: '3rem', color: '#64748b',
            border: '1px dashed rgba(255,255,255,0.07)', borderRadius: '16px',
          }}>
            {lang === 'zh' ? '找不到老師' : 'No teachers found'}
          </div>
        )}

        {filtered.map(teacher => {
          const isOpen = expanded === teacher.id;
          const recurring = teacher.slots.filter(s => s.type === 'recurring');
          const manual = teacher.slots.filter(s => s.type === 'manual' && s.date >= todayStr);
          const hasAny = teacher.slots.length > 0;
          const weeklyHours = slotHours(recurring);
          const totalSlots = recurring.length + manual.length;

          // Build weekly map for recurring
          const weeklyMap = {};
          for (let i = 0; i < 7; i++) weeklyMap[i] = [];
          recurring.forEach(s => weeklyMap[s.day_of_week].push(s));

          return (
            <div key={teacher.id} style={{
              background: 'rgba(255,255,255,0.03)',
              border: `1px solid ${isOpen ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.08)'}`,
              borderRadius: '16px',
              overflow: 'hidden',
              transition: 'border-color 0.2s',
            }}>
              {/* Row header */}
              <button
                onClick={() => setExpanded(isOpen ? null : teacher.id)}
                style={{
                  width: '100%', padding: '1rem 1.5rem',
                  background: 'none', border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '12px',
                  textAlign: 'left',
                }}
              >
                {/* Avatar */}
                <div style={{
                  width: '38px', height: '38px', borderRadius: '50%', flexShrink: 0,
                  background: 'linear-gradient(135deg, #6366f1, #ec4899)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.9rem', fontWeight: 700, color: '#fff',
                }}>
                  {teacher.full_name?.[0] || '?'}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: '#f8fafc', fontSize: '0.9rem' }}>
                    {teacher.full_name || '—'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                    {hasAny
                      ? `${totalSlots} ${lang === 'zh' ? '個時段' : 'slots'} · ${weeklyHours.toFixed(1)} ${lang === 'zh' ? '小時/週' : 'hrs/wk'} · ${manual.length} ${lang === 'zh' ? '個特定日期' : 'specific dates'}`
                      : (lang === 'zh' ? '尚未設定排程' : 'No availability set')}
                  </div>
                </div>

                {/* Status pill */}
                <span style={{
                  fontSize: '0.7rem', padding: '3px 10px', borderRadius: '999px',
                  background: hasAny ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.08)',
                  color: hasAny ? '#4ade80' : '#f87171',
                  flexShrink: 0,
                }}>
                  {hasAny ? (lang === 'zh' ? '已設定' : 'Active') : (lang === 'zh' ? '未設定' : 'Not set')}
                </span>

                <span style={{ color: '#64748b', fontSize: '1rem', transform: isOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}>
                  ▾
                </span>
              </button>

              {/* Expanded content */}
              {isOpen && (
                <div style={{
                  borderTop: '1px solid rgba(255,255,255,0.06)',
                  padding: '1.25rem 1.5rem',
                  background: 'rgba(255,255,255,0.02)',
                }}>
                  {!hasAny ? (
                    <p style={{ color: '#64748b', fontSize: '0.875rem', textAlign: 'center', padding: '1rem 0' }}>
                      {lang === 'zh' ? '此老師尚未設定任何可用時段。' : 'This teacher has not set any availability yet.'}
                    </p>
                  ) : (
                    <>
                      {/* Weekly Recurring */}
                      {recurring.length > 0 && (
                        <div style={{ marginBottom: manual.length > 0 ? '1.25rem' : 0 }}>
                          <div style={{ fontSize: '0.75rem', color: '#6366f1', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem' }}>
                            {lang === 'zh' ? '每週固定時段' : 'Weekly Recurring'}
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
                            {[1,2,3,4,5,6,0].map(dow => (
                              <div key={dow} style={{
                                background: weeklyMap[dow].length > 0 ? 'rgba(99,102,241,0.08)' : 'rgba(255,255,255,0.02)',
                                border: `1px solid ${weeklyMap[dow].length > 0 ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.05)'}`,
                                borderRadius: '10px',
                                padding: '8px',
                                minHeight: '60px',
                              }}>
                                <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 600, marginBottom: '4px' }}>
                                  {days[dow]}
                                </div>
                                {weeklyMap[dow].length === 0 ? (
                                  <div style={{ fontSize: '0.6rem', color: '#374151' }}>—</div>
                                ) : (
                                  weeklyMap[dow].map((s, i) => (
                                    <div key={i} style={{ fontSize: '0.62rem', color: '#818cf8', lineHeight: 1.6 }}>
                                      {s.start_time.slice(0,5)}–{s.end_time.slice(0,5)}
                                    </div>
                                  ))
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Manual / specific dates */}
                      {manual.length > 0 && (
                        <div>
                          <div style={{ fontSize: '0.75rem', color: '#ec4899', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem' }}>
                            {lang === 'zh' ? '指定日期時段' : 'Specific Dates'}
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {/* Group by date */}
                            {Object.entries(
                              manual.reduce((acc, s) => {
                                if (!acc[s.date]) acc[s.date] = [];
                                acc[s.date].push(s);
                                return acc;
                              }, {})
                            ).map(([date, slots]) => (
                              <div key={date} style={{
                                background: 'rgba(236,72,153,0.06)',
                                border: '1px solid rgba(236,72,153,0.15)',
                                borderRadius: '10px',
                                padding: '8px 12px',
                              }}>
                                <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginBottom: '4px' }}>
                                  {new Date(date + 'T00:00:00').toLocaleDateString(lang === 'zh' ? 'zh-TW' : 'en-US', { month: 'short', day: 'numeric', weekday: 'short' })}
                                </div>
                                {slots.map((s, i) => (
                                  <div key={i} style={{ fontSize: '0.72rem', color: '#f472b6' }}>
                                    {s.start_time.slice(0,5)}–{s.end_time.slice(0,5)}
                                  </div>
                                ))}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
