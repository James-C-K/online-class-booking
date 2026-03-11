'use client';

import { useState } from 'react';
import { useLang } from '@/lib/LanguageContext';

const DAYS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAYS_ZH = ['日', '一', '二', '三', '四', '五', '六'];
const DAYS_FULL_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAYS_FULL_ZH = ['週日', '週一', '週二', '週三', '週四', '週五', '週六'];

const timeInputStyle = {
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '8px',
  padding: '5px 10px',
  color: '#f8fafc',
  fontSize: '0.85rem',
  colorScheme: 'dark',
};

// ─── Weekly Recurring Tab ───────────────────────────────────────────────────

function WeeklyTab({ initialSlots }) {
  const { t, lang } = useLang();
  const days = lang === 'zh' ? DAYS_FULL_ZH : DAYS_FULL_EN;

  const [slots, setSlots] = useState(() => {
    const map = {};
    for (let i = 0; i < 7; i++) map[i] = [];
    initialSlots.forEach(s => {
      map[s.day_of_week].push({ start_time: s.start_time, end_time: s.end_time });
    });
    return map;
  });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, isError = false) => {
    setToast({ msg, isError });
    setTimeout(() => setToast(null), 3000);
  };

  const addSlot = (day) => setSlots(p => ({ ...p, [day]: [...p[day], { start_time: '09:00', end_time: '10:00' }] }));
  const removeSlot = (day, idx) => setSlots(p => ({ ...p, [day]: p[day].filter((_, i) => i !== idx) }));
  const updateSlot = (day, idx, field, val) => setSlots(p => ({
    ...p,
    [day]: p[day].map((s, i) => i === idx ? { ...s, [field]: val } : s),
  }));

  const handleSave = async () => {
    setSaving(true);
    const allSlots = [];
    for (let day = 0; day < 7; day++) {
      slots[day].forEach(s => {
        if (s.start_time && s.end_time && s.start_time < s.end_time) {
          allSlots.push({ day_of_week: day, start_time: s.start_time, end_time: s.end_time });
        }
      });
    }
    try {
      const res = await fetch('/api/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'recurring', slots: allSlots }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      showToast(t.availSaved);
    } catch (e) {
      showToast(e.message, true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
          {lang === 'zh' ? '設定每週固定可預約時段，學生每週均可預約。' : 'Set recurring weekly slots — students can book any week.'}
        </p>
        <button className="submit-btn" onClick={handleSave} disabled={saving}
          style={{ width: 'auto', padding: '10px 28px', marginTop: 0 }}>
          {saving ? t.saving : t.saveSchedule}
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {[1, 2, 3, 4, 5, 6, 0].map(day => (
          <div key={day} style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '14px',
            padding: '1rem 1.25rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 600, color: '#f8fafc', fontSize: '0.9rem', minWidth: '72px', paddingTop: '4px' }}>
                {days[day]}
              </span>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flex: 1, flexWrap: 'wrap' }}>
                {slots[day].map((s, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <input type="time" value={s.start_time}
                      onChange={e => updateSlot(day, idx, 'start_time', e.target.value)}
                      style={timeInputStyle} />
                    <span style={{ color: '#64748b', fontSize: '0.8rem' }}>→</span>
                    <input type="time" value={s.end_time}
                      onChange={e => updateSlot(day, idx, 'end_time', e.target.value)}
                      style={timeInputStyle} />
                    <button onClick={() => removeSlot(day, idx)} style={{
                      width: '24px', height: '24px', borderRadius: '50%',
                      border: '1px solid rgba(239,68,68,0.3)',
                      background: 'rgba(239,68,68,0.1)',
                      color: '#f87171', cursor: 'pointer', fontSize: '0.75rem',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>✕</button>
                  </div>
                ))}
                <button onClick={() => addSlot(day)} style={{
                  padding: '5px 14px', borderRadius: '8px',
                  border: '1px dashed rgba(99,102,241,0.4)',
                  background: 'rgba(99,102,241,0.08)',
                  color: '#818cf8', cursor: 'pointer', fontSize: '0.8rem',
                }}>
                  + {t.addSlot}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {toast && <div className={`toast ${toast.isError ? 'toast-error' : 'toast-success'}`}>{toast.msg}</div>}
    </div>
  );
}

// ─── Monthly Schedule Tab ────────────────────────────────────────────────────

function MonthlyTab({ initialManual }) {
  const { t, lang } = useLang();
  const days = lang === 'zh' ? DAYS_ZH : DAYS_EN;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth()); // 0-indexed
  const [selectedDate, setSelectedDate] = useState(null);
  const [toast, setToast] = useState(null);

  // manualMap: { 'YYYY-MM-DD': [{ start_time, end_time }] }
  const [manualMap, setManualMap] = useState(() => {
    const map = {};
    initialManual.forEach(s => {
      if (!map[s.date]) map[s.date] = [];
      map[s.date].push({ start_time: s.start_time, end_time: s.end_time });
    });
    return map;
  });

  const showToast = (msg, isError = false) => {
    setToast({ msg, isError });
    setTimeout(() => setToast(null), 3000);
  };

  // Build calendar grid
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDow = firstDay.getDay(); // 0=Sun

  const cells = [];
  // leading blanks
  for (let i = 0; i < startDow; i++) {
    const d = new Date(year, month, 1 - (startDow - i));
    cells.push({ date: d, inMonth: false });
  }
  for (let d = 1; d <= lastDay.getDate(); d++) {
    cells.push({ date: new Date(year, month, d), inMonth: true });
  }
  // trailing to fill last row
  const trailing = 7 - (cells.length % 7);
  if (trailing < 7) {
    for (let i = 1; i <= trailing; i++) {
      cells.push({ date: new Date(year, month + 1, i), inMonth: false });
    }
  }

  const fmt = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const isPast = (d) => d < today;

  const slotsForSelected = selectedDate ? (manualMap[selectedDate] || []) : [];

  const addSlot = () => {
    if (!selectedDate) return;
    setManualMap(p => ({ ...p, [selectedDate]: [...(p[selectedDate] || []), { start_time: '09:00', end_time: '10:00' }] }));
  };

  const removeSlot = (idx) => {
    setManualMap(p => ({ ...p, [selectedDate]: p[selectedDate].filter((_, i) => i !== idx) }));
  };

  const updateSlot = (idx, field, val) => {
    setManualMap(p => ({
      ...p,
      [selectedDate]: p[selectedDate].map((s, i) => i === idx ? { ...s, [field]: val } : s),
    }));
  };

  const clearDay = () => {
    if (!selectedDate) return;
    setManualMap(p => { const n = { ...p }; delete n[selectedDate]; return n; });
  };

  const saveDay = async () => {
    if (!selectedDate) return;
    const slots = (manualMap[selectedDate] || []).filter(s => s.start_time && s.end_time && s.start_time < s.end_time);
    try {
      const res = await fetch('/api/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'manual', date: selectedDate, slots }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      showToast(t.availSaved);
    } catch (e) {
      showToast(e.message, true);
    }
  };

  const monthLabel = new Date(year, month, 1).toLocaleDateString(lang === 'zh' ? 'zh-TW' : 'en-US', { year: 'numeric', month: 'long' });

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1);
    setSelectedDate(null);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1);
    setSelectedDate(null);
  };

  return (
    <div>
      <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
        {t.availMonthlySubtitle}
      </p>

      {/* Month navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <button onClick={prevMonth} style={navBtnStyle}>‹</button>
        <span style={{ fontWeight: 600, color: '#f8fafc', fontSize: '1rem' }}>{monthLabel}</span>
        <button onClick={nextMonth} style={navBtnStyle}>›</button>
      </div>

      {/* Day-of-week headers */}
      <div className="cal-grid" style={{ marginBottom: '4px' }}>
        {days.map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: '0.75rem', color: '#64748b', fontWeight: 600, padding: '4px 0' }}>
            {d}
          </div>
        ))}
      </div>

      {/* Calendar cells */}
      <div className="cal-grid" style={{ marginBottom: '1.5rem' }}>
        {cells.map(({ date, inMonth }, i) => {
          const key = fmt(date);
          const isToday = fmt(date) === fmt(today);
          const isSelected = key === selectedDate;
          const hasSlots = !!(manualMap[key]?.length);
          const past = isPast(date);

          return (
            <div
              key={i}
              onClick={() => {
                if (!inMonth) return;
                setSelectedDate(isSelected ? null : key);
              }}
              className={`cal-day${isToday ? ' today' : ''}${isSelected ? ' selected' : ''}${!inMonth ? ' other-month' : ''}${hasSlots ? ' has-sessions' : ''}`}
              style={{
                cursor: inMonth ? (past ? 'not-allowed' : 'pointer') : 'default',
                opacity: !inMonth ? 0.25 : past ? 0.45 : 1,
                minHeight: '52px',
                background: isSelected ? 'rgba(99,102,241,0.15)' : hasSlots ? 'rgba(34,197,94,0.06)' : 'rgba(255,255,255,0.02)',
                border: isSelected ? '1px solid rgba(99,102,241,0.5)' : hasSlots ? '1px solid rgba(34,197,94,0.25)' : '1px solid transparent',
              }}
            >
              <span className="cal-day-num">{date.getDate()}</span>
              {hasSlots && (
                <span style={{ fontSize: '0.6rem', color: '#4ade80', marginTop: '2px' }}>
                  {manualMap[key].length} {lang === 'zh' ? '段' : 'slot' + (manualMap[key].length > 1 ? 's' : '')}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Slot editor for selected date */}
      {selectedDate && (
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(99,102,241,0.3)',
          borderRadius: '16px',
          padding: '1.25rem 1.5rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <div style={{ fontWeight: 600, color: '#f8fafc', fontSize: '0.95rem' }}>
                {new Date(selectedDate + 'T00:00:00').toLocaleDateString(lang === 'zh' ? 'zh-TW' : 'en-US', {
                  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                })}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
                {lang === 'zh' ? '設定當天特定可預約時段' : 'Set specific available slots for this day'}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {slotsForSelected.length > 0 && (
                <button onClick={clearDay} style={{
                  padding: '7px 14px', borderRadius: '9px', fontSize: '0.8rem',
                  border: '1px solid rgba(239,68,68,0.3)',
                  background: 'rgba(239,68,68,0.08)', color: '#f87171', cursor: 'pointer',
                }}>
                  {t.clearDay}
                </button>
              )}
              <button className="submit-btn" onClick={saveDay}
                style={{ width: 'auto', padding: '7px 20px', marginTop: 0, fontSize: '0.875rem' }}>
                {t.saveSchedule}
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {slotsForSelected.map((s, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <input type="time" value={s.start_time}
                  onChange={e => updateSlot(idx, 'start_time', e.target.value)}
                  style={timeInputStyle} />
                <span style={{ color: '#64748b', fontSize: '0.8rem' }}>→</span>
                <input type="time" value={s.end_time}
                  onChange={e => updateSlot(idx, 'end_time', e.target.value)}
                  style={timeInputStyle} />
                <button onClick={() => removeSlot(idx)} style={{
                  width: '24px', height: '24px', borderRadius: '50%',
                  border: '1px solid rgba(239,68,68,0.3)',
                  background: 'rgba(239,68,68,0.1)',
                  color: '#f87171', cursor: 'pointer', fontSize: '0.75rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>✕</button>
              </div>
            ))}
            <button onClick={addSlot} style={{
              padding: '7px 18px', borderRadius: '9px', width: 'fit-content',
              border: '1px dashed rgba(99,102,241,0.4)',
              background: 'rgba(99,102,241,0.08)',
              color: '#818cf8', cursor: 'pointer', fontSize: '0.85rem', marginTop: '4px',
            }}>
              + {t.addSlot}
            </button>
          </div>
        </div>
      )}

      {!selectedDate && (
        <div style={{
          textAlign: 'center', padding: '2rem',
          color: '#475569', fontSize: '0.875rem',
          border: '1px dashed rgba(255,255,255,0.07)',
          borderRadius: '14px',
        }}>
          {lang === 'zh' ? '👆 點擊日期以編輯時段' : '👆 Click a date to edit its time slots'}
        </div>
      )}

      {toast && <div className={`toast ${toast.isError ? 'toast-error' : 'toast-success'}`}>{toast.msg}</div>}
    </div>
  );
}

const navBtnStyle = {
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '10px',
  color: '#f8fafc',
  cursor: 'pointer',
  fontSize: '1.25rem',
  padding: '4px 14px',
  lineHeight: 1.5,
};

// ─── Main Component ──────────────────────────────────────────────────────────

export default function AvailabilityClient({ initialRecurring, initialManual }) {
  const { t, lang } = useLang();
  const [tab, setTab] = useState('weekly');

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{
          fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.25rem',
          background: 'linear-gradient(to right, #fff, #94a3b8)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>
          {t.myAvailability}
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
          {lang === 'zh' ? '管理您的可預約時段' : 'Manage your bookable time slots'}
        </p>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex', gap: '4px', marginBottom: '1.75rem',
        background: 'rgba(255,255,255,0.03)', padding: '4px',
        borderRadius: '12px', width: 'fit-content',
        border: '1px solid rgba(255,255,255,0.08)',
      }}>
        {[
          { val: 'weekly',  en: t.weeklyRecurring,  zh: t.weeklyRecurring },
          { val: 'monthly', en: t.monthlySchedule,  zh: t.monthlySchedule },
        ].map(tb => (
          <button key={tb.val} onClick={() => setTab(tb.val)} style={{
            padding: '7px 20px', borderRadius: '9px', fontSize: '0.85rem', fontWeight: 500,
            border: 'none', cursor: 'pointer', transition: 'all 0.2s',
            background: tab === tb.val ? 'linear-gradient(135deg, #6366f1, #ec4899)' : 'transparent',
            color: tab === tb.val ? '#fff' : '#94a3b8',
          }}>
            {lang === 'zh' ? tb.zh : tb.en}
          </button>
        ))}
      </div>

      {tab === 'weekly'
        ? <WeeklyTab initialSlots={initialRecurring} />
        : <MonthlyTab initialManual={initialManual} />
      }
    </div>
  );
}
