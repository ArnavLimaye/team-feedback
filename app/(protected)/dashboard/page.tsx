import { createClient } from '@/lib/supabase/server';
import DashboardClient from './DashboardClient';
import type { Profile, FeedbackCycle, FeedbackSubmission } from '@/lib/types';

export const metadata = {
  title: 'Dashboard — TeamFeedback',
  description: 'View your feedback scores, trends, and team performance.',
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user!.id)
    .single();

  // Get all cycles (ordered by start_date desc)
  const { data: cycles } = await supabase
    .from('feedback_cycles')
    .select('*')
    .order('start_date', { ascending: false });

  // Get the active cycle
  const activeCycle = (cycles || []).find((c: FeedbackCycle) => c.status === 'active');

  // Get all submissions for this user (both self and leader reviews)
  const { data: mySubmissions } = await supabase
    .from('feedback_submissions')
    .select('*')
    .eq('engineer_id', user!.id)
    .eq('status', 'submitted')
    .order('created_at', { ascending: true });

  // For team leads / admins: get team members and their submissions
  let teamMembers: Profile[] = [];
  let teamSubmissions: FeedbackSubmission[] = [];

  if (profile?.role === 'team_lead' || profile?.role === 'admin') {
    const teamQuery = profile.role === 'admin'
      ? supabase.from('profiles').select('*').order('full_name')
      : supabase.from('profiles').select('*').eq('team', profile.team).order('full_name');

    const { data: members } = await teamQuery;
    teamMembers = (members || []) as Profile[];

    if (activeCycle) {
      const { data: submissions } = await supabase
        .from('feedback_submissions')
        .select('*')
        .eq('cycle_id', activeCycle.id);
      teamSubmissions = (submissions || []) as FeedbackSubmission[];
    }
  }

  return (
    <DashboardClient
      profile={profile as Profile}
      cycles={(cycles || []) as FeedbackCycle[]}
      activeCycle={activeCycle as FeedbackCycle | undefined}
      mySubmissions={(mySubmissions || []) as FeedbackSubmission[]}
      teamMembers={teamMembers}
      teamSubmissions={teamSubmissions}
    />
  );
}
