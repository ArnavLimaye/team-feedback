import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import type { Profile } from '@/lib/types';
import { getInitials, formatRole } from '@/lib/utils';

export const metadata = {
  title: 'Team — TeamFeedback',
  description: 'View and manage your team members.',
};

export default async function TeamPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user!.id)
    .single();

  if (!profile || (profile.role !== 'team_lead' && profile.role !== 'admin')) {
    redirect('/dashboard');
  }

  const teamQuery = profile.role === 'admin'
    ? supabase.from('profiles').select('*').order('team').order('full_name')
    : supabase.from('profiles').select('*').eq('team', profile.team).order('full_name');

  const { data: members } = await teamQuery;
  const typedMembers = (members || []) as Profile[];

  // Get active cycle
  const { data: activeCycle } = await supabase
    .from('feedback_cycles')
    .select('id')
    .eq('status', 'active')
    .single();

  // Group by team (for admin)
  const teamGroups = typedMembers.reduce((acc, member) => {
    const t = member.team;
    if (!acc[t]) acc[t] = [];
    acc[t].push(member);
    return acc;
  }, {} as Record<string, Profile[]>);

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Team Members</h1>
        <p className="page-subtitle">
          {profile.role === 'admin'
            ? `All team members across all teams (${typedMembers.length} total)`
            : `${profile.team} team members (${typedMembers.length} total)`}
        </p>
      </div>

      {Object.entries(teamGroups).map(([teamName, teamMembers]) => (
        <div key={teamName} className="team-group animate-fade-in">
          {profile.role === 'admin' && (
            <h2 className="team-group-title">
              {teamName.charAt(0).toUpperCase() + teamName.slice(1)} Team
              <span className="team-group-count">{teamMembers.length}</span>
            </h2>
          )}

          <div className="members-grid">
            {teamMembers.map((member) => (
              <div key={member.id} className="glass-card member-card">
                <div className="member-card-top">
                  <div className="avatar avatar-lg">{getInitials(member.full_name)}</div>
                  <div className="member-info">
                    <h3 className="member-name">{member.full_name}</h3>
                    <p className="member-email">{member.email}</p>
                    <span className={`badge badge-${member.role === 'team_lead' ? 'primary' : member.role === 'admin' ? 'danger' : 'info'}`}>
                      {formatRole(member.role)}
                    </span>
                  </div>
                </div>
                {member.id !== profile.id && member.role === 'engineer' && activeCycle && (
                  <div className="member-card-actions">
                    <Link
                      href={`/feedback/review/${member.id}?cycle=${activeCycle.id}`}
                      className="btn btn-primary btn-sm"
                    >
                      📝 Review
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      <style>{`
        .team-group {
          margin-bottom: var(--space-8);
        }

        .team-group-title {
          font-size: var(--font-size-xl);
          font-weight: 700;
          margin-bottom: var(--space-4);
          display: flex;
          align-items: center;
          gap: var(--space-3);
        }

        .team-group-count {
          font-size: var(--font-size-sm);
          color: var(--color-text-muted);
          font-weight: 400;
        }

        .members-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: var(--space-4);
        }

        .member-card {
          padding: var(--space-5);
        }

        .member-card-top {
          display: flex;
          align-items: center;
          gap: var(--space-4);
        }

        .member-info {
          flex: 1;
          min-width: 0;
        }

        .member-name {
          font-size: var(--font-size-md);
          font-weight: 700;
        }

        .member-email {
          font-size: var(--font-size-xs);
          color: var(--color-text-muted);
          margin-bottom: var(--space-2);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .member-card-actions {
          margin-top: var(--space-4);
          padding-top: var(--space-3);
          border-top: 1px solid var(--color-border);
          display: flex;
          gap: var(--space-2);
        }
      `}</style>
    </div>
  );
}
