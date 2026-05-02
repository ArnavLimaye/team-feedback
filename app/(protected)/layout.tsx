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

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile) {
    redirect('/login');
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
