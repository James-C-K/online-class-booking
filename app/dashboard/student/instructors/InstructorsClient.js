'use client';

import Link from 'next/link';
import { useLang } from '@/lib/LanguageContext';

const DAYS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAYS_ZH = ['日', '一', '二', '三', '四', '五', '六'];

export default function InstructorsClient({ instructors, availabilityByInstructor, subjectsByInstructor = {} }) {
  const { t, lang } = useLang();
  const days = lang === 'zh' ? DAYS_ZH : DAYS_EN;

  return (
    <div>
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{
            fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.25rem',
            background: 'linear-gradient(to right, #fff, #94a3b8)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            {t.myInstructors}
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
            {lang === 'zh' ? `共 ${instructors.length} 位老師` : `${instructors.length} instructor${instructors.length !== 1 ? 's' : ''} assigned`}
          </p>
        </div>
        <Link href="/dashboard/student/book">
          <button className="submit-btn" style={{ width: 'auto', padding: '10px 24px', marginTop: 0 }}>
            + {t.bookSession}
          </button>
        </Link>
      </div>

      {instructors.length === 0 ? (
        <div style={{
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '16px', padding: '4rem', textAlign: 'center',
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👤</div>
          <p style={{ color: '#94a3b8', marginBottom: '0.5rem' }}>{t.noInstructors}</p>
          <p style={{ color: '#64748b', fontSize: '0.85rem' }}>{t.contactAdmin}</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
          {instructors.map(inst => {
            const avail = availabilityByInstructor[inst.id] || [];
            const activeDays = [...new Set(avail.map(a => a.day_of_week))].sort();
            const subjects = subjectsByInstructor[inst.id] || [];

            return (
              <div key={inst.id} style={{
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '16px', padding: '1.5rem',
                transition: 'transform 0.2s, border-color 0.2s',
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
              >
                {/* Avatar + name */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.25rem' }}>
                  <div style={{
                    width: '48px', height: '48px', borderRadius: '50%', flexShrink: 0,
                    background: 'linear-gradient(135deg, #6366f1, #ec4899)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.1rem', fontWeight: 700, color: '#fff',
                  }}>
                    {inst.full_name?.[0] || '?'}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, color: '#f8fafc', fontSize: '0.95rem' }}>{inst.full_name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#6366f1', marginTop: '2px' }}>{t.role_teacher}</div>
                  </div>
                </div>

                {/* Subjects */}
                {subjects.length > 0 && (
                  <div style={{ marginBottom: '1rem' }}>
                    <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {lang === 'zh' ? '教授科目' : 'Subjects'}
                    </p>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {subjects.map(s => (
                        <span key={s.id} style={{
                          padding: '3px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 500,
                          background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)',
                          color: '#818cf8',
                        }}>
                          {lang === 'zh' ? s.name_zh : s.name_en}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Availability days */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {lang === 'zh' ? '可預約日期' : 'Available Days'}
                  </p>
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    {[1, 2, 3, 4, 5, 6, 0].map(d => {
                      const active = activeDays.includes(d);
                      return (
                        <span key={d} style={{
                          padding: '3px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 500,
                          background: active ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.03)',
                          color: active ? '#818cf8' : '#374151',
                          border: `1px solid ${active ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.05)'}`,
                        }}>
                          {days[d]}
                        </span>
                      );
                    })}
                  </div>
                  {avail.length === 0 && (
                    <p style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.4rem' }}>
                      {lang === 'zh' ? '尚未設定時段' : 'No availability set yet'}
                    </p>
                  )}
                </div>

                <Link href={`/dashboard/student/book?instructor=${inst.id}`}>
                  <button className="submit-btn" style={{ marginTop: 0, padding: '10px' }}>
                    {t.bookSession}
                  </button>
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
