import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Sidebar from '@/components/Sidebar';
import type { Profile } from '@/lib/types';

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profileData, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  let profile = profileData;

  if (!profile) {
    // The database trigger might have failed or the user was created before the trigger existed.
    // Let's auto-heal by creating the profile right now using their user_metadata.
    const { data: newProfile, error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
        email: user.email!,
        role: user.user_metadata?.role || 'engineer',
        team: user.user_metadata?.team || 'frontend',
      })
      .select()
      .single();

    if (newProfile) {
      profile = newProfile;
    } else {
      const handleSignOut = async () => {
        'use server';
        const supabaseClient = await createClient();
        await supabaseClient.auth.signOut();
        redirect('/login');
      };

      return (
        <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-card" style={{ padding: '2rem', textAlign: 'center', maxWidth: 400 }}>
            <h2>Profile Not Found</h2>
            <p style={{ margin: '1rem 0', color: 'var(--color-text-muted)' }}>
              Your account setup is incomplete and auto-recovery failed.
            </p>
            {error && (
              <div style={{ background: 'rgba(255,0,0,0.1)', color: 'red', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '14px', wordBreak: 'break-all' }}>
                <strong>Read Error:</strong> {error.code} - {error.message} <br/>
                <strong>Insert Error:</strong> {insertError?.code} - {insertError?.message}
              </div>
            )}
            <form action={handleSignOut}>
              <button className="btn btn-primary" type="submit">Sign Out</button>
            </form>
          </div>
        </div>
      );
    }
  }

  return (
    <div className="app-layout">
      <Sidebar profile={profile as Profile} />
      <main className="app-main">
        {children}
      </main>

      <style>{`
        .app-layout {
          display: flex;
          min-height: 100vh;
        }

        .app-main {
          flex: 1;
          margin-left: var(--sidebar-width);
          min-height: 100vh;
          background: var(--color-bg-primary);
        }

        @media (max-width: 768px) {
          .app-main {
            margin-left: 0;
            padding-top: 60px;
          }
        }
      `}</style>
    </div>
  );
}
