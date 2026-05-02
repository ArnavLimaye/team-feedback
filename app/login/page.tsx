'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push('/dashboard');
      router.refresh();
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg-glow" />
      <div className="auth-container animate-fade-in">
        <div className="auth-header">
          <div className="auth-logo">
            <span className="auth-logo-icon">📊</span>
            <span className="auth-logo-text">TeamFeedback</span>
          </div>
          <h1 className="auth-title">Welcome back</h1>
          <p className="auth-subtitle">Sign in to access your feedback dashboard</p>
        </div>

        <form onSubmit={handleLogin} className="auth-form">
          {error && (
            <div className="auth-error animate-scale-in">
              <span>⚠️</span> {error}
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              className="form-input"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg auth-submit"
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="auth-footer">
          Don&apos;t have an account?{' '}
          <Link href="/signup">Create one</Link>
        </p>
      </div>

      <style jsx>{`
        .auth-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: var(--space-4);
          position: relative;
          overflow: hidden;
        }

        .auth-bg-glow {
          position: absolute;
          top: -50%;
          left: -30%;
          width: 80%;
          height: 200%;
          background: radial-gradient(ellipse, rgba(99, 102, 241, 0.08) 0%, transparent 60%);
          pointer-events: none;
        }

        .auth-container {
          width: 100%;
          max-width: 420px;
          padding: var(--space-10);
          background: var(--color-bg-card);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-xl);
          backdrop-filter: blur(20px);
          position: relative;
        }

        .auth-header {
          text-align: center;
          margin-bottom: var(--space-8);
        }

        .auth-logo {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--space-2);
          margin-bottom: var(--space-6);
        }

        .auth-logo-icon {
          font-size: 1.75rem;
        }

        .auth-logo-text {
          font-size: var(--font-size-xl);
          font-weight: 800;
          background: var(--gradient-primary);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .auth-title {
          font-size: var(--font-size-2xl);
          font-weight: 700;
          color: var(--color-text-primary);
          margin-bottom: var(--space-2);
        }

        .auth-subtitle {
          font-size: var(--font-size-base);
          color: var(--color-text-secondary);
        }

        .auth-form {
          display: flex;
          flex-direction: column;
          gap: var(--space-5);
        }

        .auth-error {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          padding: var(--space-3) var(--space-4);
          background: var(--color-danger-bg);
          color: var(--color-danger);
          border-radius: var(--radius-md);
          font-size: var(--font-size-sm);
        }

        .auth-submit {
          width: 100%;
          margin-top: var(--space-2);
        }

        .auth-footer {
          text-align: center;
          margin-top: var(--space-6);
          font-size: var(--font-size-sm);
          color: var(--color-text-secondary);
        }
      `}</style>
    </div>
  );
}
