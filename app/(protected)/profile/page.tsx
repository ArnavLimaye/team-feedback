'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/lib/types';
import { getInitials, formatRole } from '@/lib/utils';

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [fullName, setFullName] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (data) {
        setProfile(data as Profile);
        setFullName(data.full_name);
      }
    }
    load();
  }, [supabase]);

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);

    await supabase
      .from('profiles')
      .update({ full_name: fullName })
      .eq('id', profile.id);

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  if (!profile) {
    return (
      <div className="page-container">
        <div className="skeleton" style={{ height: 40, width: 200, marginBottom: 'var(--space-8)' }} />
        <div className="skeleton" style={{ height: 300, width: '100%' }} />
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Profile</h1>
        <p className="page-subtitle">Manage your account settings.</p>
      </div>

      <div className="glass-card profile-card animate-fade-in">
        <div className="profile-header">
          <div className="avatar avatar-lg">{getInitials(profile.full_name)}</div>
          <div>
            <h2 className="profile-name">{profile.full_name}</h2>
            <p className="profile-email">{profile.email}</p>
            <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
              <span className="badge badge-primary">{formatRole(profile.role)}</span>
              <span className="badge badge-info">{profile.team}</span>
            </div>
          </div>
        </div>

        <div className="profile-form">
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              className="form-input"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" value={profile.email} disabled />
          </div>

          <div className="form-group">
            <label className="form-label">Role</label>
            <input className="form-input" value={formatRole(profile.role)} disabled />
          </div>

          <div className="form-group">
            <label className="form-label">Team</label>
            <input className="form-input" value={profile.team} disabled />
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
            <button
              className="btn btn-primary"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            {saved && (
              <span style={{ color: 'var(--color-success)', fontSize: 'var(--font-size-sm)' }}>
                ✅ Saved!
              </span>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .profile-card {
          max-width: 600px;
          padding: var(--space-8);
        }

        .profile-header {
          display: flex;
          align-items: center;
          gap: var(--space-5);
          margin-bottom: var(--space-8);
          padding-bottom: var(--space-6);
          border-bottom: 1px solid var(--color-border);
        }

        .profile-name {
          font-size: var(--font-size-xl);
          font-weight: 700;
        }

        .profile-email {
          font-size: var(--font-size-sm);
          color: var(--color-text-muted);
        }

        .profile-form {
          display: flex;
          flex-direction: column;
          gap: var(--space-5);
        }
      `}</style>
    </div>
  );
}
