'use client';

import { useState } from 'react';
import { useLang } from '@/lib/LanguageContext';

export default function StudentsClient({ students, sessionCounts }) {
  const { t, lang } = useLang();
  const [search, setSearch] = useState('');

  const filtered = students.filter(s =>
    !search || s.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{
          fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.25rem',
          background: 'linear-gradient(to right, #fff, #94a3b8)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>
          {t.myStudents}
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
          {lang === 'zh' ? `共 ${students.length} 位學生` : `${students.length} student${students.length !== 1 ? 's' : ''}`}
        </p>
      </div>

      {students.length === 0 ? (
        <div style={{
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '16px', padding: '4rem', textAlign: 'center',
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👥</div>
          <p style={{ color: '#94a3b8' }}>
            {lang === 'zh' ? '尚未有學生被指派給您' : 'No students assigned to you yet.'}
          </p>
          <p style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '0.5rem' }}>
            {lang === 'zh' ? '請聯繫管理員進行指派' : 'Contact your admin to assign students.'}
          </p>
        </div>
      ) : (
        <>
          <input
            type="text"
            placeholder={lang === 'zh' ? '搜尋學生...' : 'Search students...'}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="glass-input"
            style={{ maxWidth: '280px', marginBottom: '1.25rem' }}
          />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem' }}>
            {filtered.map(student => {
              const counts = sessionCounts[student.id] || { total: 0, completed: 0 };
              return (
                <div key={student.id} style={{
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '16px', padding: '1.5rem',
                  transition: 'transform 0.2s, border-color 0.2s',
                }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem' }}>
                    <div style={{
                      width: '44px', height: '44px', borderRadius: '50%', flexShrink: 0,
                      background: 'linear-gradient(135deg, #6366f1, #ec4899)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1rem', fontWeight: 700, color: '#fff',
                    }}>
                      {student.full_name?.[0] || '?'}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: '#f8fafc', fontSize: '0.9rem' }}>{student.full_name}</div>
                      <div style={{ fontSize: '0.73rem', color: '#64748b' }}>
                        {lang === 'zh' ? '加入：' : 'Joined: '}{new Date(student.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    {[
                      { label: lang === 'zh' ? '總課程' : 'Total', value: counts.total, color: '#818cf8' },
                      { label: lang === 'zh' ? '已完成' : 'Done', value: counts.completed, color: '#4ade80' },
                    ].map(stat => (
                      <div key={stat.label} style={{
                        background: 'rgba(255,255,255,0.04)', borderRadius: '10px',
                        padding: '10px', textAlign: 'center',
                      }}>
                        <div style={{ fontSize: '1.4rem', fontWeight: 700, color: stat.color }}>{stat.value}</div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{stat.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
