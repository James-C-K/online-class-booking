'use client';

export default function StatCard({ label, value, icon, gradient }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '16px',
      padding: '1.5rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem',
      transition: 'transform 0.2s ease',
    }}
      onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
      onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
    >
      <div style={{ fontSize: '1.5rem' }}>{icon}</div>
      <div style={{
        fontSize: '2rem',
        fontWeight: 700,
        background: gradient || 'linear-gradient(to right, #6366f1, #ec4899)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
      }}>
        {value}
      </div>
      <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 500 }}>{label}</div>
    </div>
  );
}
