import { useCallback, useEffect, useMemo, useState } from 'react';
import Layout from '../components/Layout';
import { Badge, Empty, Loading, SearchBox, Tabs, capitalize, formatDate, useAction, useFeedback } from '../components/ui';
import { href } from '../router';
import { useAdmin } from '../session';
import { cancelBookingAsAdmin, getNames, listBookings } from '../services/admin';
import { Booking, BookingStatus } from '../../../src/types/models';

type Filter = 'active' | 'completed' | 'closed' | 'all';
const TONE = { pending: 'warning', accepted: 'success', declined: 'danger', cancelled: 'neutral', completed: 'info' } as const;
const ACTIVE: BookingStatus[] = ['pending', 'accepted'];
const CLOSED: BookingStatus[] = ['declined', 'cancelled'];

export default function Bookings({ initialFilter }: { initialFilter?: string }) {
  const { actor } = useAdmin();
  const { ask } = useFeedback();
  const { busy, run } = useAction();
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [names, setNames] = useState<Record<string, string>>({});
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>(initialFilter === 'completed' ? 'completed' : 'active');

  const load = useCallback(async () => {
    try {
      const next = await listBookings();
      setBookings(next);
      setNames(await getNames(next.flatMap((b) => [b.providerUid, b.customerUid])));
    } catch {
      setBookings([]);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const all = bookings ?? [];
  const counts = {
    active: all.filter((b) => ACTIVE.includes(b.status)).length,
    completed: all.filter((b) => b.status === 'completed').length,
    closed: all.filter((b) => CLOSED.includes(b.status)).length,
    all: all.length,
  };
  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return all.filter((b) => {
      if (filter === 'active' && !ACTIVE.includes(b.status)) return false;
      if (filter === 'completed' && b.status !== 'completed') return false;
      if (filter === 'closed' && !CLOSED.includes(b.status)) return false;
      return !term || `${b.skill} ${b.message} ${names[b.providerUid] ?? ''} ${names[b.customerUid] ?? ''}`.toLowerCase().includes(term);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookings, names, search, filter]);

  const cancel = async (b: Booking) => {
    const reason = await ask({ title: 'Cancel this booking?', message: 'Both people will see it as cancelled. Use this for disputes or abuse.', confirmLabel: 'Cancel booking', danger: true, withReason: true });
    if (reason !== null && (await run(b.id, () => cancelBookingAsAdmin(actor, b, reason), 'Booking cancelled'))) load();
  };

  return (
    <Layout section="bookings" title="Bookings" subtitle="Requests from customers to providers.">
      <div className="toolbar">
        <SearchBox value={search} onChange={setSearch} placeholder="Search skill, message or person" />
        <Tabs
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'active', label: 'Active', count: counts.active },
            { value: 'completed', label: 'Completed', count: counts.completed },
            { value: 'closed', label: 'Declined / cancelled', count: counts.closed },
            { value: 'all', label: 'All', count: counts.all },
          ]}
        />
      </div>
      <div className="card table-wrap">
        {!bookings ? (
          <Loading label="Loading bookings…" />
        ) : visible.length === 0 ? (
          <Empty>{search ? 'No bookings match your search.' : 'No bookings here.'}</Empty>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Request</th>
                <th>Customer → Provider</th>
                <th>Requested</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {visible.map((b) => (
                <tr key={b.id}>
                  <td>
                    <div className="primary">{b.skill}</div>
                    <div className="secondary clamp">{b.message}</div>
                    {b.preferredDate ? <div className="small muted">Preferred: {b.preferredDate}</div> : null}
                  </td>
                  <td className="nowrap">
                    <a href={href(`users/${b.customerUid}`)}>{names[b.customerUid] ?? 'Customer'}</a>
                    <span className="muted"> → </span>
                    <a href={href(`users/${b.providerUid}`)}>{names[b.providerUid] ?? 'Provider'}</a>
                  </td>
                  <td className="nowrap secondary">{formatDate(b.createdAt)}</td>
                  <td>
                    <Badge tone={TONE[b.status]}>{capitalize(b.status)}</Badge>
                  </td>
                  <td>
                    <div className="actions">
                      {ACTIVE.includes(b.status) ? (
                        <button className="btn btn-outline btn-sm" onClick={() => cancel(b)} disabled={busy === b.id}>
                          Cancel
                        </button>
                      ) : null}
                    </div>
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
