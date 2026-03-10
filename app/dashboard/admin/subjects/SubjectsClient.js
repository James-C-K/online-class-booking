'use client';

import { useState } from 'react';
import { useLang } from '@/lib/LanguageContext';

export default function SubjectsClient({ subjects: initial }) {
  const { lang } = useLang();
  const [subjects, setSubjects] = useState(initial);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name_en: '', name_zh: '', category: '' });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, isError = false) => {
    setToast({ msg, isError });
    setTimeout(() => setToast(null), 3000);
  };

  const addSubject = async () => {
    if (!form.name_en || !form.name_zh) return;
    setSaving(true);
    const res = await fetch('/api/subjects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (res.ok) {
      setSubjects(prev => [...prev, data]);
      setForm({ name_en: '', name_zh: '', category: '' });
      setAdding(false);
      showToast(lang === 'zh' ? '科目已新增' : 'Subject added');
    } else {
      showToast(data.error, true);
    }
    setSaving(false);
  };

  const toggleActive = async (subject) => {
    const res = await fetch('/api/subjects', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: subject.id, is_active: !subject.is_active }),
    });
    if (res.ok) {
      setSubjects(prev => prev.map(s => s.id === subject.id ? { ...s, is_active: !s.is_active } : s));
    }
  };

  const categories = [...new Set(subjects.map(s => s.category).filter(Boolean))];

  return (
    <div>
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{
            fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.25rem',
            background: 'linear-gradient(to right, #fff, #94a3b8)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            {lang === 'zh' ? '科目管理' : 'Subject Management'}
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
            {lang === 'zh' ? `共 ${subjects.length} 個科目` : `${subjects.length} subjects`}
          </p>
        </div>
        <button onClick={() => setAdding(!adding)} className="submit-btn"
          style={{ width: 'auto', padding: '10px 24px', marginTop: 0 }}>
          {adding ? (lang === 'zh' ? '取消' : 'Cancel') : `+ ${lang === 'zh' ? '新增科目' : 'Add Subject'}`}
        </button>
      </div>

      {/* Add form */}
      {adding && (
        <div style={{
          background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)',
          borderRadius: '16px', padding: '1.5rem', marginBottom: '1.5rem',
          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '0.75rem', alignItems: 'end',
        }}>
          {[
            { key: 'name_en', placeholder: 'English name', label: 'English' },
            { key: 'name_zh', placeholder: '中文名稱', label: '中文' },
            { key: 'category', placeholder: 'e.g. STEM, Arts', label: lang === 'zh' ? '類別' : 'Category' },
          ].map(f => (
            <div key={f.key}>
              <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '4px' }}>{f.label}</label>
              <input
                className="glass-input"
                placeholder={f.placeholder}
                value={form[f.key]}
                onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
              />
            </div>
          ))}
          <button onClick={addSubject} disabled={saving || !form.name_en || !form.name_zh}
            className="submit-btn" style={{ marginTop: 0, padding: '12px 20px' }}>
            {saving ? '...' : (lang === 'zh' ? '新增' : 'Add')}
          </button>
        </div>
      )}

      {/* Subjects by category */}
      {categories.length > 0 ? (
        [...categories, null].map(cat => {
          const group = subjects.filter(s => (cat === null ? !s.category : s.category === cat));
          if (group.length === 0) return null;
          return (
            <div key={cat || 'uncategorized'} style={{ marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>
                {cat || (lang === 'zh' ? '未分類' : 'Uncategorized')}
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
                {group.map(s => <SubjectCard key={s.id} subject={s} lang={lang} onToggle={() => toggleActive(s)} />)}
              </div>
            </div>
          );
        })
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
          {subjects.map(s => <SubjectCard key={s.id} subject={s} lang={lang} onToggle={() => toggleActive(s)} />)}
        </div>
      )}

      {toast && <div className={`toast ${toast.isError ? 'toast-error' : 'toast-success'}`}>{toast.msg}</div>}
    </div>
  );
}

function SubjectCard({ subject, lang, onToggle }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)', border: `1px solid ${subject.is_active ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)'}`,
      borderRadius: '12px', padding: '1rem 1.25rem',
      opacity: subject.is_active ? 1 : 0.5,
      transition: 'all 0.2s',
    }}>
      <div style={{ fontWeight: 600, color: '#f8fafc', fontSize: '0.9rem', marginBottom: '2px' }}>
        {lang === 'zh' ? subject.name_zh : subject.name_en}
      </div>
      <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.75rem' }}>
        {lang === 'zh' ? subject.name_en : subject.name_zh}
      </div>
      <button onClick={onToggle} style={{
        padding: '4px 12px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 600,
        border: subject.is_active ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(34,197,94,0.3)',
        background: subject.is_active ? 'rgba(239,68,68,0.08)' : 'rgba(34,197,94,0.08)',
        color: subject.is_active ? '#f87171' : '#4ade80', cursor: 'pointer',
      }}>
        {subject.is_active
          ? (lang === 'zh' ? '停用' : 'Disable')
          : (lang === 'zh' ? '啟用' : 'Enable')}
      </button>
    </div>
  );
}
