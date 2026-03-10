'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useLang } from '@/lib/LanguageContext';
import { supabase } from '@/lib/supabase';

const studentNav = (t) => [
  { href: '/dashboard/student',     label: t.dashboard,       icon: '⊞' },
  { href: '/dashboard/student/book', label: t.bookSession,     icon: '＋' },
  { href: '/dashboard/student/sessions', label: t.mySessions,  icon: '📅' },
  { href: '/dashboard/student/instructors', label: t.myInstructors, icon: '👤' },
];

const teacherNav = (t) => [
  { href: '/dashboard/teacher',          label: t.dashboard,       icon: '⊞' },
  { href: '/dashboard/teacher/availability', label: t.myAvailability, icon: '📅' },
  { href: '/dashboard/teacher/sessions', label: t.mySessions,      icon: '🗓' },
  { href: '/dashboard/teacher/students', label: t.myStudents,      icon: '👥' },
];

const adminNav = (t) => [
  { href: '/dashboard/admin',          label: t.dashboard,     icon: '⊞' },
  { href: '/dashboard/admin/users',    label: t.manageUsers,   icon: '👥' },
  { href: '/dashboard/admin/orgs',     label: t.organizations, icon: '🏢' },
  { href: '/dashboard/admin/subjects', label: t.subjects,      icon: '📚' },
  { href: '/dashboard/admin/analytics', label: t.analytics,   icon: '📊' },
];

function getNav(role, t) {
  if (role === 'teacher') return teacherNav(t);
  if (role === 'org_admin' || role === 'platform_admin') return adminNav(t);
  return studentNav(t);
}

function getRoleLabel(role, t) {
  const map = {
    student: t.role_student,
    teacher: t.role_teacher,
    org_admin: t.role_org_admin,
    platform_admin: t.role_platform_admin,
  };
  return map[role] || role;
}

export default function Sidebar({ user, profile }) {
  const pathname = usePathname();
  const router = useRouter();
  const { t, lang, toggleLang } = useLang();

  const nav = getNav(profile?.role, t);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <aside style={{
      width: '240px',
      minHeight: '100vh',
      background: 'rgba(255,255,255,0.03)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderRight: '1px solid rgba(255,255,255,0.08)',
      display: 'flex',
      flexDirection: 'column',
      padding: '1.5rem 1rem',
      position: 'fixed',
      top: 0,
      left: 0,
      bottom: 0,
      zIndex: 40,
    }}>
      {/* Logo */}
      <div style={{ marginBottom: '2rem', padding: '0 0.5rem' }}>
        <span style={{
          fontSize: '1.25rem',
          fontWeight: 700,
          background: 'linear-gradient(to right, #6366f1, #ec4899)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          Class-Booking
        </span>
      </div>

      {/* User info */}
      <div style={{
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '12px',
        padding: '0.75rem 1rem',
        marginBottom: '1.5rem',
      }}>
        <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#f8fafc', marginBottom: '2px' }}>
          {profile?.full_name || user?.email?.split('@')[0]}
        </div>
        <div style={{ fontSize: '0.75rem', color: '#6366f1' }}>
          {getRoleLabel(profile?.role, t)}
        </div>
      </div>

      {/* Nav links */}
      <nav style={{ flex: 1 }}>
        {nav.map(({ href, label, icon }) => {
          const active = pathname === href;
          return (
            <Link key={href} href={href} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 12px',
              borderRadius: '10px',
              marginBottom: '4px',
              textDecoration: 'none',
              fontSize: '0.875rem',
              fontWeight: active ? 600 : 400,
              color: active ? '#fff' : '#94a3b8',
              background: active ? 'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(236,72,153,0.2))' : 'transparent',
              border: active ? '1px solid rgba(99,102,241,0.3)' : '1px solid transparent',
              transition: 'all 0.2s ease',
            }}>
              <span style={{ fontSize: '1rem' }}>{icon}</span>
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom actions */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1rem' }}>
        {/* Language toggle */}
        <div style={{
          display: 'flex',
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '999px',
          overflow: 'hidden',
          marginBottom: '0.75rem',
          fontSize: '0.75rem',
          fontWeight: 600,
        }}>
          {['en', 'zh'].map((l) => (
            <button key={l} onClick={() => lang !== l && toggleLang()} style={{
              flex: 1,
              padding: '6px 0',
              border: 'none',
              cursor: 'pointer',
              background: lang === l ? 'linear-gradient(135deg, #6366f1, #ec4899)' : 'transparent',
              color: lang === l ? '#fff' : '#94a3b8',
              borderRadius: '999px',
              transition: 'all 0.2s ease',
            }}>
              {l === 'en' ? 'EN' : '中文'}
            </button>
          ))}
        </div>

        {/* Sign out */}
        <button onClick={handleSignOut} style={{
          width: '100%',
          padding: '10px 12px',
          borderRadius: '10px',
          border: '1px solid rgba(255,255,255,0.08)',
          background: 'transparent',
          color: '#94a3b8',
          fontSize: '0.875rem',
          cursor: 'pointer',
          textAlign: 'left',
          transition: 'all 0.2s ease',
        }}
          onMouseEnter={e => e.target.style.color = '#f8fafc'}
          onMouseLeave={e => e.target.style.color = '#94a3b8'}
        >
          ↪ {t.signOut}
        </button>
      </div>
    </aside>
  );
}
