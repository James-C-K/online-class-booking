'use client';

import { useLang } from '@/lib/LanguageContext';
import StatCard from '@/components/StatCard';

export default function AnalyticsClient({ stats, sessionsPerDay, topSubjects }) {
  const { lang } = useLang();

  const days = Object.entries(sessionsPerDay);
  const maxSessions = Math.max(...days.map(([, v]) => v), 1);

  const completionRate = stats.totalSessions > 0
    ? Math.round((stats.completedSessions / stats.totalSessions) * 100)
    : 0;
  const cancellationRate = stats.totalSessions > 0
    ? Math.round((stats.cancelledSessions / stats.totalSessions) * 100)
    : 0;
  const maxSubject = topSubjects[0]?.count || 1;

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{
          fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.25rem',
          background: 'linear-gradient(to right, #fff, #94a3b8)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>
          {lang === 'zh' ? '數據分析' : 'Analytics'}
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
          {lang === 'zh' ? '平台整體數據概覽' : 'Platform-wide overview'}
        </p>
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <StatCard icon="👥" label={lang === 'zh' ? '總用戶' : 'Total Users'} value={stats.totalUsers || 0} />
        <StatCard icon="🎓" label={lang === 'zh' ? '老師' : 'Teachers'} value={stats.totalTeachers || 0}
          gradient="linear-gradient(to right, #22c55e, #16a34a)" />
        <StatCard icon="📖" label={lang === 'zh' ? '學生' : 'Students'} value={stats.totalStudents || 0}
          gradient="linear-gradient(to right, #6366f1, #8b5cf6)" />
        <StatCard icon="📅" label={lang === 'zh' ? '總課程' : 'Total Sessions'} value={stats.totalSessions || 0}
          gradient="linear-gradient(to right, #ec4899, #9333ea)" />
        <StatCard icon="✅" label={lang === 'zh' ? '完成率' : 'Completion'} value={`${completionRate}%`}
          gradient="linear-gradient(to right, #22c55e, #16a34a)" />
        <StatCard icon="❌" label={lang === 'zh' ? '取消率' : 'Cancellation'} value={`${cancellationRate}%`}
          gradient="linear-gradient(to right, #ef4444, #dc2626)" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Sessions bar chart */}
        <div style={{
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '16px', padding: '1.5rem',
        }}>
          <h2 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#f8fafc', marginBottom: '1.25rem' }}>
            {lang === 'zh' ? '過去 14 天課程數' : 'Sessions — Last 14 Days'}
          </h2>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '120px' }}>
            {days.map(([date, count]) => {
              const height = maxSessions > 0 ? Math.max((count / maxSessions) * 100, count > 0 ? 8 : 2) : 2;
              const d = new Date(date + 'T00:00:00');
              const label = d.toLocaleDateString(lang === 'zh' ? 'zh-TW' : 'en-US', { month: 'numeric', day: 'numeric' });
              return (
                <div key={date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', height: '100%', justifyContent: 'flex-end' }} title={`${label}: ${count}`}>
                  <span style={{ fontSize: '0.6rem', color: count > 0 ? '#818cf8' : 'transparent' }}>{count || ''}</span>
                  <div style={{
                    width: '100%', height: `${height}%`, minHeight: '2px', borderRadius: '4px 4px 0 0',
                    background: count > 0 ? 'linear-gradient(to top, #6366f1, #ec4899)' : 'rgba(255,255,255,0.06)',
                    transition: 'height 0.3s ease',
                  }} />
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
            <span style={{ fontSize: '0.65rem', color: '#64748b' }}>{days[0]?.[0]?.slice(5)}</span>
            <span style={{ fontSize: '0.65rem', color: '#64748b' }}>{days[days.length - 1]?.[0]?.slice(5)}</span>
          </div>
        </div>

        {/* Top subjects */}
        <div style={{
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '16px', padding: '1.5rem',
        }}>
          <h2 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#f8fafc', marginBottom: '1.25rem' }}>
            {lang === 'zh' ? '熱門科目' : 'Top Subjects'}
          </h2>
          {topSubjects.length === 0 ? (
            <p style={{ color: '#64748b', fontSize: '0.875rem', textAlign: 'center', padding: '2rem 0' }}>
              {lang === 'zh' ? '尚無數據' : 'No data yet'}
            </p>
          ) : (
            topSubjects.map((s, i) => (
              <div key={s.name} style={{ marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{s.name}</span>
                  <span style={{ fontSize: '0.8rem', color: '#818cf8', fontWeight: 600 }}>{s.count}</span>
                </div>
                <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '999px', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: '999px',
                    width: `${(s.count / maxSubject) * 100}%`,
                    background: `linear-gradient(to right, hsl(${240 + i * 25}, 70%, 60%), hsl(${280 + i * 25}, 70%, 60%))`,
                    transition: 'width 0.5s ease',
                  }} />
                </div>
              </div>
            ))
          )}
        </div>

        {/* User breakdown donut */}
        <div style={{
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '16px', padding: '1.5rem',
        }}>
          <h2 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#f8fafc', marginBottom: '1.25rem' }}>
            {lang === 'zh' ? '用戶組成' : 'User Breakdown'}
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              { label: lang === 'zh' ? '學生' : 'Students', count: stats.totalStudents || 0, color: '#818cf8' },
              { label: lang === 'zh' ? '老師' : 'Teachers', count: stats.totalTeachers || 0, color: '#4ade80' },
              { label: lang === 'zh' ? '管理員' : 'Admins', count: Math.max(0, (stats.totalUsers || 0) - (stats.totalTeachers || 0) - (stats.totalStudents || 0)), color: '#f472b6' },
            ].map(item => {
              const pct = stats.totalUsers > 0 ? Math.round((item.count / stats.totalUsers) * 100) : 0;
              return (
                <div key={item.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{item.label}</span>
                    <span style={{ fontSize: '0.8rem', color: item.color, fontWeight: 600 }}>{item.count} ({pct}%)</span>
                  </div>
                  <div style={{ height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '999px', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', width: `${pct}%`, borderRadius: '999px',
                      background: item.color, transition: 'width 0.5s ease',
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Session status breakdown */}
        <div style={{
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '16px', padding: '1.5rem',
        }}>
          <h2 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#f8fafc', marginBottom: '1.25rem' }}>
            {lang === 'zh' ? '課程狀態分布' : 'Session Status'}
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              { label: lang === 'zh' ? '已完成' : 'Completed', count: stats.completedSessions || 0, color: '#4ade80' },
              { label: lang === 'zh' ? '已確認' : 'Confirmed', count: Math.max(0, (stats.totalSessions || 0) - (stats.completedSessions || 0) - (stats.cancelledSessions || 0)), color: '#818cf8' },
              { label: lang === 'zh' ? '已取消' : 'Cancelled', count: stats.cancelledSessions || 0, color: '#f87171' },
            ].map(item => {
              const pct = stats.totalSessions > 0 ? Math.round((item.count / stats.totalSessions) * 100) : 0;
              return (
                <div key={item.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{item.label}</span>
                    <span style={{ fontSize: '0.8rem', color: item.color, fontWeight: 600 }}>{item.count} ({pct}%)</span>
                  </div>
                  <div style={{ height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '999px', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', width: `${pct}%`, borderRadius: '999px',
                      background: item.color, transition: 'width 0.5s ease',
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
