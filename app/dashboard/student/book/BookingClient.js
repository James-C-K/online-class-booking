'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLang } from '@/lib/LanguageContext';

const DAYS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAYS_ZH = ['日', '一', '二', '三', '四', '五', '六'];

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

// ─── 1-on-1 Booking Wizard ───────────────────────────────────────────────────

function OneOnOneTab({ instructors }) {
  const { t, lang } = useLang();
  const router = useRouter();
  const days = lang === 'zh' ? DAYS_ZH : DAYS_EN;

  const [step, setStep] = useState(1);
  const [selected, setSelected] = useState({ instructor: null, date: null, slot: null });
  const [availability, setAvailability] = useState([]);
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, isError = false) => {
    setToast({ msg, isError });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    if (selected.instructor) {
      setLoading(true);
      fetch(`/api/availability?instructor_id=${selected.instructor.id}`)
        .then(r => r.json())
        .then(data => { setAvailability(data); setLoading(false); });
    }
  }, [selected.instructor]);

  const next14 = Array.from({ length: 14 }, (_, i) => addDays(new Date(), i));

  const getSlotsForDate = (date) => {
    const dow = date.getDay();
    const dateStr = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
    const manual = availability.filter(a => a.type === 'manual' && a.date === dateStr);
    if (manual.length > 0) return manual;
    return availability.filter(a => a.type === 'recurring' && a.day_of_week === dow);
  };

  const handleBook = async () => {
    if (!selected.instructor || !selected.date || !selected.slot) return;
    setBooking(true);
    const dateStr = selected.date.toISOString().split('T')[0];
    const start = new Date(`${dateStr}T${selected.slot.start_time}`).toISOString();
    const end = new Date(`${dateStr}T${selected.slot.end_time}`).toISOString();
    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instructor_id: selected.instructor.id,
          subject_id: null,
          start_time: start, end_time: end,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast(lang === 'zh' ? '課程預約成功！' : 'Session booked successfully!');
      setTimeout(() => router.push('/dashboard/student/sessions'), 1500);
    } catch (e) {
      showToast(e.message, true);
    } finally {
      setBooking(false);
    }
  };

  if (instructors.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👤</div>
        <h2 style={{ color: '#f8fafc', marginBottom: '0.5rem' }}>
          {lang === 'zh' ? '尚未指派老師' : 'No Instructors Assigned'}
        </h2>
        <p style={{ color: '#94a3b8' }}>
          {lang === 'zh' ? '請聯繫管理員，為您指派老師後即可預約課程。' : 'Contact your admin to get instructors assigned.'}
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Step indicators */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        {[1, 2, 3].map(s => (
          <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{
              width: '28px', height: '28px', borderRadius: '50%', display: 'flex',
              alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700,
              background: step >= s ? 'linear-gradient(135deg, #6366f1, #ec4899)' : 'rgba(255,255,255,0.08)',
              color: step >= s ? '#fff' : '#64748b',
            }}>{s}</div>
            {s < 3 && <div style={{ width: '40px', height: '2px', background: step > s ? 'linear-gradient(to right, #6366f1, #ec4899)' : 'rgba(255,255,255,0.08)' }} />}
          </div>
        ))}
      </div>

      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '1.75rem' }}>

        {/* Step 1 */}
        {step === 1 && (
          <div>
            <h2 style={{ color: '#f8fafc', fontWeight: 600, marginBottom: '1.25rem', fontSize: '1rem' }}>
              {lang === 'zh' ? '選擇老師' : 'Select Instructor'}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '1.5rem' }}>
              {instructors.map(inst => (
                <button key={inst.id} onClick={() => setSelected(p => ({ ...p, instructor: inst }))} style={{
                  padding: '12px 16px', borderRadius: '12px', textAlign: 'left',
                  border: selected.instructor?.id === inst.id ? '1px solid rgba(99,102,241,0.5)' : '1px solid rgba(255,255,255,0.08)',
                  background: selected.instructor?.id === inst.id ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.03)',
                  color: '#f8fafc', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 500,
                  display: 'flex', alignItems: 'center', gap: '10px',
                }}>
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                    background: 'linear-gradient(135deg, #6366f1, #ec4899)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.8rem', fontWeight: 700, color: '#fff',
                  }}>{inst.full_name?.[0]}</div>
                  {inst.full_name}
                </button>
              ))}
            </div>
            <button className="submit-btn" disabled={!selected.instructor} onClick={() => setStep(2)} style={{ marginTop: 0 }}>
              {lang === 'zh' ? '下一步' : 'Next'} →
            </button>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div>
            <h2 style={{ color: '#f8fafc', fontWeight: 600, marginBottom: '1.25rem', fontSize: '1rem' }}>
              {lang === 'zh' ? '選擇日期與時段' : 'Pick a Date & Time'}
            </h2>
            {loading ? (
              <p style={{ color: '#94a3b8', textAlign: 'center', padding: '2rem' }}>
                {lang === 'zh' ? '載入中...' : 'Loading...'}
              </p>
            ) : (
              <>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                  {next14.map((date, i) => {
                    const slots = getSlotsForDate(date);
                    const hasSlots = slots.length > 0;
                    const isSel = selected.date?.toDateString() === date.toDateString();
                    return (
                      <button key={i} onClick={() => hasSlots && setSelected(p => ({ ...p, date, slot: null }))} style={{
                        padding: '8px 10px', borderRadius: '10px', minWidth: '52px', textAlign: 'center',
                        border: isSel ? '1px solid rgba(99,102,241,0.5)' : '1px solid rgba(255,255,255,0.08)',
                        background: isSel ? 'rgba(99,102,241,0.2)' : hasSlots ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.01)',
                        color: isSel ? '#c7d2fe' : hasSlots ? '#f8fafc' : '#374151',
                        cursor: hasSlots ? 'pointer' : 'not-allowed',
                      }}>
                        <div style={{ fontSize: '0.65rem', color: isSel ? '#a5b4fc' : '#64748b' }}>{days[date.getDay()]}</div>
                        <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{date.getDate()}</div>
                      </button>
                    );
                  })}
                </div>
                {selected.date && (
                  <div>
                    <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.75rem' }}>
                      {lang === 'zh' ? '可用時段：' : 'Available slots:'}
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {getSlotsForDate(selected.date).map((slot, i) => {
                        const isSel = selected.slot === slot;
                        return (
                          <button key={i} onClick={() => setSelected(p => ({ ...p, slot }))} style={{
                            padding: '8px 16px', borderRadius: '10px', fontSize: '0.875rem',
                            border: isSel ? '1px solid rgba(99,102,241,0.5)' : '1px solid rgba(255,255,255,0.1)',
                            background: isSel ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.04)',
                            color: isSel ? '#c7d2fe' : '#94a3b8', cursor: 'pointer',
                          }}>
                            {slot.start_time.slice(0, 5)} – {slot.end_time.slice(0, 5)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button onClick={() => setStep(1)} style={{
                padding: '10px 20px', borderRadius: '12px', fontSize: '0.9rem',
                border: '1px solid rgba(255,255,255,0.1)', background: 'transparent',
                color: '#94a3b8', cursor: 'pointer',
              }}>← {lang === 'zh' ? '上一步' : 'Back'}</button>
              <button className="submit-btn" disabled={!selected.date || !selected.slot}
                onClick={() => setStep(3)} style={{ marginTop: 0, flex: 1 }}>
                {lang === 'zh' ? '下一步' : 'Next'} →
              </button>
            </div>
          </div>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <div>
            <h2 style={{ color: '#f8fafc', fontWeight: 600, marginBottom: '1.5rem', fontSize: '1rem' }}>
              {lang === 'zh' ? '確認預約' : 'Confirm Booking'}
            </h2>
            {[
              { label: lang === 'zh' ? '老師' : 'Instructor', value: selected.instructor?.full_name },
              { label: lang === 'zh' ? '日期' : 'Date', value: selected.date?.toLocaleDateString(lang === 'zh' ? 'zh-TW' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) },
              { label: lang === 'zh' ? '時段' : 'Time', value: selected.slot ? `${selected.slot.start_time.slice(0, 5)} – ${selected.slot.end_time.slice(0, 5)}` : '—' },
            ].map(row => (
              <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ fontSize: '0.875rem', color: '#94a3b8' }}>{row.label}</span>
                <span style={{ fontSize: '0.875rem', color: '#f8fafc', fontWeight: 500 }}>{row.value}</span>
              </div>
            ))}
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button onClick={() => setStep(2)} style={{
                padding: '10px 20px', borderRadius: '12px', fontSize: '0.9rem',
                border: '1px solid rgba(255,255,255,0.1)', background: 'transparent',
                color: '#94a3b8', cursor: 'pointer',
              }}>← {lang === 'zh' ? '上一步' : 'Back'}</button>
              <button className="submit-btn" onClick={handleBook} disabled={booking} style={{ marginTop: 0, flex: 1 }}>
                {booking ? (lang === 'zh' ? '預約中...' : 'Booking...') : (lang === 'zh' ? '確認預約' : 'Confirm Booking')}
              </button>
            </div>
          </div>
        )}
      </div>

      {toast && <div className={`toast ${toast.isError ? 'toast-error' : 'toast-success'}`}>{toast.msg}</div>}
    </div>
  );
}

// ─── Group Sessions Tab ───────────────────────────────────────────────────────

function GroupSessionsTab({ groupSessions }) {
  const { lang } = useLang();
  const router = useRouter();
  const [joining, setJoining] = useState(null);
  const [toast, setToast] = useState(null);
  const [local, setLocal] = useState(groupSessions);

  const showToast = (msg, isError = false) => {
    setToast({ msg, isError });
    setTimeout(() => setToast(null), 4000);
  };

  const handleJoin = async (id) => {
    setJoining(id);
    try {
      const res = await fetch(`/api/sessions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'join' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setLocal(prev => prev.map(s => s.id === id ? { ...s, hasJoined: true, enrolled: s.enrolled + 1 } : s));
      showToast(lang === 'zh' ? '成功加入課程！' : 'Joined successfully!');
    } catch (e) {
      showToast(e.message, true);
    } finally {
      setJoining(null);
    }
  };

  if (local.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👥</div>
        <h2 style={{ color: '#f8fafc', marginBottom: '0.5rem' }}>
          {lang === 'zh' ? '目前沒有可用的團體課程' : 'No Group Sessions Available'}
        </h2>
        <p style={{ color: '#94a3b8' }}>
          {lang === 'zh' ? '請稍後再查看，老師會陸續開放團體課程。' : 'Check back later — instructors will post group sessions here.'}
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {local.map(s => {
        const start = new Date(s.start_time);
        const end = new Date(s.end_time);
        const subject = lang === 'zh' ? s.subject?.name_zh : s.subject?.name_en;
        const spotsLeft = s.capacity - s.enrolled;

        return (
          <div key={s.id} style={{
            background: 'rgba(255,255,255,0.03)',
            border: `1px solid ${s.hasJoined ? 'rgba(34,197,94,0.3)' : s.isFull ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.08)'}`,
            borderRadius: '16px',
            padding: '1.25rem 1.5rem',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap',
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 600, color: '#f8fafc', fontSize: '0.95rem' }}>
                  {subject || (lang === 'zh' ? '未指定科目' : 'No subject')}
                </span>
                <span style={{
                  fontSize: '0.7rem', padding: '2px 8px', borderRadius: '999px',
                  background: s.hasJoined ? 'rgba(34,197,94,0.15)' : s.isFull ? 'rgba(239,68,68,0.1)' : 'rgba(99,102,241,0.1)',
                  color: s.hasJoined ? '#4ade80' : s.isFull ? '#f87171' : '#818cf8',
                }}>
                  {s.hasJoined ? (lang === 'zh' ? '已加入' : 'Joined') : s.isFull ? (lang === 'zh' ? '已滿' : 'Full') : `${spotsLeft} ${lang === 'zh' ? '個空位' : 'spots left'}`}
                </span>
              </div>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                {lang === 'zh' ? '老師：' : 'Instructor: '}{s.instructor?.full_name}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
                {start.toLocaleDateString(lang === 'zh' ? 'zh-TW' : 'en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                {' · '}
                {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                {' – '}
                {end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
              {/* Capacity bar */}
              <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ flex: 1, height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: '2px',
                    width: `${Math.min(100, (s.enrolled / s.capacity) * 100)}%`,
                    background: s.isFull ? '#ef4444' : 'linear-gradient(to right, #6366f1, #ec4899)',
                    transition: 'width 0.4s',
                  }} />
                </div>
                <span style={{ fontSize: '0.7rem', color: '#64748b', whiteSpace: 'nowrap' }}>
                  {s.enrolled}/{s.capacity}
                </span>
              </div>
            </div>

            <button
              onClick={() => !s.hasJoined && !s.isFull && handleJoin(s.id)}
              disabled={s.hasJoined || s.isFull || joining === s.id}
              style={{
                padding: '9px 20px', borderRadius: '10px', fontSize: '0.875rem', fontWeight: 600,
                border: 'none', cursor: s.hasJoined || s.isFull ? 'default' : 'pointer',
                background: s.hasJoined ? 'rgba(34,197,94,0.15)' : s.isFull ? 'rgba(239,68,68,0.1)' : 'linear-gradient(135deg, #6366f1, #ec4899)',
                color: s.hasJoined ? '#4ade80' : s.isFull ? '#f87171' : '#fff',
                opacity: joining === s.id ? 0.7 : 1,
                flexShrink: 0,
              }}
            >
              {joining === s.id
                ? (lang === 'zh' ? '加入中...' : 'Joining...')
                : s.hasJoined
                  ? (lang === 'zh' ? '✓ 已加入' : '✓ Joined')
                  : s.isFull
                    ? (lang === 'zh' ? '已滿' : 'Full')
                    : (lang === 'zh' ? '加入課程' : 'Join')}
            </button>
          </div>
        );
      })}

      {toast && <div className={`toast ${toast.isError ? 'toast-error' : 'toast-success'}`}>{toast.msg}</div>}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function BookingClient({ instructors, groupSessions }) {
  const { lang } = useLang();
  const [tab, setTab] = useState('1on1');

  return (
    <div style={{ maxWidth: '680px' }}>
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{
          fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.25rem',
          background: 'linear-gradient(to right, #fff, #94a3b8)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>
          {lang === 'zh' ? '預約課程' : 'Book a Session'}
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
          {lang === 'zh' ? '選擇一對一或團體課程' : 'Choose 1-on-1 or join a group session'}
        </p>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex', gap: '4px', marginBottom: '1.5rem',
        background: 'rgba(255,255,255,0.03)', padding: '4px',
        borderRadius: '12px', width: 'fit-content',
        border: '1px solid rgba(255,255,255,0.08)',
      }}>
        {[
          { val: '1on1',  label_zh: '一對一課程', label_en: '1-on-1' },
          { val: 'group', label_zh: `團體課程${groupSessions?.length ? ` (${groupSessions.length})` : ''}`, label_en: `Group${groupSessions?.length ? ` (${groupSessions.length})` : ''}` },
        ].map(tb => (
          <button key={tb.val} onClick={() => setTab(tb.val)} style={{
            padding: '7px 20px', borderRadius: '9px', fontSize: '0.85rem', fontWeight: 500,
            border: 'none', cursor: 'pointer', transition: 'all 0.2s',
            background: tab === tb.val ? 'linear-gradient(135deg, #6366f1, #ec4899)' : 'transparent',
            color: tab === tb.val ? '#fff' : '#94a3b8',
          }}>
            {lang === 'zh' ? tb.label_zh : tb.label_en}
          </button>
        ))}
      </div>

      {tab === '1on1'
        ? <OneOnOneTab instructors={instructors} />
        : <GroupSessionsTab groupSessions={groupSessions || []} />
      }
    </div>
  );
}
