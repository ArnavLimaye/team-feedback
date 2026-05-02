// ============================================================
// Type definitions for the Team Feedback App
// ============================================================

export type UserRole = 'engineer' | 'team_lead' | 'admin';

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  team: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Team {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export type CycleStatus = 'active' | 'closed' | 'upcoming';

export interface FeedbackCycle {
  id: string;
  cycle_number: number;
  title: string;
  start_date: string;
  end_date: string;
  status: CycleStatus;
  team: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export type FeedbackType = 'self' | 'leader_review';
export type FeedbackStatus = 'draft' | 'submitted';

export interface FeedbackSubmission {
  id: string;
  cycle_id: string;
  engineer_id: string;
  reviewer_id: string;
  feedback_type: FeedbackType;
  status: FeedbackStatus;
  projects_modules: string | null;

  // Outcome
  outcome_rating: number | null;
  outcome_key_impact: string | null;
  outcome_missed_opportunities: string | null;
  outcome_business_value: string | null;

  // 1. Engineering Quality (15%)
  engineering_quality_score: number | null;
  engineering_quality_reopened_pct: number | null;
  engineering_quality_bug_density: number | null;
  engineering_quality_qa_compliance: number | null;
  engineering_quality_strengths: string | null;
  engineering_quality_issues: string | null;
  engineering_quality_root_causes: string | null;

  // 2. Velocity & Execution (10%)
  velocity_score: number | null;
  velocity_committed_vs_delivered: string | null;
  velocity_task_throughput: string | null;
  velocity_estimation_accuracy: string | null;
  velocity_execution_consistency: string | null;

  // 3. Delivery Predictability (10%)
  delivery_score: number | null;
  delivery_ontime_pct: number | null;
  delivery_spillover: string | null;
  delivery_deadline_adherence: string | null;
  delivery_planning_clarity: string | null;

  // 4. UI Quality (15%)
  ui_quality_score: number | null;
  ui_quality_strengths: string | null;
  ui_quality_gaps: string | null;

  // 5. Product Thinking (15%)
  product_thinking_score: number | null;
  product_thinking_ideas: string | null;
  product_thinking_depth: string | null;

  // 6. Code Quality (10%)
  code_quality_score: number | null;
  code_quality_structure: string | null;
  code_quality_refactoring: string | null;

  // 7. Documentation (5%)
  documentation_score: number | null;
  documentation_quality: string | null;

  // 8. Knowledge Sharing (5%)
  knowledge_sharing_score: number | null;
  knowledge_sharing_contribution: string | null;

  // 9. Conceptual Depth (10%)
  conceptual_depth_score: number | null;
  conceptual_depth_problem_solving: string | null;
  conceptual_depth_clarity: string | null;

  // 10. Ownership (5%)
  ownership_score: number | null;
  ownership_behavior: string | null;

  // Summary
  key_strengths: string | null;
  areas_of_improvement: string | null;
  focus_next_sprint: string | null;
  growth_recommendations: string | null;

  // Self-reflection
  self_what_went_well: string | null;
  self_what_to_improve: string | null;
  self_focus_next: string | null;

  // Manager
  manager_comments: string | null;

  // Computed
  total_score: number | null;

  submitted_at: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================================
// Category definitions for the feedback form
// ============================================================

export interface FeedbackCategory {
  key: string;
  label: string;
  emoji: string;
  weight: number;
  scoreField: keyof FeedbackSubmission;
  benchmarks: string[];
  scoreDescriptions: {
    1: string;
    3: string;
    5: string;
  };
  fields: CategoryField[];
}

export interface CategoryField {
  key: keyof FeedbackSubmission;
  label: string;
  type: 'text' | 'number' | 'textarea';
  placeholder?: string;
}

export const FEEDBACK_CATEGORIES: FeedbackCategory[] = [
  {
    key: 'engineering_quality',
    label: 'Engineering Quality',
    emoji: '🧠',
    weight: 0.15,
    scoreField: 'engineering_quality_score',
    benchmarks: [
      'Reopened % → < 10% (Good), < 5% (Excellent)',
      'Bug Density → < 0.3 bugs per task',
      'QA Checklist Compliance → > 90%',
    ],
    scoreDescriptions: {
      1: 'Reopened >20%, frequent bugs',
      3: 'Reopened 10–15%, manageable issues',
      5: 'Reopened <5%, strong QA discipline',
    },
    fields: [
      { key: 'engineering_quality_reopened_pct', label: 'Reopened %', type: 'number', placeholder: 'e.g. 8' },
      { key: 'engineering_quality_bug_density', label: 'Bug Density', type: 'number', placeholder: 'e.g. 0.2' },
      { key: 'engineering_quality_qa_compliance', label: 'QA Checklist Compliance %', type: 'number', placeholder: 'e.g. 92' },
      { key: 'engineering_quality_strengths', label: 'Strengths', type: 'textarea', placeholder: 'What went well in engineering quality...' },
      { key: 'engineering_quality_issues', label: 'Issues Observed', type: 'textarea', placeholder: 'Any issues noticed...' },
      { key: 'engineering_quality_root_causes', label: 'Root Cause Patterns', type: 'textarea', placeholder: 'Recurring patterns...' },
    ],
  },
  {
    key: 'velocity',
    label: 'Velocity & Execution',
    emoji: '⚡',
    weight: 0.10,
    scoreField: 'velocity_score',
    benchmarks: [
      'Velocity Accuracy → 80% – 110%',
      'Weekly output trend → Increasing or stable',
    ],
    scoreDescriptions: {
      1: '<60% or >140% (poor estimation)',
      3: '70–80% accuracy',
      5: 'Consistently within 85–110%',
    },
    fields: [
      { key: 'velocity_committed_vs_delivered', label: 'Committed vs Delivered', type: 'textarea', placeholder: 'e.g. 8/10 tasks delivered' },
      { key: 'velocity_task_throughput', label: 'Task Throughput', type: 'textarea', placeholder: 'Weekly task completion rate...' },
      { key: 'velocity_estimation_accuracy', label: 'Estimation Accuracy', type: 'textarea', placeholder: 'How accurate were estimates...' },
      { key: 'velocity_execution_consistency', label: 'Execution Consistency', type: 'textarea', placeholder: 'Consistency of delivery...' },
    ],
  },
  {
    key: 'delivery',
    label: 'Delivery Predictability',
    emoji: '📅',
    weight: 0.10,
    scoreField: 'delivery_score',
    benchmarks: [
      'On-time Delivery → > 85% (Good), > 95% (Excellent)',
      'Spillover → < 10% tasks',
    ],
    scoreDescriptions: {
      1: '<60% on-time delivery',
      3: '70–85%',
      5: '>90% consistently on-time',
    },
    fields: [
      { key: 'delivery_ontime_pct', label: 'On-time Delivery %', type: 'number', placeholder: 'e.g. 90' },
      { key: 'delivery_spillover', label: 'Spillover', type: 'textarea', placeholder: 'Tasks that spilled over...' },
      { key: 'delivery_deadline_adherence', label: 'Deadline Adherence', type: 'textarea', placeholder: 'How well were deadlines met...' },
      { key: 'delivery_planning_clarity', label: 'Planning Clarity', type: 'textarea', placeholder: 'Quality of planning...' },
    ],
  },
  {
    key: 'ui_quality',
    label: 'UI Quality',
    emoji: '🎨',
    weight: 0.15,
    scoreField: 'ui_quality_score',
    benchmarks: [
      'No major UI bugs in QA/UAT',
      'All states handled (loading, error, empty)',
      'Mobile + responsive verified',
      'Performance acceptable (no noticeable lag)',
    ],
    scoreDescriptions: {
      1: 'Rough UI, missing states',
      3: 'Works but lacks polish',
      5: 'Highly polished, production-ready UI',
    },
    fields: [
      { key: 'ui_quality_strengths', label: 'UI Strengths', type: 'textarea', placeholder: 'Visual polish, responsiveness...' },
      { key: 'ui_quality_gaps', label: 'Gaps in Polish', type: 'textarea', placeholder: 'Areas needing improvement...' },
    ],
  },
  {
    key: 'product_thinking',
    label: 'Product Thinking',
    emoji: '🧩',
    weight: 0.15,
    scoreField: 'product_thinking_score',
    benchmarks: [
      'Suggests improvements in >30% tasks',
      'Avoids hardcoding; uses config-driven approach',
      'Considers scalability & reuse',
    ],
    scoreDescriptions: {
      1: 'Executes blindly',
      3: 'Understands and questions requirements',
      5: 'Proactively improves product & system design',
    },
    fields: [
      { key: 'product_thinking_ideas', label: 'Ideas Contributed', type: 'textarea', placeholder: 'Improvements suggested...' },
      { key: 'product_thinking_depth', label: 'Thinking Depth', type: 'textarea', placeholder: 'Depth of product understanding...' },
    ],
  },
  {
    key: 'code_quality',
    label: 'Code Quality',
    emoji: '🏗️',
    weight: 0.10,
    scoreField: 'code_quality_score',
    benchmarks: [
      'High reuse of components',
      'Minimal duplication',
      'Clean architecture (tiered approach)',
    ],
    scoreDescriptions: {
      1: 'Messy, duplicated code',
      3: 'Acceptable structure',
      5: 'Clean, scalable, reusable code',
    },
    fields: [
      { key: 'code_quality_structure', label: 'Code Structure', type: 'textarea', placeholder: 'Organization and architecture...' },
      { key: 'code_quality_refactoring', label: 'Refactoring Quality', type: 'textarea', placeholder: 'Refactoring efforts...' },
    ],
  },
  {
    key: 'documentation',
    label: 'Documentation',
    emoji: '📚',
    weight: 0.05,
    scoreField: 'documentation_score',
    benchmarks: [
      'All PRs have clear descriptions',
      'Edge cases documented',
      'Easy handover possible',
    ],
    scoreDescriptions: {
      1: 'Poor / missing',
      3: 'Basic clarity',
      5: 'Excellent, structured documentation',
    },
    fields: [
      { key: 'documentation_quality', label: 'Documentation Quality', type: 'textarea', placeholder: 'Quality of docs, PR descriptions...' },
    ],
  },
  {
    key: 'knowledge_sharing',
    label: 'Knowledge Sharing',
    emoji: '🤝',
    weight: 0.05,
    scoreField: 'knowledge_sharing_score',
    benchmarks: [
      'At least 1 meaningful knowledge share per sprint',
      'Active participation in discussions',
    ],
    scoreDescriptions: {
      1: 'Passive',
      3: 'Occasional sharing',
      5: 'Proactively uplifts team knowledge',
    },
    fields: [
      { key: 'knowledge_sharing_contribution', label: 'Contribution to Team Learning', type: 'textarea', placeholder: 'Knowledge sharing activities...' },
    ],
  },
  {
    key: 'conceptual_depth',
    label: 'Conceptual Depth',
    emoji: '🧠',
    weight: 0.10,
    scoreField: 'conceptual_depth_score',
    benchmarks: [
      'Can debug independently',
      'Understands core frontend concepts',
      'Validates AI output critically',
    ],
    scoreDescriptions: {
      1: 'Shallow understanding',
      3: 'Moderate understanding',
      5: 'Deep understanding + strong reasoning',
    },
    fields: [
      { key: 'conceptual_depth_problem_solving', label: 'Problem-solving Ability', type: 'textarea', placeholder: 'Debugging and problem-solving...' },
      { key: 'conceptual_depth_clarity', label: 'Concept Clarity', type: 'textarea', placeholder: 'Understanding of core concepts...' },
    ],
  },
  {
    key: 'ownership',
    label: 'Ownership',
    emoji: '🔥',
    weight: 0.05,
    scoreField: 'ownership_score',
    benchmarks: [
      'Reopened issues fixed within 24–48 hrs',
      'Tracks own bugs proactively',
      'Follows through until production stability',
    ],
    scoreDescriptions: {
      1: 'Task-based mindset',
      3: 'Some ownership',
      5: 'Strong end-to-end ownership',
    },
    fields: [
      { key: 'ownership_behavior', label: 'Ownership Behavior', type: 'textarea', placeholder: 'End-to-end ownership examples...' },
    ],
  },
];

// ============================================================
// Performance tiers
// ============================================================

export type PerformanceTier = 'top' | 'strong' | 'average' | 'needs_improvement';

export interface PerformanceTierInfo {
  tier: PerformanceTier;
  label: string;
  minScore: number;
  color: string;
  bgColor: string;
}

export const PERFORMANCE_TIERS: PerformanceTierInfo[] = [
  { tier: 'top', label: 'Top Performer', minScore: 4.5, color: 'var(--color-success)', bgColor: 'var(--color-success-bg)' },
  { tier: 'strong', label: 'Strong Performer', minScore: 3.5, color: 'var(--color-primary)', bgColor: 'var(--color-primary-bg)' },
  { tier: 'average', label: 'Average', minScore: 2.5, color: 'var(--color-warning)', bgColor: 'var(--color-warning-bg)' },
  { tier: 'needs_improvement', label: 'Needs Improvement', minScore: 0, color: 'var(--color-danger)', bgColor: 'var(--color-danger-bg)' },
];

// ============================================================
// Form step definitions
// ============================================================

export interface FormStep {
  key: string;
  label: string;
  emoji: string;
}

export const FEEDBACK_FORM_STEPS: FormStep[] = [
  { key: 'basic', label: 'Basic Info', emoji: '📋' },
  { key: 'outcome', label: 'Target Outcome', emoji: '🎯' },
  { key: 'categories_1_5', label: 'Categories 1-5', emoji: '📊' },
  { key: 'categories_6_10', label: 'Categories 6-10', emoji: '📈' },
  { key: 'summary', label: 'Final Summary', emoji: '🏁' },
  { key: 'reflection', label: 'Self-Reflection', emoji: '🧾' },
  { key: 'review', label: 'Review & Submit', emoji: '✅' },
];
