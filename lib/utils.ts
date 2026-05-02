import { PERFORMANCE_TIERS, type PerformanceTierInfo, type FeedbackSubmission } from './types';

/**
 * Calculate the weighted total score from individual category scores.
 */
export function calculateTotalScore(submission: Partial<FeedbackSubmission>): number {
  const weights: { field: keyof FeedbackSubmission; weight: number }[] = [
    { field: 'engineering_quality_score', weight: 0.15 },
    { field: 'velocity_score', weight: 0.10 },
    { field: 'delivery_score', weight: 0.10 },
    { field: 'ui_quality_score', weight: 0.15 },
    { field: 'product_thinking_score', weight: 0.15 },
    { field: 'code_quality_score', weight: 0.10 },
    { field: 'documentation_score', weight: 0.05 },
    { field: 'knowledge_sharing_score', weight: 0.05 },
    { field: 'conceptual_depth_score', weight: 0.10 },
    { field: 'ownership_score', weight: 0.05 },
  ];

  return weights.reduce((total, { field, weight }) => {
    const score = submission[field] as number | null;
    return total + (score || 0) * weight;
  }, 0);
}

/**
 * Get the performance tier based on a total score.
 */
export function getPerformanceTier(score: number): PerformanceTierInfo {
  for (const tier of PERFORMANCE_TIERS) {
    if (score >= tier.minScore) {
      return tier;
    }
  }
  return PERFORMANCE_TIERS[PERFORMANCE_TIERS.length - 1];
}

/**
 * Format a date string for display.
 */
export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Calculate the number of days remaining in a cycle.
 */
export function getDaysRemaining(endDate: string): number {
  const end = new Date(endDate);
  const now = new Date();
  const diff = end.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

/**
 * Calculate cycle progress as a percentage.
 */
export function getCycleProgress(startDate: string, endDate: string): number {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  const now = Date.now();
  const total = end - start;
  const elapsed = now - start;
  return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
}

/**
 * Get score color based on value.
 */
export function getScoreColor(score: number): string {
  if (score >= 4.5) return 'var(--color-success)';
  if (score >= 3.5) return 'var(--color-primary)';
  if (score >= 2.5) return 'var(--color-warning)';
  return 'var(--color-danger)';
}

/**
 * Get initials from a full name.
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Capitalize first letter.
 */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Format role for display.
 */
export function formatRole(role: string): string {
  switch (role) {
    case 'team_lead': return 'Team Lead';
    case 'admin': return 'Admin';
    case 'engineer': return 'Engineer';
    default: return capitalize(role);
  }
}
