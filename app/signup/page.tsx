'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignupPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('engineer');
  const [team, setTeam] = useState('frontend');
  const [teams, setTeams] = useState<{ id: string; name: string; description: string | null }[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function fetchTeams() {
      const { data } = await supabase.from('teams').select('*').order('name');
      if (data) setTeams(data);
    }
    fetchTeams();
  }, [supabase]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role,
          team,
        },
      },
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
          <h1 className="auth-title">Create your account</h1>
          <p className="auth-subtitle">Join your team&apos;s feedback platform</p>
        </div>

        <form onSubmit={handleSignup} className="auth-form">
          {error && (
            <div className="auth-error animate-scale-in">
              <span>⚠️</span> {error}
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="fullName">Full Name</label>
            <input
              id="fullName"
              type="text"
              className="form-input"
              placeholder="John Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="signup-email">Email</label>
            <input
              id="signup-email"
              type="email"
              className="form-input"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="signup-password">Password</label>
            <input
              id="signup-password"
              type="password"
              className="form-input"
              placeholder="Min 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="role">Role</label>
              <select
                id="role"
                className="form-select"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="engineer">Engineer</option>
                <option value="team_lead">Team Lead</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="team">Team</label>
              <select
                id="team"
                className="form-select"
                value={team}
                onChange={(e) => setTeam(e.target.value)}
              >
                {teams.length > 0 ? (
                  teams.map((t) => (
                    <option key={t.id} value={t.name}>
                      {t.description || t.name}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="frontend">Frontend</option>
                    <option value="backend">Backend</option>
                    <option value="qa">QA</option>
                    <option value="devops">DevOps</option>
                    <option value="design">Design</option>
                  </>
                )}
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg auth-submit"
            disabled={loading}
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account?{' '}
          <Link href="/login">Sign in</Link>
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
          right: -30%;
          width: 80%;
          height: 200%;
          background: radial-gradient(ellipse, rgba(139, 92, 246, 0.08) 0%, transparent 60%);
          pointer-events: none;
        }

        .auth-container {
          width: 100%;
          max-width: 480px;
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

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--space-4);
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

        @media (max-width: 480px) {
          .form-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
