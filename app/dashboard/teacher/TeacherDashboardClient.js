'use client';

import Link from 'next/link';
import { useLang } from '@/lib/LanguageContext';
import DashboardHeader from '@/components/DashboardHeader';
import StatCard from '@/components/StatCard';

export default function TeacherDashboardClient({ profile, todaySessions, upcomingSessions, studentCount, hasAvailability }) {
  const { t, lang } = useLang();

  return (
    <div>
      <DashboardHeader
        name={profile?.full_name?.split(' ')[0] || 'there'}
        subtitle={t.teacherWelcome}
      />

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <StatCard icon="🗓" label={t.todaysSessions} value={todaySessions.length} />
        <StatCard icon="📅" label={t.upcomingSessions} value={upcomingSessions.length}
          gradient="linear-gradient(to right, #6366f1, #ec4899)" />
        <StatCard icon="👥" label={t.totalStudents} value={studentCount}
          gradient="linear-gradient(to right, #22c55e, #16a34a)" />
      </div>

      {/* Availability CTA */}
      {!hasAvailability && (
        <div style={{
          background: 'rgba(99,102,241,0.08)',
          border: '1px solid rgba(99,102,241,0.2)',
          borderRadius: '16px',
          padding: '1.5rem',
          marginBottom: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: 0 }}>
            📌 {t.availabilitySetup}
          </p>
          <Link href="/dashboard/teacher/availability">
            <button className="submit-btn" style={{ padding: '10px 20px', marginTop: 0, width: 'auto', whiteSpace: 'nowrap' }}>
              {t.goToAvailability}
            </button>
          </Link>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Today */}
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '16px',
          padding: '1.5rem',
        }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#f8fafc', marginBottom: '1rem' }}>{t.todaysSessions}</h2>
          {todaySessions.length === 0 ? (
            <p style={{ color: '#94a3b8', fontSize: '0.875rem', textAlign: 'center', padding: '2rem 0' }}>
              {t.noUpcomingSessions}
            </p>
          ) : (
            todaySessions.map((s, i) => (
              <SessionRow key={i} session={s} lang={lang} />
            ))
          )}
        </div>

        {/* Upcoming */}
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '16px',
          padding: '1.5rem',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#f8fafc' }}>{t.upcomingSessions}</h2>
            <Link href="/dashboard/teacher/sessions" style={{ fontSize: '0.8rem', color: '#6366f1', textDecoration: 'none' }}>
              {t.viewAll}
            </Link>
          </div>
          {upcomingSessions.length === 0 ? (
            <p style={{ color: '#94a3b8', fontSize: '0.875rem', textAlign: 'center', padding: '2rem 0' }}>
              {t.noUpcomingSessions}
            </p>
          ) : (
            upcomingSessions.map((s, i) => (
              <SessionRow key={i} session={s} lang={lang} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function SessionRow({ session, lang }) {
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
        <div style={{ fontSize: '0.875rem', color: '#f8fafc', fontWeight: 500 }}>{subject || '—'}</div>
        <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>
          {date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
      <span style={{
        fontSize: '0.7rem', padding: '3px 8px', borderRadius: '999px',
        background: 'rgba(34,197,94,0.1)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.2)',
      }}>
        {session.type}
      </span>
    </div>
  );
}
