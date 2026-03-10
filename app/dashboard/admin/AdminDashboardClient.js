'use client';

import Link from 'next/link';
import { useLang } from '@/lib/LanguageContext';
import DashboardHeader from '@/components/DashboardHeader';
import StatCard from '@/components/StatCard';

export default function AdminDashboardClient({ profile, stats, recentUsers }) {
  const { t } = useLang();

  const roleColors = {
    student:         { bg: 'rgba(99,102,241,0.1)',  color: '#818cf8' },
    teacher:         { bg: 'rgba(34,197,94,0.1)',   color: '#4ade80' },
    org_admin:       { bg: 'rgba(236,72,153,0.1)',  color: '#f472b6' },
    platform_admin:  { bg: 'rgba(245,158,11,0.1)',  color: '#fbbf24' },
  };

  return (
    <div>
      <DashboardHeader
        name={profile?.full_name?.split(' ')[0] || 'there'}
        subtitle={t.adminWelcome}
      />

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <StatCard icon="👥" label={t.totalUsers} value={stats.totalUsers || 0} />
        <StatCard icon="🎓" label={t.totalInstructors} value={stats.totalTeachers || 0}
          gradient="linear-gradient(to right, #22c55e, #16a34a)" />
        <StatCard icon="🏢" label={t.activeOrgs} value={stats.totalOrgs || 0}
          gradient="linear-gradient(to right, #ec4899, #9333ea)" />
        <StatCard icon="📅" label={t.totalSessions} value={stats.totalSessions || 0}
          gradient="linear-gradient(to right, #f59e0b, #ef4444)" />
      </div>

      {/* Quick actions */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <Link href="/dashboard/admin/users">
          <button className="submit-btn" style={{ padding: '10px 24px', marginTop: 0, width: 'auto' }}>
            + {t.inviteUsers}
          </button>
        </Link>
        <Link href="/dashboard/admin/orgs">
          <button style={{
            padding: '10px 24px',
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(255,255,255,0.04)',
            color: '#f8fafc',
            cursor: 'pointer',
            fontSize: '0.9rem',
          }}>
            {t.manageOrg}
          </button>
        </Link>
      </div>

      {/* Recent users */}
      <div style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '16px',
        padding: '1.5rem',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#f8fafc' }}>
            {t.recentActivity}
          </h2>
          <Link href="/dashboard/admin/users" style={{ fontSize: '0.8rem', color: '#6366f1', textDecoration: 'none' }}>
            {t.viewAll}
          </Link>
        </div>

        {recentUsers.length === 0 ? (
          <p style={{ color: '#94a3b8', fontSize: '0.875rem', textAlign: 'center', padding: '2rem 0' }}>
            {t.noActivity}
          </p>
        ) : (
          recentUsers.map((u, i) => {
            const rc = roleColors[u.role] || roleColors.student;
            return (
              <div key={u.id} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 0',
                borderBottom: i < recentUsers.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '50%',
                    background: 'linear-gradient(135deg, #6366f1, #ec4899)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.875rem', fontWeight: 700, color: '#fff', flexShrink: 0,
                  }}>
                    {u.full_name?.[0] || '?'}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.875rem', color: '#f8fafc', fontWeight: 500 }}>{u.full_name || '—'}</div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                      {new Date(u.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <span style={{
                  fontSize: '0.7rem', padding: '3px 10px', borderRadius: '999px',
                  background: rc.bg, color: rc.color,
                }}>
                  {t[`role_${u.role}`] || u.role}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
