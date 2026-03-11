'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLang } from '@/lib/LanguageContext';

export default function CreateSessionClient({ subjects }) {
  const { lang } = useLang();
  const router = useRouter();

  const [form, setForm] = useState({
    subject_id: '',
    date: '',
    start_time: '09:00',
    end_time: '10:00',
    capacity: 10,
    meeting_url: '',
  });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, isError = false) => {
    setToast({ msg, isError });
    setTimeout(() => setToast(null), 4000);
  };

  const set = (field, val) => setForm(p => ({ ...p, [field]: val }));

  const handleSubmit = async () => {
    if (!form.date || !form.start_time || !form.end_time) {
      showToast(lang === 'zh' ? '請填寫日期與時間' : 'Please fill in date and time', true);
      return;
    }
    if (form.start_time >= form.end_time) {
      showToast(lang === 'zh' ? '結束時間必須晚於開始時間' : 'End time must be after start time', true);
      return;
    }

    setSaving(true);
    const start = new Date(`${form.date}T${form.start_time}`).toISOString();
    const end = new Date(`${form.date}T${form.end_time}`).toISOString();

    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'group',
          subject_id: form.subject_id || null,
          start_time: start,
          end_time: end,
          capacity: Number(form.capacity) || 10,
          meeting_url: form.meeting_url || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast(lang === 'zh' ? '團體課程已建立！' : 'Group session created!');
      setTimeout(() => router.push('/dashboard/teacher/sessions'), 1500);
    } catch (e) {
      showToast(e.message, true);
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = {
    width: '100%', background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px',
    padding: '10px 14px', color: '#f8fafc', fontSize: '0.9rem',
    outline: 'none', colorScheme: 'dark',
  };
  const labelStyle = { display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '6px' };

  return (
    <div style={{ maxWidth: '560px' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{
          fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.25rem',
          background: 'linear-gradient(to right, #fff, #94a3b8)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>
          {lang === 'zh' ? '建立團體課程' : 'Create Group Session'}
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
          {lang === 'zh' ? '設定課程詳情，學生可報名加入' : 'Set session details — students can browse and join'}
        </p>
      </div>

      <div style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '16px',
        padding: '1.75rem',
        display: 'flex', flexDirection: 'column', gap: '1.25rem',
      }}>
        {/* Subject */}
        <div>
          <label style={labelStyle}>{lang === 'zh' ? '科目（選填）' : 'Subject (optional)'}</label>
          <select className="glass-select" value={form.subject_id} onChange={e => set('subject_id', e.target.value)}>
            <option value="">{lang === 'zh' ? '-- 不指定 --' : '-- No preference --'}</option>
            {subjects.map(s => (
              <option key={s.id} value={s.id}>{lang === 'zh' ? s.name_zh : s.name_en}</option>
            ))}
          </select>
        </div>

        {/* Date */}
        <div>
          <label style={labelStyle}>{lang === 'zh' ? '日期' : 'Date'}</label>
          <input type="date" value={form.date}
            min={new Date().toISOString().split('T')[0]}
            onChange={e => set('date', e.target.value)}
            style={inputStyle} />
        </div>

        {/* Time */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={labelStyle}>{lang === 'zh' ? '開始時間' : 'Start Time'}</label>
            <input type="time" value={form.start_time} onChange={e => set('start_time', e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>{lang === 'zh' ? '結束時間' : 'End Time'}</label>
            <input type="time" value={form.end_time} onChange={e => set('end_time', e.target.value)} style={inputStyle} />
          </div>
        </div>

        {/* Capacity */}
        <div>
          <label style={labelStyle}>{lang === 'zh' ? '容量上限' : 'Max Capacity'}</label>
          <input type="number" min={2} max={100} value={form.capacity}
            onChange={e => set('capacity', e.target.value)}
            style={{ ...inputStyle, width: '120px' }} />
        </div>

        {/* Meeting URL */}
        <div>
          <label style={labelStyle}>{lang === 'zh' ? '會議連結（選填）' : 'Meeting URL (optional)'}</label>
          <input type="url" value={form.meeting_url}
            placeholder="https://meet.google.com/..."
            onChange={e => set('meeting_url', e.target.value)}
            style={inputStyle} />
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
          <button onClick={() => router.back()} style={{
            padding: '11px 20px', borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.1)', background: 'transparent',
            color: '#94a3b8', cursor: 'pointer', fontSize: '0.9rem',
          }}>
            {lang === 'zh' ? '取消' : 'Cancel'}
          </button>
          <button className="submit-btn" onClick={handleSubmit} disabled={saving}
            style={{ marginTop: 0, flex: 1 }}>
            {saving ? (lang === 'zh' ? '建立中...' : 'Creating...') : (lang === 'zh' ? '建立課程' : 'Create Session')}
          </button>
        </div>
      </div>

      {toast && <div className={`toast ${toast.isError ? 'toast-error' : 'toast-success'}`}>{toast.msg}</div>}
    </div>
  );
}
