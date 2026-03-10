'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useLang } from '@/lib/LanguageContext';
import LangToggle from '@/components/LangToggle';

export default function LoginPage() {
  const router = useRouter();
  const { t } = useLang();
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, isError = false) => {
    setToast({ message, isError });
    setTimeout(() => setToast(null), 4000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.target);
    const email = formData.get('email');
    const password = formData.get('password');

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      showToast(t.loginSuccess);
      setTimeout(() => router.push('/dashboard'), 1000);
    } catch (error) {
      showToast(error.message, true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '2rem', background: 'radial-gradient(circle at top left, #1e1b4b, #0f172a, #020617)' }}>
      <div className="shape shape-1" />
      <div className="shape shape-2" />
      <LangToggle />
      <div style={{ width: '100%', maxWidth: '440px' }}>
        <div className="glass-card animate-fade-in">
          <h1 className="gradient-text" style={{ fontSize: '2rem', fontWeight: 600, marginBottom: '0.5rem' }}>
            {t.welcomeBack}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1rem', marginBottom: '2rem' }}>
            {t.loginSubtitle}
          </p>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                {t.email}
              </label>
              <input
                className="glass-input"
                type="email"
                name="email"
                placeholder="name@example.com"
                required
              />
            </div>

            <div style={{ marginBottom: '0.75rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                {t.password}
              </label>
              <input
                className="glass-input"
                type="password"
                name="password"
                placeholder="••••••••"
                required
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: 0, color: 'var(--text-muted)' }}>
                <input type="checkbox" style={{ width: '16px', height: '16px', margin: 0 }} />
                {t.rememberMe}
              </label>
              <a href="#" style={{ color: 'var(--primary)', textDecoration: 'none' }}>{t.forgotPassword}</a>
            </div>

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? t.signingIn : t.signIn}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            {t.noAccount}{' '}
            <Link href="/signup" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>
              {t.signUp}
            </Link>
          </p>
        </div>
      </div>

      {toast && (
        <div className={`toast ${toast.isError ? 'toast-error' : 'toast-success'}`}>
          {toast.message}
        </div>
      )}
    </main>
  );
}
