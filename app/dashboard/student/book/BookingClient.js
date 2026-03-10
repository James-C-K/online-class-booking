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

function getNext14Days() {
  const days = [];
  const today = new Date();
  for (let i = 0; i < 14; i++) days.push(addDays(today, i));
  return days;
}

export default function BookingClient({ instructors, subjects }) {
  const { t, lang } = useLang();
  const router = useRouter();
  const days = lang === 'zh' ? DAYS_ZH : DAYS_EN;

  const [step, setStep] = useState(1); // 1: pick instructor+subject, 2: pick slot, 3: confirm
  const [selected, setSelected] = useState({ instructor: null, subject: null, date: null, slot: null });
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

  const next14 = getNext14Days();

  // Get slots for a given date based on recurring availability
  const getSlotsForDate = (date) => {
    const dow = date.getDay();
    return availability.filter(a => a.day_of_week === dow);
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
          subject_id: selected.subject?.id || null,
          start_time: start,
          end_time: end,
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
          {lang === 'zh' ? '請聯繫管理員，為您指派老師後即可預約課程。' : 'Contact your admin to get instructors assigned to you.'}
        </p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '680px' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{
          fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.25rem',
          background: 'linear-gradient(to right, #fff, #94a3b8)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>
          {t.bookSession}
        </h1>
        {/* Steps */}
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
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
      </div>

      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '1.75rem' }}>

        {/* Step 1: Instructor + Subject */}
        {step === 1 && (
          <div>
            <h2 style={{ color: '#f8fafc', fontWeight: 600, marginBottom: '1.25rem', fontSize: '1rem' }}>
              {lang === 'zh' ? '選擇老師與科目' : 'Select Instructor & Subject'}
            </h2>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.5rem' }}>
                {lang === 'zh' ? '老師' : 'Instructor'}
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.5rem' }}>
                {lang === 'zh' ? '科目（選填）' : 'Subject (optional)'}
              </label>
              <select
                className="glass-select"
                value={selected.subject?.id || ''}
                onChange={e => {
                  const subj = subjects.find(s => s.id === e.target.value) || null;
                  setSelected(p => ({ ...p, subject: subj }));
                }}
              >
                <option value="">{lang === 'zh' ? '-- 不指定 --' : '-- No preference --'}</option>
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>{lang === 'zh' ? s.name_zh : s.name_en}</option>
                ))}
              </select>
            </div>

            <button
              className="submit-btn"
              disabled={!selected.instructor}
              onClick={() => setStep(2)}
              style={{ marginTop: 0 }}
            >
              {lang === 'zh' ? '下一步' : 'Next'} →
            </button>
          </div>
        )}

        {/* Step 2: Pick date + time slot */}
        {step === 2 && (
          <div>
            <h2 style={{ color: '#f8fafc', fontWeight: 600, marginBottom: '1.25rem', fontSize: '1rem' }}>
              {lang === 'zh' ? '選擇日期與時段' : 'Pick a Date & Time'}
            </h2>

            {loading ? (
              <p style={{ color: '#94a3b8', textAlign: 'center', padding: '2rem' }}>
                {lang === 'zh' ? '載入中...' : 'Loading availability...'}
              </p>
            ) : (
              <>
                {/* Date picker */}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                  {next14.map((date, i) => {
                    const slots = getSlotsForDate(date);
                    const hasSlots = slots.length > 0;
                    const isSelected = selected.date?.toDateString() === date.toDateString();
                    return (
                      <button key={i} onClick={() => hasSlots && setSelected(p => ({ ...p, date, slot: null }))} style={{
                        padding: '8px 10px', borderRadius: '10px', minWidth: '52px', textAlign: 'center',
                        border: isSelected ? '1px solid rgba(99,102,241,0.5)' : '1px solid rgba(255,255,255,0.08)',
                        background: isSelected ? 'rgba(99,102,241,0.2)' : hasSlots ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.01)',
                        color: isSelected ? '#c7d2fe' : hasSlots ? '#f8fafc' : '#374151',
                        cursor: hasSlots ? 'pointer' : 'not-allowed',
                      }}>
                        <div style={{ fontSize: '0.65rem', color: isSelected ? '#a5b4fc' : '#64748b' }}>
                          {days[date.getDay()]}
                        </div>
                        <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{date.getDate()}</div>
                      </button>
                    );
                  })}
                </div>

                {/* Time slots */}
                {selected.date && (
                  <div>
                    <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.75rem' }}>
                      {lang === 'zh' ? '可用時段：' : 'Available slots:'}
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {getSlotsForDate(selected.date).map((slot, i) => {
                        const isSelected = selected.slot === slot;
                        return (
                          <button key={i} onClick={() => setSelected(p => ({ ...p, slot }))} style={{
                            padding: '8px 16px', borderRadius: '10px', fontSize: '0.875rem',
                            border: isSelected ? '1px solid rgba(99,102,241,0.5)' : '1px solid rgba(255,255,255,0.1)',
                            background: isSelected ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.04)',
                            color: isSelected ? '#c7d2fe' : '#94a3b8', cursor: 'pointer',
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
              <button
                className="submit-btn"
                disabled={!selected.date || !selected.slot}
                onClick={() => setStep(3)}
                style={{ marginTop: 0, flex: 1 }}
              >
                {lang === 'zh' ? '下一步' : 'Next'} →
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Confirm */}
        {step === 3 && (
          <div>
            <h2 style={{ color: '#f8fafc', fontWeight: 600, marginBottom: '1.5rem', fontSize: '1rem' }}>
              {lang === 'zh' ? '確認預約' : 'Confirm Booking'}
            </h2>

            {[
              { label: lang === 'zh' ? '老師' : 'Instructor', value: selected.instructor?.full_name },
              { label: lang === 'zh' ? '科目' : 'Subject', value: selected.subject ? (lang === 'zh' ? selected.subject.name_zh : selected.subject.name_en) : (lang === 'zh' ? '不指定' : 'No preference') },
              { label: lang === 'zh' ? '日期' : 'Date', value: selected.date?.toLocaleDateString(lang === 'zh' ? 'zh-TW' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) },
              { label: lang === 'zh' ? '時段' : 'Time', value: selected.slot ? `${selected.slot.start_time.slice(0, 5)} – ${selected.slot.end_time.slice(0, 5)}` : '—' },
            ].map(row => (
              <div key={row.label} style={{
                display: 'flex', justifyContent: 'space-between',
                padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.06)',
              }}>
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
              <button
                className="submit-btn"
                onClick={handleBook}
                disabled={booking}
                style={{ marginTop: 0, flex: 1 }}
              >
                {booking ? (lang === 'zh' ? '預約中...' : 'Booking...') : (lang === 'zh' ? '確認預約' : 'Confirm Booking')}
              </button>
            </div>
          </div>
        )}
      </div>

      {toast && (
        <div className={`toast ${toast.isError ? 'toast-error' : 'toast-success'}`}>{toast.msg}</div>
      )}
    </div>
  );
}
