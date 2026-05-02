import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { formatDate, getPerformanceTier, formatRole } from '@/lib/utils';
import { FEEDBACK_CATEGORIES } from '@/lib/types';
import type { FeedbackSubmission, FeedbackCycle, Profile } from '@/lib/types';
import Link from 'next/link';

export const metadata = {
  title: 'View Feedback — TeamFeedback',
};

export default async function ViewFeedbackPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: submission } = await supabase
    .from('feedback_submissions')
    .select('*')
    .eq('id', id)
    .single();

  if (!submission) {
    notFound();
  }

  const sub = submission as FeedbackSubmission;

  const { data: cycle } = await supabase
    .from('feedback_cycles')
    .select('*')
    .eq('id', sub.cycle_id)
    .single();

  const { data: engineer } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', sub.engineer_id)
    .single();

  const { data: reviewer } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', sub.reviewer_id)
    .single();

  const tier = sub.total_score ? getPerformanceTier(sub.total_score) : null;

  return (
    <div className="page-container">
      <div className="page-header">
        <Link href="/feedback" className="back-link">← Back to Feedback</Link>
        <h1 className="page-title">
          {sub.feedback_type === 'self' ? 'Self Review' : 'Leader Review'}
        </h1>
        <p className="page-subtitle">
          {(cycle as FeedbackCycle)?.title} • {(engineer as Profile)?.full_name}
          {sub.feedback_type === 'leader_review' && ` • Reviewed by ${(reviewer as Profile)?.full_name}`}
        </p>
      </div>

      {/* Score Overview */}
      {sub.total_score && tier && (
        <div className="glass-card score-overview animate-fade-in">
          <div className="score-overview-main">
            <div className="score-overview-value" style={{ color: tier.color }}>
              {sub.total_score.toFixed(2)}
            </div>
            <span className="badge" style={{ background: tier.bgColor, color: tier.color }}>
              {tier.label}
            </span>
          </div>
          {sub.outcome_rating && (
            <div className="score-overview-outcome">
              <div className="score-overview-outcome-value">{sub.outcome_rating}/5</div>
              <div className="score-overview-outcome-label">Outcome Rating</div>
            </div>
          )}
        </div>
      )}

      {/* Status Badge */}
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <span className={`badge badge-${sub.status === 'submitted' ? 'success' : 'warning'}`}>
          {sub.status === 'submitted' ? '✅ Submitted' : '📝 Draft'}
        </span>
        {sub.submitted_at && (
          <span style={{ marginLeft: 'var(--space-3)', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>
            Submitted on {formatDate(sub.submitted_at)}
          </span>
        )}
      </div>

      {/* Projects */}
      {sub.projects_modules && (
        <div className="glass-card section-card animate-fade-in">
          <h3>📋 Projects / Modules</h3>
          <p>{sub.projects_modules}</p>
        </div>
      )}

      {/* Outcome */}
      {(sub.outcome_key_impact || sub.outcome_missed_opportunities || sub.outcome_business_value) && (
        <div className="glass-card section-card animate-fade-in">
          <h3>🎯 Target Outcome</h3>
          {sub.outcome_key_impact && (
            <div className="feedback-field">
              <span className="field-label">Key Impact:</span>
              <p>{sub.outcome_key_impact}</p>
            </div>
          )}
          {sub.outcome_missed_opportunities && (
            <div className="feedback-field">
              <span className="field-label">Missed Opportunities:</span>
              <p>{sub.outcome_missed_opportunities}</p>
            </div>
          )}
          {sub.outcome_business_value && (
            <div className="feedback-field">
              <span className="field-label">Business Value:</span>
              <p>{sub.outcome_business_value}</p>
            </div>
          )}
        </div>
      )}

      {/* Category Scores */}
      <div className="glass-card section-card animate-fade-in">
        <h3>📊 Category Scores</h3>
        <div className="scores-grid">
          {FEEDBACK_CATEGORIES.map((cat) => {
            const score = sub[cat.scoreField] as number | null;
            const scoreTier = score ? getPerformanceTier(score) : null;
            return (
              <div key={cat.key} className="score-item">
                <div className="score-item-header">
                  <span>{cat.emoji} {cat.label}</span>
                  <span className="score-item-weight">{(cat.weight * 100).toFixed(0)}%</span>
                </div>
                <div
                  className="score-item-value"
                  style={{ color: scoreTier?.color || 'var(--color-text-muted)' }}
                >
                  {score || '—'}
                  <span className="score-item-max">/5</span>
                </div>
                {/* Show field values */}
                {cat.fields.map((field) => {
                  const val = sub[field.key];
                  if (!val) return null;
                  return (
                    <div key={field.key} className="feedback-field">
                      <span className="field-label">{field.label}:</span>
                      <p>{String(val)}</p>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary */}
      {(sub.key_strengths || sub.areas_of_improvement || sub.focus_next_sprint || sub.growth_recommendations) && (
        <div className="glass-card section-card animate-fade-in">
          <h3>🏁 Final Summary</h3>
          <div className="summary-grid">
            {sub.key_strengths && (
              <div className="summary-item">
                <span className="field-label">⭐ Key Strengths</span>
                <p>{sub.key_strengths}</p>
              </div>
            )}
            {sub.areas_of_improvement && (
              <div className="summary-item">
                <span className="field-label">⚠️ Areas of Improvement</span>
                <p>{sub.areas_of_improvement}</p>
              </div>
            )}
            {sub.focus_next_sprint && (
              <div className="summary-item">
                <span className="field-label">🎯 Focus Next Sprint</span>
                <p>{sub.focus_next_sprint}</p>
              </div>
            )}
            {sub.growth_recommendations && (
              <div className="summary-item">
                <span className="field-label">📈 Growth Recommendations</span>
                <p>{sub.growth_recommendations}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Self-Reflection */}
      {sub.feedback_type === 'self' && (sub.self_what_went_well || sub.self_what_to_improve || sub.self_focus_next) && (
        <div className="glass-card section-card animate-fade-in">
          <h3>🧾 Self-Reflection</h3>
          {sub.self_what_went_well && (
            <div className="feedback-field">
              <span className="field-label">What went well:</span>
              <p>{sub.self_what_went_well}</p>
            </div>
          )}
          {sub.self_what_to_improve && (
            <div className="feedback-field">
              <span className="field-label">What could be improved:</span>
              <p>{sub.self_what_to_improve}</p>
            </div>
          )}
          {sub.self_focus_next && (
            <div className="feedback-field">
              <span className="field-label">Focus next:</span>
              <p>{sub.self_focus_next}</p>
            </div>
          )}
        </div>
      )}

      {/* Manager Comments */}
      {sub.manager_comments && (
        <div className="glass-card section-card animate-fade-in">
          <h3>💬 Manager Comments</h3>
          <p>{sub.manager_comments}</p>
        </div>
      )}

      <style>{`
        .back-link {
          display: inline-block;
          font-size: var(--font-size-sm);
          color: var(--color-text-secondary);
          margin-bottom: var(--space-4);
          text-decoration: none;
        }

        .back-link:hover {
          color: var(--color-primary);
        }

        .score-overview {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--space-6);
          margin-bottom: var(--space-6);
        }

        .score-overview-main {
          display: flex;
          align-items: center;
          gap: var(--space-4);
        }

        .score-overview-value {
          font-size: 3rem;
          font-weight: 800;
          line-height: 1;
        }

        .score-overview-outcome {
          text-align: center;
        }

        .score-overview-outcome-value {
          font-size: var(--font-size-2xl);
          font-weight: 700;
        }

        .score-overview-outcome-label {
          font-size: var(--font-size-xs);
          color: var(--color-text-muted);
        }

        .section-card {
          padding: var(--space-6);
          margin-bottom: var(--space-6);
        }

        .section-card h3 {
          font-size: var(--font-size-lg);
          font-weight: 700;
          margin-bottom: var(--space-4);
          padding-bottom: var(--space-3);
          border-bottom: 1px solid var(--color-border);
        }

        .scores-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: var(--space-4);
        }

        .score-item {
          padding: var(--space-4);
          background: var(--color-bg-glass);
          border-radius: var(--radius-md);
        }

        .score-item-header {
          display: flex;
          justify-content: space-between;
          font-size: var(--font-size-sm);
          font-weight: 600;
          margin-bottom: var(--space-2);
        }

        .score-item-weight {
          color: var(--color-text-muted);
          font-size: var(--font-size-xs);
        }

        .score-item-value {
          font-size: var(--font-size-2xl);
          font-weight: 800;
        }

        .score-item-max {
          font-size: var(--font-size-base);
          color: var(--color-text-muted);
          font-weight: 400;
        }

        .feedback-field {
          margin-top: var(--space-3);
        }

        .field-label {
          font-size: var(--font-size-sm);
          font-weight: 600;
          color: var(--color-text-secondary);
        }

        .feedback-field p {
          font-size: var(--font-size-base);
          color: var(--color-text-primary);
          margin-top: var(--space-1);
          line-height: 1.6;
        }

        .summary-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: var(--space-4);
        }

        .summary-item {
          padding: var(--space-4);
          background: var(--color-bg-glass);
          border-radius: var(--radius-md);
        }

        @media (max-width: 768px) {
          .scores-grid,
          .summary-grid {
            grid-template-columns: 1fr;
          }

          .score-overview {
            flex-direction: column;
            gap: var(--space-4);
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
}
