import { useEffect, useMemo, useState } from 'react';
import Layout from '../components/Layout';
import { Avatar, Badge, Empty, Loading, SearchBox, Tabs, formatDate } from '../components/ui';
import { go } from '../router';
import { listUsers } from '../services/admin';
import { UserProfile } from '../../../src/types/models';

type Filter = 'all' | 'providers' | 'admins' | 'suspended';

export default function Users({ initialFilter }: { initialFilter?: string }) {
  const [users, setUsers] = useState<UserProfile[] | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>((['providers', 'admins', 'suspended'].includes(initialFilter ?? '') ? initialFilter : 'all') as Filter);

  useEffect(() => {
    listUsers().then(setUsers).catch(() => setUsers([]));
  }, []);

  const counts = useMemo(() => {
    const all = users ?? [];
    return {
      all: all.length,
      providers: all.filter((u) => u.isProvider).length,
      admins: all.filter((u) => u.isAdmin).length,
      suspended: all.filter((u) => u.suspended).length,
    };
  }, [users]);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (users ?? []).filter((u) => {
      if (filter === 'providers' && !u.isProvider) return false;
      if (filter === 'admins' && !u.isAdmin) return false;
      if (filter === 'suspended' && !u.suspended) return false;
      return !term || `${u.displayName} ${u.email} ${u.phone ?? ''} ${u.location ?? ''} ${u.uid}`.toLowerCase().includes(term);
    });
  }, [users, search, filter]);

  return (
    <Layout section="users" title="Users" subtitle="Everyone who has signed up. Open a member to suspend, verify or grant admin.">
      <div className="toolbar">
        <SearchBox value={search} onChange={setSearch} placeholder="Search name, email, phone, area or ID" />
        <Tabs
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'all', label: 'All', count: counts.all },
            { value: 'providers', label: 'Providers', count: counts.providers },
            { value: 'admins', label: 'Admins', count: counts.admins },
            { value: 'suspended', label: 'Suspended', count: counts.suspended },
          ]}
        />
      </div>
      <div className="card table-wrap">
        {!users ? (
          <Loading label="Loading users…" />
        ) : visible.length === 0 ? (
          <Empty>{search ? 'No users match your search.' : 'No users in this group.'}</Empty>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Member</th>
                <th>Phone / area</th>
                <th>Status</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((u) => (
                <tr key={u.uid} className="clickable" onClick={() => go(`users/${u.uid}`)}>
                  <td>
                    <div className="person">
                      <Avatar name={u.displayName || '?'} src={u.photoURL} />
                      <div>
                        <div className="primary">{u.displayName || 'Unnamed user'}</div>
                        <div className="secondary">{u.email || u.uid}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div>{u.phone || '—'}</div>
                    <div className="secondary">{u.location || ''}</div>
                  </td>
                  <td>
                    <div className="badges">
                      {u.isAdmin ? <Badge tone="info">Admin</Badge> : null}
                      {u.isProvider ? <Badge>Provider</Badge> : null}
                      {u.suspended ? <Badge tone="danger">Suspended</Badge> : null}
                      {!u.isAdmin && !u.isProvider && !u.suspended ? <span className="muted small">Member</span> : null}
                    </div>
                  </td>
                  <td className="nowrap secondary">{formatDate(u.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Layout>
  );
}
