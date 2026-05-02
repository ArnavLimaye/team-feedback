'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/lib/types';
import { getInitials, formatRole } from '@/lib/utils';

interface SidebarProps {
  profile: Profile;
}

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', emoji: '📊', roles: ['engineer', 'team_lead', 'admin'] },
  { href: '/feedback', label: 'My Feedback', emoji: '📝', roles: ['engineer', 'team_lead', 'admin'] },
  { href: '/cycles', label: 'Cycles', emoji: '🔄', roles: ['team_lead', 'admin'] },
  { href: '/team', label: 'Team', emoji: '👥', roles: ['team_lead', 'admin'] },
  { href: '/profile', label: 'Profile', emoji: '⚙️', roles: ['engineer', 'team_lead', 'admin'] },
];

export default function Sidebar({ profile }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const filteredNav = NAV_ITEMS.filter((item) =>
    item.roles.includes(profile.role)
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        className="mobile-menu-btn"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle menu"
      >
        <span className={`hamburger ${mobileOpen ? 'open' : ''}`}>
          <span />
          <span />
          <span />
        </span>
      </button>

      {/* Overlay */}
      {mobileOpen && (
        <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />
      )}

      <aside className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-inner">
          {/* Logo */}
          <div className="sidebar-logo">
            <span className="sidebar-logo-icon">📊</span>
            <span className="sidebar-logo-text">TeamFeedback</span>
          </div>

          {/* Navigation */}
          <nav className="sidebar-nav">
            {filteredNav.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`sidebar-link ${isActive ? 'active' : ''}`}
                  onClick={() => setMobileOpen(false)}
                >
                  <span className="sidebar-link-icon">{item.emoji}</span>
                  <span className="sidebar-link-label">{item.label}</span>
                  {isActive && <span className="sidebar-link-indicator" />}
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div className="sidebar-user">
            <div className="sidebar-user-info">
              <div className="avatar avatar-sm">
                {getInitials(profile.full_name)}
              </div>
              <div className="sidebar-user-meta">
                <span className="sidebar-user-name">{profile.full_name}</span>
                <span className="sidebar-user-role">{formatRole(profile.role)}</span>
              </div>
            </div>
            <button
              className="btn btn-ghost btn-sm sidebar-logout"
              onClick={handleLogout}
              title="Sign out"
            >
              🚪
            </button>
          </div>
        </div>
      </aside>

      <style jsx>{`
        .mobile-menu-btn {
          display: none;
          position: fixed;
          top: var(--space-4);
          left: var(--space-4);
          z-index: 1001;
          width: 44px;
          height: 44px;
          background: var(--color-bg-card);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          cursor: pointer;
          align-items: center;
          justify-content: center;
        }

        .hamburger {
          display: flex;
          flex-direction: column;
          gap: 4px;
          width: 18px;
        }

        .hamburger span {
          display: block;
          height: 2px;
          background: var(--color-text-primary);
          border-radius: 2px;
          transition: all var(--transition-fast);
        }

        .hamburger.open span:nth-child(1) {
          transform: rotate(45deg) translate(4px, 4px);
        }

        .hamburger.open span:nth-child(2) {
          opacity: 0;
        }

        .hamburger.open span:nth-child(3) {
          transform: rotate(-45deg) translate(4px, -4px);
        }

        .sidebar-overlay {
          display: none;
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          z-index: 999;
        }

        .sidebar {
          position: fixed;
          top: 0;
          left: 0;
          width: var(--sidebar-width);
          height: 100vh;
          background: var(--color-bg-secondary);
          border-right: 1px solid var(--color-border);
          z-index: 1000;
          transition: transform var(--transition-base);
        }

        .sidebar-inner {
          display: flex;
          flex-direction: column;
          height: 100%;
          padding: var(--space-6);
        }

        .sidebar-logo {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          padding: var(--space-2) 0;
          margin-bottom: var(--space-8);
        }

        .sidebar-logo-icon {
          font-size: 1.5rem;
        }

        .sidebar-logo-text {
          font-size: var(--font-size-lg);
          font-weight: 800;
          background: var(--gradient-primary);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .sidebar-nav {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: var(--space-1);
        }

        .sidebar-link {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          padding: var(--space-3) var(--space-4);
          border-radius: var(--radius-md);
          color: var(--color-text-secondary);
          font-size: var(--font-size-base);
          font-weight: 500;
          transition: all var(--transition-fast);
          position: relative;
          text-decoration: none;
        }

        .sidebar-link:hover {
          color: var(--color-text-primary);
          background: var(--color-bg-glass);
        }

        .sidebar-link.active {
          color: var(--color-primary);
          background: var(--color-primary-bg);
          font-weight: 600;
        }

        .sidebar-link-icon {
          font-size: 1.1rem;
          width: 24px;
          text-align: center;
        }

        .sidebar-link-indicator {
          position: absolute;
          right: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 3px;
          height: 20px;
          background: var(--gradient-primary);
          border-radius: var(--radius-full);
        }

        .sidebar-user {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--space-4);
          margin-top: var(--space-4);
          background: var(--color-bg-glass);
          border-radius: var(--radius-md);
          border: 1px solid var(--color-border);
        }

        .sidebar-user-info {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          min-width: 0;
        }

        .sidebar-user-meta {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .sidebar-user-name {
          font-size: var(--font-size-sm);
          font-weight: 600;
          color: var(--color-text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .sidebar-user-role {
          font-size: var(--font-size-xs);
          color: var(--color-text-muted);
        }

        .sidebar-logout {
          flex-shrink: 0;
        }

        @media (max-width: 768px) {
          .mobile-menu-btn {
            display: flex;
          }

          .sidebar-overlay {
            display: block;
          }

          .sidebar {
            transform: translateX(-100%);
          }

          .sidebar-open {
            transform: translateX(0);
          }
        }
      `}</style>
    </>
  );
}
