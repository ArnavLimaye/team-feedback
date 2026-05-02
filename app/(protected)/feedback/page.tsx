import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { formatDate, getPerformanceTier } from '@/lib/utils';
import type { FeedbackCycle, FeedbackSubmission } from '@/lib/types';

export const metadata = {
  title: 'My Feedback — TeamFeedback',
  description: 'View all your feedback submissions across cycles.',
};

export default async function FeedbackListPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Get all submissions where user is the engineer
  const { data: submissions } = await supabase
    .from('feedback_submissions')
    .select('*')
    .eq('engineer_id', user!.id)
    .order('created_at', { ascending: false });

  const { data: cycles } = await supabase
    .from('feedback_cycles')
    .select('*')
    .order('start_date', { ascending: false });

  const activeCycle = (cycles || []).find((c: FeedbackCycle) => c.status === 'active');

  // Check if user has a draft or no submission for active cycle
  const activeCycleSelfSub = activeCycle
    ? (submissions || []).find(
        (s: FeedbackSubmission) => s.cycle_id === activeCycle.id && s.feedback_type === 'self'
      )
    : null;

  const canSubmitNew = activeCycle && !activeCycleSelfSub;
  const hasDraft = activeCycleSelfSub?.status === 'draft';

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">My Feedback</h1>
          <p className="page-subtitle">Track your feedback submissions and scores across all cycles.</p>
        </div>
        {(canSubmitNew || hasDraft) && (
          <Link
            href={hasDraft ? `/feedback/${activeCycleSelfSub!.id}` : '/feedback/new'}
            className="btn btn-primary"
          >
            {hasDraft ? '📝 Continue Draft' : '📝 New Feedback'}
          </Link>
        )}
      </div>

      {(!submissions || submissions.length === 0) ? (
        <div className="glass-card">
          <div className="empty-state">
            <span className="empty-state-icon">📝</span>
            <h3 className="empty-state-title">No feedback yet</h3>
            <p className="empty-state-text">
              You haven&apos;t submitted any feedback yet. Start by submitting your first self-review.
            </p>
            {canSubmitNew && (
              <Link href="/feedback/new" className="btn btn-primary" style={{ marginTop: 'var(--space-4)' }}>
                Submit Feedback
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="feedback-list">
          {(cycles || []).map((cycle: FeedbackCycle) => {
            const cycleSubs = (submissions || []).filter(
              (s: FeedbackSubmission) => s.cycle_id === cycle.id
            );
            if (cycleSubs.length === 0) return null;

            return (
              <div key={cycle.id} className="glass-card cycle-group animate-fade-in">
                <div className="cycle-group-header">
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                      <h3 className="cycle-group-title">{cycle.title}</h3>
                      <span className={`badge badge-${cycle.status === 'active' ? 'primary' : cycle.status === 'closed' ? 'success' : 'warning'}`}>
                        {cycle.status}
                      </span>
                    </div>
                    <p className="cycle-group-dates">
                      {formatDate(cycle.start_date)} — {formatDate(cycle.end_date)}
                    </p>
                  </div>
                </div>

                <div className="submissions-list">
                  {cycleSubs.map((sub: FeedbackSubmission) => {
                    const tier = sub.total_score ? getPerformanceTier(sub.total_score) : null;
                    return (
                      <Link
                        key={sub.id}
                        href={`/feedback/${sub.id}`}
                        className="submission-row"
                      >
                        <div className="submission-type">
                          <span className="submission-type-icon">
                            {sub.feedback_type === 'self' ? '🧾' : '👤'}
                          </span>
                          <div>
                            <span className="submission-type-label">
                              {sub.feedback_type === 'self' ? 'Self Review' : 'Leader Review'}
                            </span>
                            <span className="submission-date">
                              {sub.submitted_at ? formatDate(sub.submitted_at) : 'In Progress'}
                            </span>
                          </div>
                        </div>

                        <div className="submission-meta">
                          <span className={`badge badge-${sub.status === 'submitted' ? 'success' : 'warning'}`}>
                            {sub.status === 'submitted' ? '✅ Submitted' : '📝 Draft'}
                          </span>
                          {tier && sub.total_score && (
                            <span
                              className="submission-score"
                              style={{ color: tier.color }}
                            >
                              {sub.total_score.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        .feedback-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-6);
        }

        .cycle-group {
          padding: var(--space-6);
        }

        .cycle-group-header {
          margin-bottom: var(--space-4);
          padding-bottom: var(--space-4);
          border-bottom: 1px solid var(--color-border);
        }

        .cycle-group-title {
          font-size: var(--font-size-lg);
          font-weight: 700;
        }

        .cycle-group-dates {
          font-size: var(--font-size-sm);
          color: var(--color-text-muted);
          margin-top: var(--space-1);
        }

        .submissions-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
        }

        .submission-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--space-4);
          border-radius: var(--radius-md);
          background: var(--color-bg-glass);
          text-decoration: none;
          color: var(--color-text-primary);
          transition: all var(--transition-fast);
        }

        .submission-row:hover {
          background: var(--color-bg-card-hover);
          transform: translateX(4px);
        }

        .submission-type {
          display: flex;
          align-items: center;
          gap: var(--space-3);
        }

        .submission-type-icon {
          font-size: 1.25rem;
        }

        .submission-type-label {
          display: block;
          font-weight: 600;
          font-size: var(--font-size-base);
        }

        .submission-date {
          display: block;
          font-size: var(--font-size-xs);
          color: var(--color-text-muted);
        }

        .submission-meta {
          display: flex;
          align-items: center;
          gap: var(--space-4);
        }

        .submission-score {
          font-size: var(--font-size-xl);
          font-weight: 800;
        }
      `}</style>
    </div>
  );
}
