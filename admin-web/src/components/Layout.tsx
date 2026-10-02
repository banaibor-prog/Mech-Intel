import React, { useEffect, useState } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { href } from '../router';
import { useAdmin } from '../session';
import { subscribeToReports } from '../services/admin';
import { Avatar, Icon, IconName, Logo } from './ui';

const NAV: { path: string; label: string; icon: IconName }[] = [
  { path: '', label: 'Dashboard', icon: 'dashboard' },
  { path: 'reports', label: 'Reports', icon: 'flag' },
  { path: 'users', label: 'Users', icon: 'users' },
  { path: 'jobs', label: 'Jobs', icon: 'briefcase' },
  { path: 'bookings', label: 'Bookings', icon: 'calendar' },
  { path: 'reviews', label: 'Reviews', icon: 'star' },
  { path: 'settings', label: 'App settings', icon: 'settings' },
  { path: 'activity', label: 'Activity log', icon: 'clock' },
];

export default function Layout({ section, title, subtitle, actions, children }: { section: string; title: string; subtitle?: string; actions?: React.ReactNode; children: React.ReactNode }) {
  const { profile, user } = useAdmin();
  const [openReports, setOpenReports] = useState(0);

  useEffect(() => subscribeToReports((r) => setOpenReports(r.filter((x) => !x.status || x.status === 'open').length)), []);

  useEffect(() => {
    document.title = `${title} · GYC Admin`;
  }, [title]);

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <Logo size={40} />
          <div>
            <div className="brand-name">GYC Admin</div>
            <div className="brand-sub">Got You Covered</div>
          </div>
        </div>
        <nav className="nav">
          {NAV.map((n) => (
            <a key={n.path} href={href(n.path)} className={section === n.path ? 'active' : ''}>
              <Icon name={n.icon} />
              {n.label}
              {n.path === 'reports' && openReports > 0 ? <span className="count">{openReports}</span> : null}
            </a>
          ))}
        </nav>
        <div className="sidebar-foot">
          <div className="me">
            <Avatar name={profile.displayName || 'Admin'} src={profile.photoURL} />
            <div>
              <div className="me-name">{profile.displayName}</div>
              <div className="me-email">{user.email}</div>
            </div>
          </div>
          <button className="btn btn-ghost btn-sm signout" onClick={() => signOut(auth)}>
            <Icon name="logout" size={16} /> Sign out
          </button>
        </div>
      </aside>
      <main className="main">
        <header className="topbar">
          <div>
            <h1>{title}</h1>
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
          {actions}
        </header>
        <div className="content">{children}</div>
      </main>
    </div>
  );
}
