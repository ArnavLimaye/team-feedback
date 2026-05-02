import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import FeedbackFormClient from './FeedbackFormClient';
import type { Profile, FeedbackCycle } from '@/lib/types';

export const metadata = {
  title: 'New Self Feedback — TeamFeedback',
  description: 'Submit your bi-weekly self-assessment feedback.',
};

export default async function NewFeedbackPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user!.id)
    .single();

  // Get active cycle
  const { data: activeCycle } = await supabase
    .from('feedback_cycles')
    .select('*')
    .eq('status', 'active')
    .single();

  if (!activeCycle) {
    redirect('/feedback?error=no_active_cycle');
  }

  // Check if already submitted
  const { data: existing } = await supabase
    .from('feedback_submissions')
    .select('id, status')
    .eq('cycle_id', activeCycle.id)
    .eq('engineer_id', user!.id)
    .eq('reviewer_id', user!.id)
    .eq('feedback_type', 'self')
    .single();

  if (existing?.status === 'submitted') {
    redirect(`/feedback/${existing.id}`);
  }

  return (
    <FeedbackFormClient
      profile={profile as Profile}
      cycle={activeCycle as FeedbackCycle}
      existingId={existing?.id}
      feedbackType="self"
    />
  );
}
