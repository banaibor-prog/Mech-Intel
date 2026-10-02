import { useCallback, useEffect, useMemo, useState } from 'react';
import Layout from '../components/Layout';
import { Empty, Loading, SearchBox, Stars, Tabs, timeAgo, useAction, useFeedback } from '../components/ui';
import { href } from '../router';
import { useAdmin } from '../session';
import { deleteReviewAsAdmin, getNames, listReviews } from '../services/admin';
import { ProfileReview } from '../../../src/types/models';

type Filter = 'all' | 'low';

export default function Reviews() {
  const { actor } = useAdmin();
  const { ask } = useFeedback();
  const { busy, run } = useAction();
  const [reviews, setReviews] = useState<ProfileReview[] | null>(null);
  const [names, setNames] = useState<Record<string, string>>({});
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  const load = useCallback(async () => {
    try {
      const next = await listReviews();
      setReviews(next);
      setNames(await getNames(next.map((r) => r.targetUid)));
    } catch {
      setReviews([]);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const low = (reviews ?? []).filter((r) => r.rating <= 2).length;
  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (reviews ?? []).filter((r) => {
      if (filter === 'low' && r.rating > 2) return false;
      return !term || `${r.comment} ${r.reviewerName} ${names[r.targetUid] ?? ''} ${r.projectTitle ?? ''}`.toLowerCase().includes(term);
    });
  }, [reviews, names, search, filter]);

  const remove = async (r: ProfileReview) => {
    const reason = await ask({
      title: 'Delete this review?',
      message: 'Only remove reviews that are abusive, fake or about the wrong person. The trust score is recalculated.',
      confirmLabel: 'Delete review',
      danger: true,
      withReason: true,
    });
    if (reason !== null && (await run(r.id, () => deleteReviewAsAdmin(actor, r, reason), 'Review deleted'))) load();
  };

  return (
    <Layout section="reviews" title="Reviews" subtitle="Ratings members leave each other after a job.">
      <div className="toolbar">
        <SearchBox value={search} onChange={setSearch} placeholder="Search text, reviewer or member" />
        <Tabs
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'all', label: 'All', count: reviews?.length ?? 0 },
            { value: 'low', label: '1–2 stars', count: low },
          ]}
        />
      </div>
      <div className="card table-wrap">
        {!reviews ? (
          <Loading label="Loading reviews…" />
        ) : visible.length === 0 ? (
          <Empty>{search ? 'No reviews match your search.' : 'No reviews yet.'}</Empty>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Review</th>
                <th>Reviewer → Member</th>
                <th>When</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {visible.map((r) => (
                <tr key={r.id}>
                  <td>
                    <Stars rating={r.rating} />
                    <div className="clamp" style={{ marginTop: 4 }}>{r.comment}</div>
                    {r.projectTitle ? <div className="small muted">{r.projectTitle}</div> : null}
                  </td>
                  <td className="nowrap">
                    <a href={href(`users/${r.reviewerUid}`)}>{r.reviewerName}</a>
                    <span className="muted"> → </span>
                    <a href={href(`users/${r.targetUid}`)}>{names[r.targetUid] ?? 'Member'}</a>
                  </td>
                  <td className="nowrap secondary">{timeAgo(r.createdAt)}</td>
                  <td>
                    <div className="actions">
                      <button className="btn btn-ghost btn-sm" onClick={() => remove(r)} disabled={busy === r.id}>
                        Delete
                      </button>
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
