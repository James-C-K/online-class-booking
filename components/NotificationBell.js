'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useLang } from '@/lib/LanguageContext';

export default function NotificationBell({ userId }) {
  const { lang } = useLang();
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const unread = notifications.filter(n => !n.is_read);

  // Initial fetch
  useEffect(() => {
    fetch('/api/notifications')
      .then(r => r.json())
      .then(data => Array.isArray(data) && setNotifications(data));
  }, []);

  // Realtime subscription
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      }, (payload) => {
        setNotifications(prev => [payload.new, ...prev]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const markAllRead = async () => {
    await fetch('/api/notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const timeAgo = (iso) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return lang === 'zh' ? '剛剛' : 'just now';
    if (mins < 60) return lang === 'zh' ? `${mins} 分鐘前` : `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return lang === 'zh' ? `${hrs} 小時前` : `${hrs}h ago`;
    return lang === 'zh' ? `${Math.floor(hrs / 24)} 天前` : `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* Bell button */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          position: 'relative',
          width: '36px', height: '36px',
          borderRadius: '10px',
          border: '1px solid rgba(255,255,255,0.1)',
          background: open ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.05)',
          color: '#f8fafc',
          cursor: 'pointer',
          fontSize: '1rem',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'background 0.2s',
          flexShrink: 0,
        }}
        aria-label="Notifications"
      >
        🔔
        {unread.length > 0 && (
          <span style={{
            position: 'absolute', top: '-4px', right: '-4px',
            background: 'linear-gradient(135deg, #6366f1, #ec4899)',
            color: '#fff', fontSize: '0.6rem', fontWeight: 700,
            borderRadius: '999px', minWidth: '16px', height: '16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0 3px',
          }}>
            {unread.length > 9 ? '9+' : unread.length}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute', right: 0, top: '44px',
          width: '320px', maxWidth: 'calc(100vw - 32px)',
          background: 'rgba(15,23,42,0.98)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: '16px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          zIndex: 100,
          overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 16px',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
          }}>
            <span style={{ fontWeight: 600, color: '#f8fafc', fontSize: '0.9rem' }}>
              {lang === 'zh' ? '通知' : 'Notifications'}
              {unread.length > 0 && (
                <span style={{ marginLeft: '8px', fontSize: '0.75rem', color: '#818cf8' }}>
                  ({unread.length} {lang === 'zh' ? '未讀' : 'unread'})
                </span>
              )}
            </span>
            {unread.length > 0 && (
              <button onClick={markAllRead} style={{
                fontSize: '0.75rem', color: '#6366f1', cursor: 'pointer',
                background: 'none', border: 'none', padding: 0,
              }}>
                {lang === 'zh' ? '全部標為已讀' : 'Mark all read'}
              </button>
            )}
          </div>

          {/* List */}
          <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#475569', fontSize: '0.875rem' }}>
                {lang === 'zh' ? '沒有通知' : 'No notifications yet'}
              </div>
            ) : (
              notifications.map(n => (
                <div key={n.id} style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                  background: n.is_read ? 'transparent' : 'rgba(99,102,241,0.06)',
                  transition: 'background 0.2s',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: n.is_read ? 400 : 600, color: '#f8fafc', fontSize: '0.85rem', marginBottom: '3px' }}>
                        {lang === 'zh' ? n.title_zh : n.title_en}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#94a3b8', lineHeight: 1.5 }}>
                        {lang === 'zh' ? n.body_zh : n.body_en}
                      </div>
                    </div>
                    {!n.is_read && (
                      <div style={{
                        width: '8px', height: '8px', borderRadius: '50%',
                        background: '#6366f1', flexShrink: 0, marginTop: '4px',
                      }} />
                    )}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#475569', marginTop: '4px' }}>
                    {timeAgo(n.created_at)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
