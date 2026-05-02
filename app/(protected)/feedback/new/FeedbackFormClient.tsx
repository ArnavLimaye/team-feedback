'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Profile, FeedbackCycle, FeedbackSubmission, FeedbackType } from '@/lib/types';
import { FEEDBACK_CATEGORIES, FEEDBACK_FORM_STEPS } from '@/lib/types';
import { calculateTotalScore, getPerformanceTier } from '@/lib/utils';

interface FeedbackFormClientProps {
  profile: Profile;
  cycle: FeedbackCycle;
  existingId?: string;
  feedbackType: FeedbackType;
  engineerProfile?: Profile; // For leader reviews
}

type FormData = Record<string, string | number | null>;

export default function FeedbackFormClient({
  profile,
  cycle,
  existingId,
  feedbackType,
  engineerProfile,
}: FeedbackFormClientProps) {
  const router = useRouter();
  const supabase = createClient();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<FormData>({});
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [feedbackId, setFeedbackId] = useState<string | undefined>(existingId);

  const isLeaderReview = feedbackType === 'leader_review';
  const targetEngineer = isLeaderReview ? engineerProfile : profile;

  // Load existing draft
  useEffect(() => {
    if (feedbackId) {
      (async () => {
        const { data } = await supabase
          .from('feedback_submissions')
          .select('*')
          .eq('id', feedbackId)
          .single();
        if (data) {
          const fields: FormData = {};
          Object.entries(data).forEach(([key, value]) => {
            if (value !== null && key !== 'id' && key !== 'total_score') {
              fields[key] = value as string | number;
            }
          });
          setFormData(fields);
        }
      })();
    }
  }, [feedbackId, supabase]);

  // Update field
  const updateField = useCallback((key: string, value: string | number | null) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }, []);

  // Auto-save draft
  const saveDraft = useCallback(async () => {
    setSaving(true);
    try {
      const rawPayload: Record<string, unknown> = {
        ...formData,
        cycle_id: cycle.id,
        engineer_id: targetEngineer!.id,
        reviewer_id: profile.id,
        feedback_type: feedbackType,
        status: 'draft' as const,
      };

      // Remove computed / read-only fields
      delete rawPayload.total_score;
      delete rawPayload.id;
      delete rawPayload.created_at;
      delete rawPayload.updated_at;

      const payload = rawPayload;

      if (feedbackId) {
        await supabase
          .from('feedback_submissions')
          .update(payload)
          .eq('id', feedbackId);
      } else {
        const { data } = await supabase
          .from('feedback_submissions')
          .insert(payload)
          .select('id')
          .single();
        if (data) setFeedbackId(data.id);
      }
      setLastSaved(new Date());
    } catch (err) {
      console.error('Save failed:', err);
    }
    setSaving(false);
  }, [formData, cycle.id, targetEngineer, profile.id, feedbackType, feedbackId, supabase]);

  // Auto-save on step change
  useEffect(() => {
    if (Object.keys(formData).length > 0) {
      const timer = setTimeout(saveDraft, 1000);
      return () => clearTimeout(timer);
    }
  }, [currentStep]); // eslint-disable-line react-hooks/exhaustive-deps

  // Submit final
  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const rawPayload: Record<string, unknown> = {
        ...formData,
        cycle_id: cycle.id,
        engineer_id: targetEngineer!.id,
        reviewer_id: profile.id,
        feedback_type: feedbackType,
        status: 'submitted' as const,
        submitted_at: new Date().toISOString(),
      };

      delete rawPayload.total_score;
      delete rawPayload.id;
      delete rawPayload.created_at;
      delete rawPayload.updated_at;

      const payload = rawPayload;

      if (feedbackId) {
        await supabase
          .from('feedback_submissions')
          .update(payload)
          .eq('id', feedbackId);
      } else {
        await supabase
          .from('feedback_submissions')
          .insert(payload);
      }

      router.push('/feedback?success=submitted');
      router.refresh();
    } catch (err) {
      console.error('Submit failed:', err);
    }
    setSubmitting(false);
  };

  const steps = isLeaderReview
    ? FEEDBACK_FORM_STEPS.filter((s) => s.key !== 'reflection')
    : FEEDBACK_FORM_STEPS;

  const totalScore = calculateTotalScore(formData as unknown as Partial<FeedbackSubmission>);
  const tier = getPerformanceTier(totalScore);

  // Score input component
  const ScoreInput = ({ field, descriptions }: { field: string; descriptions: { 1: string; 3: string; 5: string } }) => {
    const value = formData[field] as number | null;
    return (
      <div className="score-slider">
        <div className="score-slider-track">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              className={`score-slider-dot ${value === n ? 'active' : ''}`}
              onClick={() => updateField(field, n)}
            >
              {n}
            </button>
          ))}
        </div>
        <div className="score-slider-labels">
          <span>{descriptions[1]}</span>
          <span>{descriptions[3]}</span>
          <span>{descriptions[5]}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">
          {isLeaderReview ? `Review: ${engineerProfile?.full_name}` : 'Self Feedback'}
        </h1>
        <p className="page-subtitle">
          {cycle.title} • {isLeaderReview ? 'Leader Review' : 'Self Assessment'}
        </p>
      </div>

      {/* Save indicator */}
      <div className="save-indicator">
        {saving && <span className="save-status">💾 Saving...</span>}
        {lastSaved && !saving && (
          <span className="save-status saved">
            ✅ Saved {lastSaved.toLocaleTimeString()}
          </span>
        )}
      </div>

      {/* Stepper */}
      <div className="stepper">
        {steps.map((step, idx) => (
          <div key={step.key} style={{ display: 'flex', alignItems: 'center' }}>
            <button
              type="button"
              className={`stepper-step ${idx === currentStep ? 'active' : ''} ${idx < currentStep ? 'completed' : ''}`}
              onClick={() => { saveDraft(); setCurrentStep(idx); }}
            >
              <span>{step.emoji}</span>
              <span className="stepper-step-label">{step.label}</span>
            </button>
            {idx < steps.length - 1 && <div className="stepper-connector" />}
          </div>
        ))}
      </div>

      {/* Progress */}
      <div className="progress-bar" style={{ marginBottom: 'var(--space-6)' }}>
        <div
          className="progress-bar-fill"
          style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
        />
      </div>

      {/* Form Content */}
      <div className="glass-card form-card animate-fade-in" key={currentStep}>
        {/* Step 0: Basic Info */}
        {steps[currentStep].key === 'basic' && (
          <div className="form-step">
            <h2 className="form-step-title">📋 Basic Information</h2>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Engineer Name</label>
                <input
                  className="form-input"
                  value={targetEngineer?.full_name || ''}
                  disabled
                />
              </div>
              <div className="form-group">
                <label className="form-label">Review Period</label>
                <input className="form-input" value={cycle.title} disabled />
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Projects / Modules Worked On</label>
                <textarea
                  className="form-textarea"
                  placeholder="List the projects and modules you worked on during this period..."
                  value={(formData.projects_modules as string) || ''}
                  onChange={(e) => updateField('projects_modules', e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 1: Outcome */}
        {steps[currentStep].key === 'outcome' && (
          <div className="form-step">
            <h2 className="form-step-title">🎯 Final Target Outcome</h2>
            <div className="benchmarks-box">
              <h4>Expected Outcome for This Role:</h4>
              <ul>
                <li>Deliver bug-free, production-grade UI</li>
                <li>Build scalable, reusable, config-driven frontend systems</li>
                <li>Improve velocity without compromising quality</li>
                <li>Demonstrate strong product thinking and ownership</li>
                <li>Contribute to a high-performing, knowledge-sharing team</li>
              </ul>
            </div>

            <div className="form-group">
              <label className="form-label">Outcome Rating</label>
              <ScoreInput
                field="outcome_rating"
                descriptions={{
                  1: 'Output without impact',
                  3: 'Good but limited long-term impact',
                  5: 'High-impact (scalable, reliable)',
                }}
              />
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Key Impact Delivered</label>
                <textarea
                  className="form-textarea"
                  placeholder="What key impact did you deliver..."
                  value={(formData.outcome_key_impact as string) || ''}
                  onChange={(e) => updateField('outcome_key_impact', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Missed Opportunities</label>
                <textarea
                  className="form-textarea"
                  placeholder="What could have been done better..."
                  value={(formData.outcome_missed_opportunities as string) || ''}
                  onChange={(e) => updateField('outcome_missed_opportunities', e.target.value)}
                />
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Business/Product Value Contribution</label>
                <textarea
                  className="form-textarea"
                  placeholder="How did your work contribute to business value..."
                  value={(formData.outcome_business_value as string) || ''}
                  onChange={(e) => updateField('outcome_business_value', e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Categories 1-5 */}
        {steps[currentStep].key === 'categories_1_5' && (
          <div className="form-step">
            <h2 className="form-step-title">📊 Categories 1–5</h2>
            {FEEDBACK_CATEGORIES.slice(0, 5).map((cat) => (
              <div key={cat.key} className="category-section">
                <div className="category-header">
                  <h3>{cat.emoji} {cat.label} ({(cat.weight * 100).toFixed(0)}%)</h3>
                </div>
                <div className="benchmarks-box">
                  <h4>🎯 Target Benchmarks:</h4>
                  <ul>
                    {cat.benchmarks.map((b, i) => <li key={i}>{b}</li>)}
                  </ul>
                </div>
                <div className="form-group">
                  <label className="form-label">Score (1–5)</label>
                  <ScoreInput field={cat.scoreField} descriptions={cat.scoreDescriptions} />
                </div>
                <div className="form-grid">
                  {cat.fields.map((field) => (
                    <div key={field.key} className="form-group">
                      <label className="form-label">{field.label}</label>
                      {field.type === 'textarea' ? (
                        <textarea
                          className="form-textarea"
                          placeholder={field.placeholder}
                          value={(formData[field.key] as string) || ''}
                          onChange={(e) => updateField(field.key, e.target.value)}
                        />
                      ) : (
                        <input
                          type="number"
                          className="form-input"
                          placeholder={field.placeholder}
                          value={(formData[field.key] as number) ?? ''}
                          onChange={(e) => updateField(field.key, e.target.value ? Number(e.target.value) : null)}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Step 3: Categories 6-10 */}
        {steps[currentStep].key === 'categories_6_10' && (
          <div className="form-step">
            <h2 className="form-step-title">📈 Categories 6–10</h2>
            {FEEDBACK_CATEGORIES.slice(5).map((cat) => (
              <div key={cat.key} className="category-section">
                <div className="category-header">
                  <h3>{cat.emoji} {cat.label} ({(cat.weight * 100).toFixed(0)}%)</h3>
                </div>
                <div className="benchmarks-box">
                  <h4>🎯 Target Benchmarks:</h4>
                  <ul>
                    {cat.benchmarks.map((b, i) => <li key={i}>{b}</li>)}
                  </ul>
                </div>
                <div className="form-group">
                  <label className="form-label">Score (1–5)</label>
                  <ScoreInput field={cat.scoreField} descriptions={cat.scoreDescriptions} />
                </div>
                <div className="form-grid">
                  {cat.fields.map((field) => (
                    <div key={field.key} className="form-group">
                      <label className="form-label">{field.label}</label>
                      {field.type === 'textarea' ? (
                        <textarea
                          className="form-textarea"
                          placeholder={field.placeholder}
                          value={(formData[field.key] as string) || ''}
                          onChange={(e) => updateField(field.key, e.target.value)}
                        />
                      ) : (
                        <input
                          type="number"
                          className="form-input"
                          placeholder={field.placeholder}
                          value={(formData[field.key] as number) ?? ''}
                          onChange={(e) => updateField(field.key, e.target.value ? Number(e.target.value) : null)}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Step 4: Summary */}
        {steps[currentStep].key === 'summary' && (
          <div className="form-step">
            <h2 className="form-step-title">🏁 Final Summary</h2>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">⭐ Key Strengths</label>
                <textarea
                  className="form-textarea"
                  placeholder="What are the key strengths observed..."
                  value={(formData.key_strengths as string) || ''}
                  onChange={(e) => updateField('key_strengths', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">⚠️ Areas of Improvement</label>
                <textarea
                  className="form-textarea"
                  placeholder="What areas need improvement..."
                  value={(formData.areas_of_improvement as string) || ''}
                  onChange={(e) => updateField('areas_of_improvement', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">🎯 Focus for Next Sprint / Month</label>
                <textarea
                  className="form-textarea"
                  placeholder="What to focus on next..."
                  value={(formData.focus_next_sprint as string) || ''}
                  onChange={(e) => updateField('focus_next_sprint', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">📈 Growth Recommendations</label>
                <textarea
                  className="form-textarea"
                  placeholder="Recommendations for growth..."
                  value={(formData.growth_recommendations as string) || ''}
                  onChange={(e) => updateField('growth_recommendations', e.target.value)}
                />
              </div>
            </div>

            {isLeaderReview && (
              <div className="form-group" style={{ marginTop: 'var(--space-6)' }}>
                <label className="form-label">💬 Manager Comments</label>
                <textarea
                  className="form-textarea"
                  placeholder="Additional comments for the engineer..."
                  value={(formData.manager_comments as string) || ''}
                  onChange={(e) => updateField('manager_comments', e.target.value)}
                  style={{ minHeight: '150px' }}
                />
              </div>
            )}
          </div>
        )}

        {/* Step 5: Self-Reflection */}
        {steps[currentStep].key === 'reflection' && (
          <div className="form-step">
            <h2 className="form-step-title">🧾 Self-Reflection</h2>
            <div className="form-grid">
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">What went well</label>
                <textarea
                  className="form-textarea"
                  placeholder="Reflect on what went well this period..."
                  value={(formData.self_what_went_well as string) || ''}
                  onChange={(e) => updateField('self_what_went_well', e.target.value)}
                  style={{ minHeight: '120px' }}
                />
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">What could be improved</label>
                <textarea
                  className="form-textarea"
                  placeholder="Reflect on what could be improved..."
                  value={(formData.self_what_to_improve as string) || ''}
                  onChange={(e) => updateField('self_what_to_improve', e.target.value)}
                  style={{ minHeight: '120px' }}
                />
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">What I will focus on next</label>
                <textarea
                  className="form-textarea"
                  placeholder="What will you focus on in the next period..."
                  value={(formData.self_focus_next as string) || ''}
                  onChange={(e) => updateField('self_focus_next', e.target.value)}
                  style={{ minHeight: '120px' }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 6: Review & Submit */}
        {steps[currentStep].key === 'review' && (
          <div className="form-step">
            <h2 className="form-step-title">✅ Review & Submit</h2>

            {/* Score Summary */}
            <div className="review-score-card">
              <div className="review-score-value" style={{ color: tier.color }}>
                {totalScore.toFixed(2)}
              </div>
              <div className="review-score-label">Calculated Total Score</div>
              <span
                className="badge"
                style={{ background: tier.bgColor, color: tier.color, marginTop: 'var(--space-2)' }}
              >
                {tier.label}
              </span>
            </div>

            {/* Category scores summary */}
            <div className="review-categories">
              {FEEDBACK_CATEGORIES.map((cat) => {
                const score = formData[cat.scoreField] as number | null;
                return (
                  <div key={cat.key} className="review-category-row">
                    <span className="review-category-name">
                      {cat.emoji} {cat.label}
                    </span>
                    <span className="review-category-weight">
                      {(cat.weight * 100).toFixed(0)}%
                    </span>
                    <span
                      className="review-category-score"
                      style={{ color: score ? getPerformanceTier(score).color : 'var(--color-text-muted)' }}
                    >
                      {score || '—'} / 5
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="review-submit-area">
              <p className="review-warning">
                ⚠️ Once submitted, you cannot edit this feedback. Make sure all scores and comments are final.
              </p>
              <button
                type="button"
                className="btn btn-primary btn-lg"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? 'Submitting...' : '🚀 Submit Feedback'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="form-navigation">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => { saveDraft(); setCurrentStep(Math.max(0, currentStep - 1)); }}
          disabled={currentStep === 0}
        >
          ← Previous
        </button>

        <button
          type="button"
          className="btn btn-ghost"
          onClick={saveDraft}
          disabled={saving}
        >
          {saving ? 'Saving...' : '💾 Save Draft'}
        </button>

        {currentStep < steps.length - 1 && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => { saveDraft(); setCurrentStep(currentStep + 1); }}
          >
            Next →
          </button>
        )}
      </div>

      <style jsx>{`
        .form-card {
          padding: var(--space-8);
          min-height: 400px;
        }

        .form-step-title {
          font-size: var(--font-size-2xl);
          font-weight: 700;
          margin-bottom: var(--space-6);
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: var(--space-5);
        }

        .benchmarks-box {
          padding: var(--space-4);
          background: var(--color-primary-bg);
          border: 1px solid rgba(99, 102, 241, 0.15);
          border-radius: var(--radius-md);
          margin-bottom: var(--space-6);
        }

        .benchmarks-box h4 {
          font-size: var(--font-size-sm);
          font-weight: 600;
          color: var(--color-primary);
          margin-bottom: var(--space-2);
        }

        .benchmarks-box ul {
          list-style: none;
          padding: 0;
        }

        .benchmarks-box li {
          font-size: var(--font-size-sm);
          color: var(--color-text-secondary);
          padding: var(--space-1) 0;
        }

        .benchmarks-box li::before {
          content: '• ';
          color: var(--color-primary);
        }

        .category-section {
          padding: var(--space-6) 0;
          border-bottom: 1px solid var(--color-border);
        }

        .category-section:last-child {
          border-bottom: none;
        }

        .category-header h3 {
          font-size: var(--font-size-lg);
          font-weight: 700;
          margin-bottom: var(--space-4);
        }

        .save-indicator {
          display: flex;
          justify-content: flex-end;
          margin-bottom: var(--space-2);
        }

        .save-status {
          font-size: var(--font-size-xs);
          color: var(--color-text-muted);
        }

        .save-status.saved {
          color: var(--color-success);
        }

        .form-navigation {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--space-6) 0;
          gap: var(--space-4);
        }

        .review-score-card {
          text-align: center;
          padding: var(--space-8);
          margin-bottom: var(--space-8);
          background: var(--color-bg-glass);
          border-radius: var(--radius-lg);
        }

        .review-score-value {
          font-size: 3rem;
          font-weight: 800;
          line-height: 1;
        }

        .review-score-label {
          font-size: var(--font-size-sm);
          color: var(--color-text-muted);
          margin-top: var(--space-2);
        }

        .review-categories {
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
          margin-bottom: var(--space-8);
        }

        .review-category-row {
          display: flex;
          align-items: center;
          padding: var(--space-3) var(--space-4);
          background: var(--color-bg-glass);
          border-radius: var(--radius-md);
        }

        .review-category-name {
          flex: 1;
          font-size: var(--font-size-base);
          font-weight: 500;
        }

        .review-category-weight {
          width: 50px;
          text-align: center;
          font-size: var(--font-size-xs);
          color: var(--color-text-muted);
        }

        .review-category-score {
          width: 60px;
          text-align: right;
          font-weight: 700;
          font-size: var(--font-size-md);
        }

        .review-submit-area {
          text-align: center;
        }

        .review-warning {
          font-size: var(--font-size-sm);
          color: var(--color-warning);
          margin-bottom: var(--space-4);
        }

        .stepper-step-label {
          display: inline;
        }

        @media (max-width: 768px) {
          .form-grid {
            grid-template-columns: 1fr;
          }

          .form-card {
            padding: var(--space-5);
          }

          .stepper-step-label {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
