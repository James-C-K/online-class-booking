'use client';

import { useLang } from '@/lib/LanguageContext';

function getGreeting(t) {
  const h = new Date().getHours();
  if (h < 12) return t.good_morning;
  if (h < 18) return t.good_afternoon;
  return t.good_evening;
}

export default function DashboardHeader({ name, subtitle }) {
  const { t } = useLang();
  return (
    <div style={{ marginBottom: '2rem' }}>
      <h1 style={{
        fontSize: '1.75rem',
        fontWeight: 700,
        background: 'linear-gradient(to right, #fff, #94a3b8)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        marginBottom: '0.25rem',
      }}>
        {getGreeting(t)}, {name} 👋
      </h1>
      <p style={{ color: '#94a3b8', fontSize: '0.95rem' }}>{subtitle}</p>
    </div>
  );
}
