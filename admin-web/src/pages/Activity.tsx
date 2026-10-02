import { useEffect, useMemo, useState } from 'react';
import Layout from '../components/Layout';
import { Empty, Loading, SearchBox, formatDateTime } from '../components/ui';
import { href } from '../router';
import { listAdminLogs } from '../services/admin';
import { AdminLog } from '../../../src/types/models';

const TARGET_LABEL: Record<AdminLog['targetType'], string> = {
  user: 'User',
  provider: 'Provider',
  post: 'Job',
  booking: 'Booking',
  report: 'Report',
  review: 'Review',
  config: 'Settings',
};

export default function Activity() {
  const [logs, setLogs] = useState<AdminLog[] | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    listAdminLogs().then(setLogs).catch(() => setLogs([]));
  }, []);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (logs ?? []).filter((l) => !term || `${l.summary} ${l.note ?? ''} ${l.actorName} ${l.action}`.toLowerCase().includes(term));
  }, [logs, search]);

  return (
    <Layout section="activity" title="Activity log" subtitle="Every change made by an admin. Entries can't be edited or deleted.">
      <div className="toolbar">
        <SearchBox value={search} onChange={setSearch} placeholder="Search actions, admins or notes" />
      </div>
      <div className="card table-wrap">
        {!logs ? (
          <Loading label="Loading activity…" />
        ) : visible.length === 0 ? (
          <Empty>No admin actions yet.</Empty>
        ) : (
          <table>
            <thead>
              <tr>
                <th>When</th>
                <th>Action</th>
                <th>Type</th>
                <th>Admin</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((l) => (
                <tr key={l.id}>
                  <td className="nowrap secondary">{formatDateTime(l.createdAt)}</td>
                  <td>
                    <div className="primary">
                      {l.targetType === 'user' || l.targetType === 'provider' ? <a href={href(`users/${l.targetId}`)}>{l.summary}</a> : l.summary}
                    </div>
                    {l.note ? <div className="secondary">“{l.note}”</div> : null}
                  </td>
                  <td className="secondary">{TARGET_LABEL[l.targetType] ?? l.targetType}</td>
                  <td className="nowrap">{l.actorName}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Layout>
  );
}
