'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar, Cell,
} from 'recharts';
import type { Profile, FeedbackCycle, FeedbackSubmission } from '@/lib/types';
import { FEEDBACK_CATEGORIES } from '@/lib/types';
import {
  getPerformanceTier, formatDate, getDaysRemaining, getCycleProgress,
  getInitials, formatRole,
} from '@/lib/utils';

interface DashboardClientProps {
  profile: Profile;
  cycles: FeedbackCycle[];
  activeCycle?: FeedbackCycle;
  mySubmissions: FeedbackSubmission[];
  teamMembers: Profile[];
  teamSubmissions: FeedbackSubmission[];
}

export default function DashboardClient({
  profile,
  cycles,
  activeCycle,
  mySubmissions,
  teamMembers,
  teamSubmissions,
}: DashboardClientProps) {
  // Score trend data for line chart
  const trendData = useMemo(() => {
    return mySubmissions
      .filter((s) => s.feedback_type === 'self' && s.total_score !== null)
      .map((s) => {
        const cycle = cycles.find((c) => c.id === s.cycle_id);
        return {
          cycle: cycle ? `Cycle ${cycle.cycle_number}` : 'Unknown',
          date: cycle ? formatDate(cycle.start_date) : '',
          selfScore: Number(s.total_score?.toFixed(2)),
        };
      });
  }, [mySubmissions, cycles]);

  // Leader review scores overlaid on trend
  const leaderTrendData = useMemo(() => {
    const leaderReviews = mySubmissions.filter(
      (s) => s.feedback_type === 'leader_review' && s.total_score !== null
    );

    return trendData.map((point) => {
      const cycle = cycles.find((c) => `Cycle ${c.cycle_number}` === point.cycle);
      const leaderReview = leaderReviews.find((r) => r.cycle_id === cycle?.id);
      return {
        ...point,
        leaderScore: leaderReview ? Number(leaderReview.total_score?.toFixed(2)) : undefined,
      };
    });
  }, [trendData, mySubmissions, cycles]);

  // Latest self-feedback for radar chart
  const latestSelf = useMemo(() => {
    const selfFeedbacks = mySubmissions.filter(
      (s) => s.feedback_type === 'self' && s.total_score !== null
    );
    return selfFeedbacks[selfFeedbacks.length - 1];
  }, [mySubmissions]);

  // Radar chart data
  const radarData = useMemo(() => {
    if (!latestSelf) return [];
    return FEEDBACK_CATEGORIES.map((cat) => ({
      category: cat.label.replace('& ', '&\n'),
      score: (latestSelf[cat.scoreField] as number) || 0,
      fullMark: 5,
    }));
  }, [latestSelf]);

  // Latest score and performance tier
  const latestScore = latestSelf?.total_score ?? 0;
  const performanceTier = getPerformanceTier(latestScore);

  // Cycle progress
  const cycleProgress = activeCycle
    ? getCycleProgress(activeCycle.start_date, activeCycle.end_date)
    : 0;
  const daysRemaining = activeCycle ? getDaysRemaining(activeCycle.end_date) : 0;

  // Check if current user has submitted for active cycle
  const hasSubmittedThisCycle = activeCycle
    ? mySubmissions.some(
        (s) => s.cycle_id === activeCycle.id && s.feedback_type === 'self' && s.status === 'submitted'
      )
    : false;

  // Team overview data (for leads/admins)
  const teamOverview = useMemo(() => {
    if (!activeCycle) return [];
    return teamMembers
      .filter((m) => m.id !== profile.id)
      .map((member) => {
        const selfSub = teamSubmissions.find(
          (s) => s.engineer_id === member.id && s.feedback_type === 'self'
        );
        const leaderSub = teamSubmissions.find(
          (s) => s.engineer_id === member.id && s.feedback_type === 'leader_review'
        );
        return {
          member,
          selfSubmitted: selfSub?.status === 'submitted',
          selfScore: selfSub?.total_score,
          leaderReviewed: leaderSub?.status === 'submitted',
          leaderScore: leaderSub?.total_score,
        };
      });
  }, [teamMembers, teamSubmissions, activeCycle, profile.id]);

  const pendingReviews = teamOverview.filter((t) => t.selfSubmitted && !t.leaderReviewed);

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">
          Welcome back, {profile.full_name.split(' ')[0]}! Here&apos;s your feedback overview.
        </p>
      </div>

      {/* Active Cycle Banner */}
      {activeCycle ? (
        <div className="glass-card cycle-banner animate-fade-in">
          <div className="cycle-banner-content">
            <div className="cycle-banner-info">
              <div className="cycle-banner-badge">
                <span className="badge badge-primary">Active Cycle</span>
                <span className="cycle-banner-title">{activeCycle.title}</span>
              </div>
              <p className="cycle-banner-dates">
                {formatDate(activeCycle.start_date)} — {formatDate(activeCycle.end_date)}
              </p>
            </div>
            <div className="cycle-banner-stats">
              <div className="cycle-days">
                <span className="cycle-days-number">{daysRemaining}</span>
                <span className="cycle-days-label">days left</span>
              </div>
            </div>
          </div>
          <div className="cycle-progress-wrapper">
            <div className="progress-bar">
              <div className="progress-bar-fill" style={{ width: `${cycleProgress}%` }} />
            </div>
          </div>
          {!hasSubmittedThisCycle && (
            <Link href="/feedback/new" className="btn btn-primary cycle-banner-cta">
              📝 Submit Feedback
            </Link>
          )}
          {hasSubmittedThisCycle && (
            <span className="badge badge-success cycle-banner-status">✅ Submitted</span>
          )}
        </div>
      ) : (
        <div className="glass-card cycle-banner empty-cycle animate-fade-in">
          <div className="empty-state" style={{ padding: 'var(--space-8)' }}>
            <span className="empty-state-icon">🔄</span>
            <h3 className="empty-state-title">No Active Cycle</h3>
            <p className="empty-state-text">
              {profile.role === 'engineer'
                ? 'There is no active feedback cycle right now. Your team lead will create one soon.'
                : 'Create a new feedback cycle to start collecting feedback.'}
            </p>
            {(profile.role === 'team_lead' || profile.role === 'admin') && (
              <Link href="/cycles" className="btn btn-primary" style={{ marginTop: 'var(--space-4)' }}>
                Create Cycle
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid-4 stats-grid">
        <div className="glass-card stat-card animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <div className="stat-value" style={{ color: performanceTier.color }}>
            {latestScore > 0 ? latestScore.toFixed(2) : '—'}
          </div>
          <div className="stat-label">Latest Score</div>
          {latestScore > 0 && (
            <span
              className="badge"
              style={{
                background: performanceTier.bgColor,
                color: performanceTier.color,
                marginTop: 'var(--space-2)',
              }}
            >
              {performanceTier.label}
            </span>
          )}
        </div>

        <div className="glass-card stat-card animate-fade-in" style={{ animationDelay: '0.15s' }}>
          <div className="stat-value">{mySubmissions.filter((s) => s.feedback_type === 'self').length}</div>
          <div className="stat-label">Self Reviews</div>
        </div>

        <div className="glass-card stat-card animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <div className="stat-value">{mySubmissions.filter((s) => s.feedback_type === 'leader_review').length}</div>
          <div className="stat-label">Leader Reviews</div>
        </div>

        <div className="glass-card stat-card animate-fade-in" style={{ animationDelay: '0.25s' }}>
          <div className="stat-value">{cycles.length}</div>
          <div className="stat-label">Total Cycles</div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid-2 charts-grid">
        {/* Score Trend */}
        <div className="glass-card chart-card animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <h3 className="chart-title">📈 Score Trend</h3>
          <p className="chart-subtitle">Your total score across feedback cycles</p>
          {leaderTrendData.length > 0 ? (
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={leaderTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="cycle" tick={{ fill: '#8888a0', fontSize: 12 }} />
                  <YAxis domain={[0, 5]} tick={{ fill: '#8888a0', fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      background: '#1a1a28',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '10px',
                      fontSize: '13px',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="selfScore"
                    stroke="#6366f1"
                    strokeWidth={2.5}
                    dot={{ fill: '#6366f1', r: 5 }}
                    name="Self Score"
                  />
                  <Line
                    type="monotone"
                    dataKey="leaderScore"
                    stroke="#22c55e"
                    strokeWidth={2.5}
                    dot={{ fill: '#22c55e', r: 5 }}
                    strokeDasharray="6 3"
                    name="Leader Score"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="empty-state" style={{ padding: 'var(--space-8) 0' }}>
              <span className="empty-state-icon">📊</span>
              <p className="empty-state-text">Submit feedback to see your score trend</p>
            </div>
          )}
        </div>

        {/* Category Breakdown Radar */}
        <div className="glass-card chart-card animate-fade-in" style={{ animationDelay: '0.35s' }}>
          <h3 className="chart-title">🎯 Category Breakdown</h3>
          <p className="chart-subtitle">Latest scores across all 10 categories</p>
          {radarData.length > 0 ? (
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={280}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="rgba(255,255,255,0.08)" />
                  <PolarAngleAxis
                    dataKey="category"
                    tick={{ fill: '#8888a0', fontSize: 10 }}
                  />
                  <PolarRadiusAxis
                    angle={90}
                    domain={[0, 5]}
                    tick={{ fill: '#555566', fontSize: 10 }}
                  />
                  <Radar
                    name="Score"
                    dataKey="score"
                    stroke="#6366f1"
                    fill="rgba(99, 102, 241, 0.2)"
                    strokeWidth={2}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="empty-state" style={{ padding: 'var(--space-8) 0' }}>
              <span className="empty-state-icon">🎯</span>
              <p className="empty-state-text">Submit feedback to see your category breakdown</p>
            </div>
          )}
        </div>
      </div>

      {/* Team Lead / Admin: Team Overview */}
      {(profile.role === 'team_lead' || profile.role === 'admin') && activeCycle && (
        <div className="animate-fade-in" style={{ animationDelay: '0.4s' }}>
          {/* Pending Reviews Alert */}
          {pendingReviews.length > 0 && (
            <div className="glass-card pending-alert">
              <span>⏳</span>
              <span>
                <strong>{pendingReviews.length} pending review{pendingReviews.length > 1 ? 's' : ''}</strong> — team members have submitted self-feedback and are waiting for your review.
              </span>
            </div>
          )}

          {/* Team Overview Table */}
          <div className="glass-card team-table-card">
            <h3 className="chart-title">👥 Team Overview — {activeCycle.title}</h3>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Member</th>
                    <th>Role</th>
                    <th>Self Feedback</th>
                    <th>Leader Review</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {teamOverview.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--color-text-muted)' }}>
                        No team members found
                      </td>
                    </tr>
                  ) : (
                    teamOverview.map(({ member, selfSubmitted, selfScore, leaderReviewed, leaderScore }) => (
                      <tr key={member.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                            <div className="avatar avatar-sm">{getInitials(member.full_name)}</div>
                            <div>
                              <div style={{ fontWeight: 600 }}>{member.full_name}</div>
                              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>{member.email}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="badge badge-info">{formatRole(member.role)}</span>
                        </td>
                        <td>
                          {selfSubmitted ? (
                            <span className="badge badge-success">
                              ✅ {selfScore?.toFixed(2)}
                            </span>
                          ) : (
                            <span className="badge badge-warning">⏳ Pending</span>
                          )}
                        </td>
                        <td>
                          {leaderReviewed ? (
                            <span className="badge badge-success">
                              ✅ {leaderScore?.toFixed(2)}
                            </span>
                          ) : (
                            <span className="badge badge-warning">⏳ Pending</span>
                          )}
                        </td>
                        <td>
                          {selfSubmitted && !leaderReviewed ? (
                            <Link
                              href={`/feedback/review/${member.id}?cycle=${activeCycle.id}`}
                              className="btn btn-primary btn-sm"
                            >
                              Review
                            </Link>
                          ) : leaderReviewed ? (
                            <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>Done</span>
                          ) : (
                            <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>Waiting</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Team Score Distribution */}
          {teamOverview.some((t) => t.selfScore) && (
            <div className="glass-card chart-card" style={{ marginTop: 'var(--space-6)' }}>
              <h3 className="chart-title">📊 Team Score Distribution</h3>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart
                    data={teamOverview
                      .filter((t) => t.selfScore)
                      .map((t) => ({
                        name: t.member.full_name.split(' ')[0],
                        score: Number(t.selfScore?.toFixed(2)),
                      }))}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="name" tick={{ fill: '#8888a0', fontSize: 12 }} />
                    <YAxis domain={[0, 5]} tick={{ fill: '#8888a0', fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        background: '#1a1a28',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '10px',
                        fontSize: '13px',
                      }}
                    />
                    <Bar dataKey="score" radius={[6, 6, 0, 0]}>
                      {teamOverview
                        .filter((t) => t.selfScore)
                        .map((t, idx) => {
                          const tier = getPerformanceTier(t.selfScore || 0);
                          return <Cell key={idx} fill={tier.color} />;
                        })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        .stats-grid {
          margin: var(--space-6) 0;
        }

        .charts-grid {
          margin-bottom: var(--space-6);
        }

        .chart-card {
          padding: var(--space-6);
        }

        .chart-title {
          font-size: var(--font-size-lg);
          font-weight: 700;
          margin-bottom: var(--space-1);
        }

        .chart-subtitle {
          font-size: var(--font-size-sm);
          color: var(--color-text-muted);
          margin-bottom: var(--space-4);
        }

        .chart-container {
          width: 100%;
        }

        .cycle-banner {
          padding: var(--space-6);
          margin-bottom: var(--space-6);
          position: relative;
        }

        .cycle-banner-content {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: var(--space-4);
        }

        .cycle-banner-badge {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          margin-bottom: var(--space-2);
        }

        .cycle-banner-title {
          font-size: var(--font-size-lg);
          font-weight: 700;
        }

        .cycle-banner-dates {
          font-size: var(--font-size-sm);
          color: var(--color-text-secondary);
        }

        .cycle-days {
          text-align: center;
        }

        .cycle-days-number {
          display: block;
          font-size: var(--font-size-3xl);
          font-weight: 800;
          color: var(--color-primary);
          line-height: 1;
        }

        .cycle-days-label {
          font-size: var(--font-size-xs);
          color: var(--color-text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .cycle-progress-wrapper {
          margin-bottom: var(--space-4);
        }

        .cycle-banner-cta {
          text-decoration: none;
        }

        .cycle-banner-status {
          display: inline-block;
        }

        .empty-cycle {
          padding: 0;
        }

        .pending-alert {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          padding: var(--space-4) var(--space-5);
          margin-bottom: var(--space-6);
          background: var(--color-warning-bg);
          border-color: rgba(234, 179, 8, 0.2);
          color: var(--color-warning);
        }

        .team-table-card {
          padding: var(--space-6);
          margin-bottom: var(--space-6);
        }

        @media (max-width: 768px) {
          .cycle-banner-content {
            flex-direction: column;
            gap: var(--space-4);
          }
        }
      `}</style>
    </div>
  );
}
