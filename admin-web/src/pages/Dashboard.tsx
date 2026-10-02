import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { Badge, Loading, Stat, timeAgo } from '../components/ui';
import { go, href } from '../router';
import { DashboardStats, getDashboardStats, listAdminLogs } from '../services/admin';
import { subscribeToAppConfig } from '../services/config';
import { AdminLog, AppConfig } from '../../../src/types/models';

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [recent, setRecent] = useState<AdminLog[]>([]);

  useEffect(() => {
    getDashboardStats().then(setStats);
    listAdminLogs().then((l) => setRecent(l.slice(0, 6))).catch(() => {});
    return subscribeToAppConfig(setConfig);
  }, []);

  const modes = config
    ? ([
        config.maintenance.enabled ? ['Maintenance mode on', 'danger'] : null,
        !config.allowNewPosts ? ['New job posts paused', 'warning'] : null,
        config.announcement.active ? ['Announcement live', 'info'] : null,
        config.showDemoContent ? ['Demo content shown', 'neutral'] : ['Demo content hidden', 'neutral'],
      ].filter(Boolean) as [string, 'danger' | 'warning' | 'info' | 'neutral'][])
    : [];

  return (
    <Layout section="" title="Dashboard" subtitle="Live overview of the Got You Covered marketplace.">
      {!stats ? (
        <Loading label="Loading dashboard…" />
      ) : (
        <>
          <div className="hero">
            <div>
              <h2>{stats.openReports ? `${stats.openReports} ${stats.openReports === 1 ? 'report needs' : 'reports need'} review` : 'All clear — no open reports'}</h2>
              <p>
                {stats.users} members · {stats.posts} jobs · {stats.bookings} bookings
              </p>
              <div className="badges" style={{ marginTop: 12 }}>
                {modes.map(([label, tone]) => (
                  <Badge key={label} tone={tone}>
                    {label}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="row">
              {stats.openReports ? (
                <button className="btn btn-primary" onClick={() => go('reports')}>
                  Review reports
                </button>
              ) : null}
              <button className="btn btn-outline" onClick={() => go('settings')}>
                App settings
              </button>
            </div>
          </div>

          <div className="section-title">
            <h2>People</h2>
          </div>
          <div className="grid grid-4">
            <Stat label="Members" value={stats.users} hint={`+${stats.newUsers7d} this week`} onClick={() => go('users')} />
            <Stat label="Service providers" value={stats.providers} hint={`${stats.availableProviders} available now`} onClick={() => go('users/filter/providers')} />
            <Stat label="Suspended" value={stats.suspendedUsers} onClick={() => go('users/filter/suspended')} />
            <Stat label="Reviews" value={stats.reviews} onClick={() => go('reviews')} />
          </div>

          <div className="section-title">
            <h2>Work</h2>
          </div>
          <div className="grid grid-4">
            <Stat label="Jobs posted" value={stats.posts} hint={`+${stats.newPosts7d} this week`} onClick={() => go('jobs')} />
            <Stat label="Hidden jobs" value={stats.hiddenPosts} onClick={() => go('jobs/filter/hidden')} />
            <Stat label="Applications" value={stats.applications} />
            <Stat label="Open reports" value={stats.openReports} onClick={() => go('reports')} />
          </div>

          <div className="section-title">
            <h2>Bookings</h2>
          </div>
          <div className="grid grid-4">
            <Stat label="All bookings" value={stats.bookings} onClick={() => go('bookings')} />
            <Stat label="Pending" value={stats.pendingBookings} onClick={() => go('bookings')} />
            <Stat label="Accepted" value={stats.acceptedBookings} onClick={() => go('bookings')} />
            <Stat label="Completed" value={stats.completedBookings} onClick={() => go('bookings/filter/completed')} />
          </div>

          <div className="section-title">
            <h2>Recent admin activity</h2>
            <a href={href('activity')}>View all</a>
          </div>
          <div className="card">
            {recent.length === 0 ? (
              <div className="empty">No admin actions yet.</div>
            ) : (
              recent.map((l) => (
                <div key={l.id} className="list-item row-between">
                  <div>
                    <div style={{ fontWeight: 600 }}>{l.summary}</div>
                    <div className="small muted">
                      {l.actorName}
                      {l.note ? ` · “${l.note}”` : ''}
                    </div>
                  </div>
                  <span className="small muted nowrap">{timeAgo(l.createdAt)}</span>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </Layout>
  );
}
