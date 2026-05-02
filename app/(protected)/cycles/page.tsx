'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import type { FeedbackCycle, Profile } from '@/lib/types';
import { formatDate } from '@/lib/utils';

export default function CyclesPage() {
  const [cycles, setCycles] = useState<FeedbackCycle[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [teams, setTeams] = useState<{ id: string; name: string }[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [team, setTeam] = useState('');
  const [status, setStatus] = useState<'upcoming' | 'active'>('upcoming');

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (prof) {
        setProfile(prof as Profile);
        setTeam(prof.team);
      }

      const { data: t } = await supabase.from('teams').select('*').order('name');
      if (t) setTeams(t);

      const { data: c } = await supabase
        .from('feedback_cycles')
        .select('*')
        .order('start_date', { ascending: false });
      if (c) setCycles(c as FeedbackCycle[]);

      setLoading(false);
    }
    load();
  }, [supabase]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    const cycleNumber = cycles.length + 1;

    const { error } = await supabase.from('feedback_cycles').insert({
      cycle_number: cycleNumber,
      title: title || `Cycle ${cycleNumber}`,
      start_date: startDate,
      end_date: endDate,
      status,
      team,
      created_by: profile?.id,
    });

    if (!error) {
      setShowCreate(false);
      setTitle('');
      setStartDate('');
      setEndDate('');
      router.refresh();

      // Reload cycles
      const { data: c } = await supabase
        .from('feedback_cycles')
        .select('*')
        .order('start_date', { ascending: false });
      if (c) setCycles(c as FeedbackCycle[]);
    }

    setCreating(false);
  };

  const handleStatusChange = async (cycleId: string, newStatus: string) => {
    await supabase
      .from('feedback_cycles')
      .update({ status: newStatus })
      .eq('id', cycleId);

    const { data: c } = await supabase
      .from('feedback_cycles')
      .select('*')
      .order('start_date', { ascending: false });
    if (c) setCycles(c as FeedbackCycle[]);
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="skeleton" style={{ height: 40, width: 200, marginBottom: 'var(--space-8)' }} />
        <div className="skeleton" style={{ height: 200, width: '100%' }} />
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Feedback Cycles</h1>
          <p className="page-subtitle">Manage bi-weekly feedback cycles for your team.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(!showCreate)}>
          {showCreate ? '✕ Cancel' : '➕ New Cycle'}
        </button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <div className="glass-card create-form animate-scale-in">
          <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>
            Create New Cycle
          </h3>
          <form onSubmit={handleCreate}>
            <div className="create-form-grid">
              <div className="form-group">
                <label className="form-label">Title</label>
                <input
                  className="form-input"
                  placeholder={`Cycle ${cycles.length + 1}`}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Team</label>
                <select
                  className="form-select"
                  value={team}
                  onChange={(e) => setTeam(e.target.value)}
                >
                  {teams.map((t) => (
                    <option key={t.id} value={t.name}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Start Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    // Auto-set end date to 15 days later
                    const start = new Date(e.target.value);
                    start.setDate(start.getDate() + 14);
                    setEndDate(start.toISOString().split('T')[0]);
                  }}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">End Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select
                  className="form-select"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'upcoming' | 'active')}
                >
                  <option value="upcoming">Upcoming</option>
                  <option value="active">Active</option>
                </select>
              </div>
            </div>
            <button type="submit" className="btn btn-primary" disabled={creating} style={{ marginTop: 'var(--space-4)' }}>
              {creating ? 'Creating...' : 'Create Cycle'}
            </button>
          </form>
        </div>
      )}

      {/* Cycles List */}
      {cycles.length === 0 ? (
        <div className="glass-card">
          <div className="empty-state">
            <span className="empty-state-icon">🔄</span>
            <h3 className="empty-state-title">No cycles yet</h3>
            <p className="empty-state-text">Create your first feedback cycle to get started.</p>
          </div>
        </div>
      ) : (
        <div className="cycles-list">
          {cycles.map((cycle) => (
            <div key={cycle.id} className="glass-card cycle-card animate-fade-in">
              <div className="cycle-card-header">
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    <h3 className="cycle-card-title">{cycle.title}</h3>
                    <span className={`badge badge-${
                      cycle.status === 'active' ? 'success' :
                      cycle.status === 'closed' ? 'danger' : 'warning'
                    }`}>
                      {cycle.status}
                    </span>
                    <span className="badge badge-info">{cycle.team}</span>
                  </div>
                  <p className="cycle-card-dates">
                    {formatDate(cycle.start_date)} — {formatDate(cycle.end_date)}
                  </p>
                </div>
                <div className="cycle-card-actions">
                  {cycle.status === 'upcoming' && (
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => handleStatusChange(cycle.id, 'active')}
                    >
                      Activate
                    </button>
                  )}
                  {cycle.status === 'active' && (
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleStatusChange(cycle.id, 'closed')}
                    >
                      Close
                    </button>
                  )}
                  {cycle.status === 'closed' && (
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => handleStatusChange(cycle.id, 'active')}
                    >
                      Reopen
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        .create-form {
          padding: var(--space-6);
          margin-bottom: var(--space-6);
        }

        .create-form-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: var(--space-4);
        }

        .cycles-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
        }

        .cycle-card {
          padding: var(--space-5) var(--space-6);
        }

        .cycle-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .cycle-card-title {
          font-size: var(--font-size-md);
          font-weight: 700;
        }

        .cycle-card-dates {
          font-size: var(--font-size-sm);
          color: var(--color-text-muted);
          margin-top: var(--space-1);
        }

        .cycle-card-actions {
          display: flex;
          gap: var(--space-2);
        }

        @media (max-width: 768px) {
          .create-form-grid {
            grid-template-columns: 1fr;
          }

          .cycle-card-header {
            flex-direction: column;
            align-items: flex-start;
            gap: var(--space-3);
          }
        }
      `}</style>
    </div>
  );
}
