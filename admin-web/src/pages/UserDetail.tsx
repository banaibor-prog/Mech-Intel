import { useCallback, useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { Avatar, Badge, Empty, Icon, Loading, Stat, capitalize, formatDate, timeAgo, useAction, useFeedback } from '../components/ui';
import { href } from '../router';
import { useAdmin } from '../session';
import { AdminUserDetail, getAdminUserDetail, setProviderVerified, setUserAdmin, setUserSuspended } from '../services/admin';

const BOOKING_TONE = { pending: 'warning', accepted: 'success', declined: 'danger', cancelled: 'neutral', completed: 'info' } as const;

export default function UserDetail({ uid }: { uid: string }) {
  const { actor } = useAdmin();
  const { ask } = useFeedback();
  const { busy, run } = useAction();
  const [detail, setDetail] = useState<AdminUserDetail | null | undefined>(undefined);

  const load = useCallback(() => getAdminUserDetail(uid).then(setDetail).catch(() => setDetail(null)), [uid]);
  useEffect(() => {
    load();
  }, [load]);

  if (detail === undefined) {
    return (
      <Layout section="users" title="User">
        <Loading />
      </Layout>
    );
  }
  if (!detail) {
    return (
      <Layout section="users" title="User">
        <Empty>This user could not be found.</Empty>
      </Layout>
    );
  }

  const { user, provider, trust, posts, bookings, reportsAgainst, reportsFiled } = detail;
  const isSelf = user.uid === actor.uid;
  const verified = !!provider?.verifications?.includes('identity');
  const openReports = reportsAgainst.filter((r) => !r.status || r.status === 'open').length;

  const toggleSuspend = async () => {
    if (user.suspended) {
      if ((await ask({ title: `Restore ${user.displayName}?`, message: 'They will be able to post, book and apply again.', confirmLabel: 'Restore account' })) === null) return;
      if (await run('suspend', () => setUserSuspended(actor, user, false), `${user.displayName} restored`)) load();
      return;
    }
    const reason = await ask({
      title: `Suspend ${user.displayName}?`,
      message: 'They will see this reason in the app and lose the ability to post, book, apply, review or report. Their jobs and profile are hidden from the feed and map.',
      confirmLabel: 'Suspend',
      danger: true,
      withReason: true,
    });
    if (reason === null) return;
    if (await run('suspend', () => setUserSuspended(actor, user, true, reason), `${user.displayName} suspended`)) load();
  };

  const toggleAdmin = async () => {
    const granting = !user.isAdmin;
    const ok = await ask({
      title: granting ? `Make ${user.displayName} an admin?` : `Remove admin from ${user.displayName}?`,
      message: granting ? 'Admins can sign in here, suspend users, hide content and change app settings.' : 'They will lose access to this console.',
      confirmLabel: granting ? 'Make admin' : 'Remove admin',
      danger: !granting,
    });
    if (ok === null) return;
    if (await run('admin', () => setUserAdmin(actor, user, granting), granting ? 'Admin access granted' : 'Admin access removed')) load();
  };

  const toggleVerified = async () => {
    if (!provider) return;
    const ok = await ask({
      title: verified ? 'Remove verified badge?' : `Verify ${user.displayName}?`,
      message: verified ? 'The verified badge disappears from their profile.' : 'Only verify after checking their identity (e.g. Aadhaar or a trade licence).',
      confirmLabel: verified ? 'Remove badge' : 'Verify provider',
      danger: verified,
    });
    if (ok === null) return;
    if (await run('verify', () => setProviderVerified(actor, provider, user.displayName, !verified), verified ? 'Verification removed' : 'Provider verified')) load();
  };

  return (
    <Layout
      section="users"
      title={user.displayName || 'Unnamed user'}
      subtitle={user.email}
      actions={
        <a className="btn btn-outline" href={href('users')}>
          <Icon name="arrowLeft" size={16} /> All users
        </a>
      }>
      <div className="detail">
        <div className="card card-pad">
          <div className="person">
            <Avatar name={user.displayName || '?'} src={user.photoURL} large />
            <div>
              <h2 style={{ fontSize: 18 }}>{user.displayName || 'Unnamed user'}</h2>
              <div className="badges" style={{ marginTop: 6 }}>
                {user.isAdmin ? <Badge tone="info">Admin</Badge> : null}
                {provider ? <Badge tone={verified ? 'success' : 'neutral'}>{verified ? 'Verified provider' : 'Provider'}</Badge> : null}
                {user.suspended ? <Badge tone="danger">Suspended</Badge> : null}
                {isSelf ? <Badge>You</Badge> : null}
              </div>
            </div>
          </div>
          <dl className="kv">
            <dt>Email</dt>
            <dd>{user.email || '—'}</dd>
            <dt>Phone</dt>
            <dd>{user.phone || '—'}</dd>
            <dt>Area</dt>
            <dd>{provider?.location || user.location || '—'}</dd>
            <dt>Joined</dt>
            <dd>{formatDate(user.createdAt)}</dd>
            {provider ? (
              <>
                <dt>Skills</dt>
                <dd>{provider.skills.join(', ') || '—'}</dd>
                <dt>Rate</dt>
                <dd>{provider.hourlyRate ? `₹${provider.hourlyRate}/hr` : '—'}</dd>
                <dt>Availability</dt>
                <dd>{provider.available ? 'Available' : 'Away'}</dd>
              </>
            ) : null}
            <dt>User ID</dt>
            <dd className="small">{user.uid}</dd>
          </dl>
          {user.suspended ? (
            <div className="notice notice-danger" style={{ marginTop: 16 }}>
              <strong>Suspended {timeAgo(user.suspendedAt)}</strong>
              <div>{user.suspendedReason || 'No reason given'}</div>
            </div>
          ) : null}
          <div className="stack" style={{ marginTop: 18 }}>
            <button className={`btn ${user.suspended ? 'btn-primary' : 'btn-danger'}`} onClick={toggleSuspend} disabled={!!busy || isSelf}>
              {user.suspended ? 'Restore account' : 'Suspend account'}
            </button>
            {provider ? (
              <button className="btn btn-outline" onClick={toggleVerified} disabled={!!busy}>
                {verified ? 'Remove verified badge' : 'Verify provider'}
              </button>
            ) : null}
            <button className="btn btn-outline" onClick={toggleAdmin} disabled={!!busy || isSelf}>
              {user.isAdmin ? 'Remove admin access' : 'Make admin'}
            </button>
            {isSelf ? <span className="small muted">You can't suspend yourself or remove your own admin access.</span> : null}
          </div>
        </div>

        <div>
          <div className="grid grid-4">
            <Stat label="Trust score" value={trust?.trustScore ?? 50} />
            <Stat label="Rating" value={trust?.reviewCount ? `${trust.reviewAverage.toFixed(1)}★` : 'New'} hint={`${trust?.reviewCount ?? 0} reviews`} />
            <Stat label="Open reports" value={openReports} hint={`${reportsAgainst.length} total`} />
            <Stat label="Reports filed" value={reportsFiled.length} />
          </div>

          <div className="section-title">
            <h2>Reports about them</h2>
          </div>
          <div className="card">
            {reportsAgainst.length === 0 ? (
              <Empty>No reports or blocks.</Empty>
            ) : (
              reportsAgainst.slice(0, 20).map((r) => (
                <div key={r.id} className="list-item">
                  <div className="row">
                    <Badge tone={r.type === 'report' ? 'danger' : 'neutral'}>{r.type === 'report' ? 'Report' : 'Block'}</Badge>
                    <Badge tone={!r.status || r.status === 'open' ? 'warning' : 'neutral'}>{capitalize(r.status ?? 'open')}</Badge>
                    <span className="small muted" style={{ marginLeft: 'auto' }}>
                      {timeAgo(r.createdAt)}
                    </span>
                  </div>
                  <div style={{ fontWeight: 600, marginTop: 6 }}>{r.reason}</div>
                  {r.note ? <div className="secondary small">{r.note}</div> : null}
                </div>
              ))
            )}
          </div>

          <div className="section-title">
            <h2>Jobs posted ({posts.length})</h2>
          </div>
          <div className="card">
            {posts.length === 0 ? (
              <Empty>No jobs posted.</Empty>
            ) : (
              posts.slice(0, 20).map((p) => (
                <div key={p.id} className="list-item row-between">
                  <div>
                    <div style={{ fontWeight: 600 }}>{p.title}</div>
                    <div className="small muted">
                      {p.skill} · {p.location || 'No area'} · {timeAgo(p.createdAt)}
                    </div>
                  </div>
                  {p.hidden ? <Badge tone="danger">Hidden</Badge> : <Badge tone="success">Live</Badge>}
                </div>
              ))
            )}
          </div>

          <div className="section-title">
            <h2>Bookings ({bookings.length})</h2>
          </div>
          <div className="card">
            {bookings.length === 0 ? (
              <Empty>No bookings.</Empty>
            ) : (
              bookings.slice(0, 20).map((b) => (
                <div key={b.id} className="list-item row-between">
                  <div>
                    <div style={{ fontWeight: 600 }}>
                      {b.skill} <span className="small muted">· {b.providerUid === user.uid ? 'as provider' : 'as customer'}</span>
                    </div>
                    <div className="small muted">{b.message}</div>
                  </div>
                  <Badge tone={BOOKING_TONE[b.status]}>{capitalize(b.status)}</Badge>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
