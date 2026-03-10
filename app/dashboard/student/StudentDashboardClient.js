'use client';

import Link from 'next/link';
import { useLang } from '@/lib/LanguageContext';
import DashboardHeader from '@/components/DashboardHeader';
import StatCard from '@/components/StatCard';

export default function StudentDashboardClient({ profile, sessions, assignments }) {
  const { t, lang } = useLang();

  const upcoming = sessions.filter(s => s.session?.status === 'confirmed');
  const completed = sessions.filter(s => s.session?.status === 'completed');

  return (
    <div>
      <DashboardHeader
        name={profile?.full_name?.split(' ')[0] || 'there'}
        subtitle={t.studentWelcome}
      />

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <StatCard icon="📅" label={t.upcomingSessions} value={upcoming.length} />
        <StatCard icon="✅" label={t.completedSessions} value={completed.length}
          gradient="linear-gradient(to right, #22c55e, #16a34a)" />
        <StatCard icon="👤" label={t.assignedInstructors} value={assignments.length}
          gradient="linear-gradient(to right, #ec4899, #9333ea)" />
        <StatCard icon="📚" label={t.totalSessions} value={sessions.length}
          gradient="linear-gradient(to right, #f59e0b, #ef4444)" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Upcoming sessions */}
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '16px',
          padding: '1.5rem',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#f8fafc' }}>{t.upcomingSessions}</h2>
            <Link href="/dashboard/student/sessions" style={{ fontSize: '0.8rem', color: '#6366f1', textDecoration: 'none' }}>
              {t.viewAll}
            </Link>
          </div>
          {upcoming.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 0' }}>
              <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '1rem' }}>{t.noUpcomingSessions}</p>
              <Link href="/dashboard/student/book">
                <button className="submit-btn" style={{ padding: '10px 24px', marginTop: 0, width: 'auto' }}>
                  {t.bookNow}
                </button>
              </Link>
            </div>
          ) : (
            upcoming.map((s, i) => (
              <SessionRow key={i} session={s.session} lang={lang} />
            ))
          )}
        </div>

        {/* My instructors */}
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '16px',
          padding: '1.5rem',
        }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#f8fafc', marginBottom: '1rem' }}>{t.myInstructors}</h2>
          {assignments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 0' }}>
              <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '0.5rem' }}>{t.noInstructors}</p>
              <p style={{ color: '#64748b', fontSize: '0.8rem' }}>{t.contactAdmin}</p>
            </div>
          ) : (
            assignments.map((a, i) => (
              <div key={i} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 0',
                borderBottom: i < assignments.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
              }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '50%',
                  background: 'linear-gradient(135deg, #6366f1, #ec4899)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.875rem', fontWeight: 700, color: '#fff', flexShrink: 0,
                }}>
                  {a.teacher?.full_name?.[0] || '?'}
                </div>
                <span style={{ fontSize: '0.875rem', color: '#f8fafc' }}>{a.teacher?.full_name}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function SessionRow({ session, lang }) {
  if (!session) return null;
  const date = new Date(session.start_time);
  const subject = lang === 'zh' ? session.subject?.name_zh : session.subject?.name_en;
  return (
    <div style={{
      padding: '12px 0',
      borderBottom: '1px solid rgba(255,255,255,0.05)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    }}>
      <div>
        <div style={{ fontSize: '0.875rem', color: '#f8fafc', fontWeight: 500 }}>
          {subject || '—'}
        </div>
        <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>
          {session.instructor?.full_name} · {date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
      <span style={{
        fontSize: '0.7rem', padding: '3px 8px', borderRadius: '999px',
        background: 'rgba(99,102,241,0.15)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.2)',
      }}>
        {session.type}
      </span>
    </div>
  );
}
