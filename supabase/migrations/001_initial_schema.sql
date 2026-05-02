-- ============================================================
-- Team Feedback App — Initial Schema
-- ============================================================

-- 1. Profiles (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('engineer', 'team_lead', 'admin')) DEFAULT 'engineer',
  team TEXT NOT NULL DEFAULT 'frontend',
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Teams
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default teams
INSERT INTO teams (name, description) VALUES
  ('frontend', 'Frontend Engineering'),
  ('backend', 'Backend Engineering'),
  ('qa', 'Quality Assurance'),
  ('devops', 'DevOps & Infrastructure'),
  ('design', 'UI/UX Design');

-- 3. Feedback Cycles (bi-weekly periods)
CREATE TABLE feedback_cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_number INT NOT NULL,
  title TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'closed', 'upcoming')) DEFAULT 'upcoming',
  team TEXT NOT NULL DEFAULT 'frontend',
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Feedback Submissions
CREATE TABLE feedback_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id UUID NOT NULL REFERENCES feedback_cycles(id) ON DELETE CASCADE,
  -- Who is being reviewed
  engineer_id UUID NOT NULL REFERENCES profiles(id),
  -- Who is submitting (same as engineer_id for self-feedback)
  reviewer_id UUID NOT NULL REFERENCES profiles(id),
  -- Type: 'self' or 'leader_review'
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('self', 'leader_review')),
  -- Status
  status TEXT NOT NULL CHECK (status IN ('draft', 'submitted')) DEFAULT 'draft',

  -- Projects / Modules worked on
  projects_modules TEXT,

  -- ===== OUTCOME (Final Target Outcome) =====
  outcome_rating INT CHECK (outcome_rating BETWEEN 1 AND 5),
  outcome_key_impact TEXT,
  outcome_missed_opportunities TEXT,
  outcome_business_value TEXT,

  -- ===== 1. Engineering Quality (15%) =====
  engineering_quality_score INT CHECK (engineering_quality_score BETWEEN 1 AND 5),
  engineering_quality_reopened_pct NUMERIC,
  engineering_quality_bug_density NUMERIC,
  engineering_quality_qa_compliance NUMERIC,
  engineering_quality_strengths TEXT,
  engineering_quality_issues TEXT,
  engineering_quality_root_causes TEXT,

  -- ===== 2. Velocity & Execution (10%) =====
  velocity_score INT CHECK (velocity_score BETWEEN 1 AND 5),
  velocity_committed_vs_delivered TEXT,
  velocity_task_throughput TEXT,
  velocity_estimation_accuracy TEXT,
  velocity_execution_consistency TEXT,

  -- ===== 3. Delivery Predictability (10%) =====
  delivery_score INT CHECK (delivery_score BETWEEN 1 AND 5),
  delivery_ontime_pct NUMERIC,
  delivery_spillover TEXT,
  delivery_deadline_adherence TEXT,
  delivery_planning_clarity TEXT,

  -- ===== 4. UI Quality (15%) =====
  ui_quality_score INT CHECK (ui_quality_score BETWEEN 1 AND 5),
  ui_quality_strengths TEXT,
  ui_quality_gaps TEXT,

  -- ===== 5. Product Thinking (15%) =====
  product_thinking_score INT CHECK (product_thinking_score BETWEEN 1 AND 5),
  product_thinking_ideas TEXT,
  product_thinking_depth TEXT,

  -- ===== 6. Code Quality (10%) =====
  code_quality_score INT CHECK (code_quality_score BETWEEN 1 AND 5),
  code_quality_structure TEXT,
  code_quality_refactoring TEXT,

  -- ===== 7. Documentation (5%) =====
  documentation_score INT CHECK (documentation_score BETWEEN 1 AND 5),
  documentation_quality TEXT,

  -- ===== 8. Knowledge Sharing (5%) =====
  knowledge_sharing_score INT CHECK (knowledge_sharing_score BETWEEN 1 AND 5),
  knowledge_sharing_contribution TEXT,

  -- ===== 9. Conceptual Depth (10%) =====
  conceptual_depth_score INT CHECK (conceptual_depth_score BETWEEN 1 AND 5),
  conceptual_depth_problem_solving TEXT,
  conceptual_depth_clarity TEXT,

  -- ===== 10. Ownership (5%) =====
  ownership_score INT CHECK (ownership_score BETWEEN 1 AND 5),
  ownership_behavior TEXT,

  -- ===== FINAL SUMMARY =====
  key_strengths TEXT,
  areas_of_improvement TEXT,
  focus_next_sprint TEXT,
  growth_recommendations TEXT,

  -- Self-reflection (for self-feedback)
  self_what_went_well TEXT,
  self_what_to_improve TEXT,
  self_focus_next TEXT,

  -- Manager comments (for leader reviews)
  manager_comments TEXT,

  -- Computed total score (weighted)
  total_score NUMERIC GENERATED ALWAYS AS (
    (COALESCE(engineering_quality_score, 0) * 0.15) +
    (COALESCE(velocity_score, 0) * 0.10) +
    (COALESCE(delivery_score, 0) * 0.10) +
    (COALESCE(ui_quality_score, 0) * 0.15) +
    (COALESCE(product_thinking_score, 0) * 0.15) +
    (COALESCE(code_quality_score, 0) * 0.10) +
    (COALESCE(documentation_score, 0) * 0.05) +
    (COALESCE(knowledge_sharing_score, 0) * 0.05) +
    (COALESCE(conceptual_depth_score, 0) * 0.10) +
    (COALESCE(ownership_score, 0) * 0.05)
  ) STORED,

  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- One feedback per reviewer per engineer per cycle per type
  UNIQUE(cycle_id, engineer_id, reviewer_id, feedback_type)
);

-- ============================================================
-- Row Level Security (RLS) Policies
-- ============================================================

-- Profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view profiles"
  ON profiles FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Teams
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view teams"
  ON teams FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage teams"
  ON teams FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Feedback Cycles
ALTER TABLE feedback_cycles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view cycles"
  ON feedback_cycles FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Leads and admins can create cycles"
  ON feedback_cycles FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('team_lead', 'admin')
    )
  );

CREATE POLICY "Leads and admins can update cycles"
  ON feedback_cycles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('team_lead', 'admin')
    )
  );

-- Feedback Submissions
ALTER TABLE feedback_submissions ENABLE ROW LEVEL SECURITY;

-- Engineers can view their own feedback (both self and leader reviews about them)
CREATE POLICY "Users can view own feedback"
  ON feedback_submissions FOR SELECT
  USING (reviewer_id = auth.uid() OR engineer_id = auth.uid());

-- Team leads can view feedback for their team
CREATE POLICY "Leads can view team feedback"
  ON feedback_submissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'team_lead'
    )
  );

-- Admins can view all feedback
CREATE POLICY "Admins can view all feedback"
  ON feedback_submissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Users can insert their own feedback
CREATE POLICY "Users can submit feedback"
  ON feedback_submissions FOR INSERT
  WITH CHECK (reviewer_id = auth.uid());

-- Users can update their own draft feedback
CREATE POLICY "Users can update own drafts"
  ON feedback_submissions FOR UPDATE
  USING (reviewer_id = auth.uid() AND status = 'draft');

-- Leads can update any draft they authored
CREATE POLICY "Leads can update own reviews"
  ON feedback_submissions FOR UPDATE
  USING (
    reviewer_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('team_lead', 'admin')
    )
  );

-- ============================================================
-- Functions & Triggers
-- ============================================================

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role, team)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'engineer'),
    COALESCE(NEW.raw_user_meta_data->>'team', 'frontend')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_feedback_cycles_updated_at
  BEFORE UPDATE ON feedback_cycles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_feedback_submissions_updated_at
  BEFORE UPDATE ON feedback_submissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- Indexes for performance
-- ============================================================
CREATE INDEX idx_feedback_submissions_cycle ON feedback_submissions(cycle_id);
CREATE INDEX idx_feedback_submissions_engineer ON feedback_submissions(engineer_id);
CREATE INDEX idx_feedback_submissions_reviewer ON feedback_submissions(reviewer_id);
CREATE INDEX idx_feedback_submissions_type ON feedback_submissions(feedback_type);
CREATE INDEX idx_feedback_cycles_status ON feedback_cycles(status);
CREATE INDEX idx_feedback_cycles_team ON feedback_cycles(team);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_team ON profiles(team);
