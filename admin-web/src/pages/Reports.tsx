import { useEffect, useMemo, useRef, useState } from 'react';
import Layout from '../components/Layout';
import { Badge, Empty, Loading, Tabs, capitalize, timeAgo, useAction, useFeedback } from '../components/ui';
import { href } from '../router';
import { useAdmin } from '../session';
import { getNames, setReportStatus, subscribeToReports } from '../services/admin';
import { TrustAction } from '../../../src/types/models';

type Filter = 'open' | 'resolved' | 'dismissed' | 'all';
const isOpen = (r: TrustAction) => !r.status || r.status === 'open';

export default function Reports() {
  const { actor } = useAdmin();
  const { ask } = useFeedback();
  const { busy, run } = useAction();
  const [reports, setReports] = useState<TrustAction[] | null>(null);
  const [names, setNames] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState<Filter>('open');
  const cache = useRef<Record<string, string>>({});

  useEffect(
    () =>
      subscribeToReports(async (next) => {
        const missing = next.flatMap((r) => [r.reporterUid, r.targetUid]).filter((uid) => !cache.current[uid]);
        if (missing.length) Object.assign(cache.current, await getNames(missing));
        setNames({ ...cache.current });
        setReports(next);
      }),
    [],
  );

  const all = reports ?? [];
  const counts = {
    open: all.filter(isOpen).length,
    resolved: all.filter((r) => r.status === 'resolved').length,
    dismissed: all.filter((r) => r.status === 'dismissed').length,
    all: all.length,
  };
  const visible = useMemo(() => all.filter((r) => (filter === 'all' ? true : filter === 'open' ? isOpen(r) : r.status === filter)), [reports, filter]); // eslint-disable-line react-hooks/exhaustive-deps

  const decide = async (r: TrustAction, status: 'resolved' | 'dismissed') => {
    const note = await ask({
      title: status === 'resolved' ? 'Mark as resolved?' : 'Dismiss this report?',
      message:
        status === 'resolved'
          ? 'Use this once you have acted on it (e.g. warned or suspended the user, or hidden the job).'
          : 'Dismissed reports no longer count against the reported member’s trust score.',
      confirmLabel: status === 'resolved' ? 'Resolve' : 'Dismiss',
      withReason: true,
      placeholder: 'Note for the activity log (optional)',
    });
    if (note !== null) await run(r.id, () => setReportStatus(actor, r, status, note), status === 'resolved' ? 'Report resolved' : 'Report dismissed');
  };

  return (
    <Layout section="reports" title="Reports & blocks" subtitle="What members flagged. Open the member to suspend them if needed.">
      <div className="toolbar">
        <Tabs
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'open', label: 'Open', count: counts.open },
            { value: 'resolved', label: 'Resolved', count: counts.resolved },
            { value: 'dismissed', label: 'Dismissed', count: counts.dismissed },
            { value: 'all', label: 'All', count: counts.all },
          ]}
        />
      </div>
      <div className="card table-wrap">
        {!reports ? (
          <Loading label="Loading reports…" />
        ) : visible.length === 0 ? (
          <Empty>{filter === 'open' ? 'No open reports. Nice and quiet.' : 'Nothing here.'}</Empty>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Report</th>
                <th>About</th>
                <th>Reported by</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {visible.map((r) => (
                <tr key={r.id}>
                  <td>
                    <div className="row">
                      <Badge tone={r.type === 'report' ? 'danger' : 'neutral'}>{r.type === 'report' ? 'Report' : 'Block'}</Badge>
                      <span className="small muted">{timeAgo(r.createdAt)}</span>
                    </div>
                    <div className="primary" style={{ marginTop: 6 }}>{r.reason}</div>
                    {r.note ? <div className="secondary clamp">{r.note}</div> : null}
                  </td>
                  <td className="nowrap">
                    <a href={href(`users/${r.targetUid}`)}>{names[r.targetUid] ?? '…'}</a>
                  </td>
                  <td className="nowrap">
                    <a href={href(`users/${r.reporterUid}`)}>{names[r.reporterUid] ?? '…'}</a>
                  </td>
                  <td>
                    <Badge tone={isOpen(r) ? 'warning' : r.status === 'resolved' ? 'success' : 'neutral'}>{capitalize(r.status ?? 'open')}</Badge>
                    {!isOpen(r) && r.resolution ? <div className="small muted" style={{ marginTop: 4 }}>{r.resolution}</div> : null}
                  </td>
                  <td>
                    {isOpen(r) ? (
                      <div className="actions">
                        <button className="btn btn-outline btn-sm" onClick={() => decide(r, 'dismissed')} disabled={busy === r.id}>
                          Dismiss
                        </button>
                        <button className="btn btn-dark btn-sm" onClick={() => decide(r, 'resolved')} disabled={busy === r.id}>
                          Resolve
                        </button>
                      </div>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Layout>
  );
}
