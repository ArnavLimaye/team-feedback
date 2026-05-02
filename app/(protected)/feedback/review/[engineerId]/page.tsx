import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import FeedbackFormClient from '../../new/FeedbackFormClient';
import type { Profile, FeedbackCycle } from '@/lib/types';

export const metadata = {
  title: 'Review Engineer — TeamFeedback',
};

export default async function LeaderReviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ engineerId: string }>;
  searchParams: Promise<{ cycle?: string }>;
}) {
  const { engineerId } = await params;
  const { cycle: cycleId } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Verify the reviewer is a lead or admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user!.id)
    .single();

  if (!profile || (profile.role !== 'team_lead' && profile.role !== 'admin')) {
    redirect('/dashboard');
  }

  // Get the engineer's profile
  const { data: engineerProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', engineerId)
    .single();

  if (!engineerProfile) {
    redirect('/team');
  }

  // Get the cycle
  let cycle;
  if (cycleId) {
    const { data } = await supabase
      .from('feedback_cycles')
      .select('*')
      .eq('id', cycleId)
      .single();
    cycle = data;
  } else {
    const { data } = await supabase
      .from('feedback_cycles')
      .select('*')
      .eq('status', 'active')
      .single();
    cycle = data;
  }

  if (!cycle) {
    redirect('/dashboard?error=no_active_cycle');
  }

  // Check for existing review
  const { data: existing } = await supabase
    .from('feedback_submissions')
    .select('id, status')
    .eq('cycle_id', cycle.id)
    .eq('engineer_id', engineerId)
    .eq('reviewer_id', user!.id)
    .eq('feedback_type', 'leader_review')
    .single();

  if (existing?.status === 'submitted') {
    redirect(`/feedback/${existing.id}`);
  }

  return (
    <FeedbackFormClient
      profile={profile as Profile}
      cycle={cycle as FeedbackCycle}
      existingId={existing?.id}
      feedbackType="leader_review"
      engineerProfile={engineerProfile as Profile}
    />
  );
}
