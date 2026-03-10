'use client';

import { useState } from 'react';
import { useLang } from '@/lib/LanguageContext';

const DAYS_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAYS_ZH = ['週日', '週一', '週二', '週三', '週四', '週五', '週六'];

export default function AvailabilityClient({ initialSlots }) {
  const { t, lang } = useLang();
  const days = lang === 'zh' ? DAYS_ZH : DAYS_EN;

  // slots: { [dayIndex]: [{ start_time, end_time }] }
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

  const addSlot = (day) => {
    setSlots(prev => ({
      ...prev,
      [day]: [...prev[day], { start_time: '09:00', end_time: '10:00' }],
    }));
  };

  const removeSlot = (day, idx) => {
    setSlots(prev => ({
      ...prev,
      [day]: prev[day].filter((_, i) => i !== idx),
    }));
  };

  const updateSlot = (day, idx, field, value) => {
    setSlots(prev => ({
      ...prev,
      [day]: prev[day].map((s, i) => i === idx ? { ...s, [field]: value } : s),
    }));
  };

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
        body: JSON.stringify({ slots: allSlots }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      showToast(lang === 'zh' ? '排程已儲存！' : 'Availability saved!');
    } catch (e) {
      showToast(e.message, true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{
            fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.25rem',
            background: 'linear-gradient(to right, #fff, #94a3b8)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            {t.myAvailability}
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
            {lang === 'zh' ? '設定每週可預約的時段' : 'Set your weekly available time slots'}
          </p>
        </div>
        <button
          className="submit-btn"
          onClick={handleSave}
          disabled={saving}
          style={{ width: 'auto', padding: '10px 28px', marginTop: 0 }}
        >
          {saving ? (lang === 'zh' ? '儲存中...' : 'Saving...') : (lang === 'zh' ? '儲存排程' : 'Save Schedule')}
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {[1, 2, 3, 4, 5, 6, 0].map(day => (
          <div key={day} style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '16px',
            padding: '1.25rem 1.5rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: slots[day].length ? '1rem' : 0 }}>
              <span style={{ fontWeight: 600, color: '#f8fafc', fontSize: '0.95rem', minWidth: '100px' }}>
                {days[day]}
              </span>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flex: 1, flexWrap: 'wrap' }}>
                {slots[day].map((s, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <input
                      type="time"
                      value={s.start_time}
                      onChange={e => updateSlot(day, idx, 'start_time', e.target.value)}
                      style={timeInputStyle}
                    />
                    <span style={{ color: '#64748b', fontSize: '0.8rem' }}>→</span>
                    <input
                      type="time"
                      value={s.end_time}
                      onChange={e => updateSlot(day, idx, 'end_time', e.target.value)}
                      style={timeInputStyle}
                    />
                    <button
                      onClick={() => removeSlot(day, idx)}
                      style={{
                        width: '24px', height: '24px', borderRadius: '50%',
                        border: '1px solid rgba(239,68,68,0.3)',
                        background: 'rgba(239,68,68,0.1)',
                        color: '#f87171', cursor: 'pointer', fontSize: '0.75rem',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >✕</button>
                  </div>
                ))}
                <button
                  onClick={() => addSlot(day)}
                  style={{
                    padding: '5px 14px', borderRadius: '8px',
                    border: '1px dashed rgba(99,102,241,0.4)',
                    background: 'rgba(99,102,241,0.08)',
                    color: '#818cf8', cursor: 'pointer', fontSize: '0.8rem',
                    transition: 'all 0.2s',
                  }}
                >
                  + {lang === 'zh' ? '新增時段' : 'Add slot'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {toast && (
        <div className={`toast ${toast.isError ? 'toast-error' : 'toast-success'}`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}

const timeInputStyle = {
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '8px',
  padding: '5px 10px',
  color: '#f8fafc',
  fontSize: '0.85rem',
  colorScheme: 'dark',
};
