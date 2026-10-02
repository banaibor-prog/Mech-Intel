import { useCallback, useEffect, useMemo, useState } from 'react';
import Layout from '../components/Layout';
import { Badge, Empty, Loading, SearchBox, Tabs, timeAgo, useAction, useFeedback } from '../components/ui';
import { href } from '../router';
import { useAdmin } from '../session';
import { deletePostAsAdmin, getNames, listPosts, setPostHidden } from '../services/admin';
import { Post } from '../../../src/types/models';

type Filter = 'live' | 'hidden' | 'all';

export default function Jobs({ initialFilter }: { initialFilter?: string }) {
  const { actor } = useAdmin();
  const { ask } = useFeedback();
  const { busy, run } = useAction();
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [names, setNames] = useState<Record<string, string>>({});
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>(initialFilter === 'hidden' ? 'hidden' : 'live');

  const load = useCallback(async () => {
    try {
      const next = await listPosts();
      setPosts(next);
      setNames(await getNames(next.map((p) => p.authorUid)));
    } catch {
      setPosts([]);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const hidden = (posts ?? []).filter((p) => p.hidden).length;
  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (posts ?? []).filter((p) => {
      if (filter === 'live' && p.hidden) return false;
      if (filter === 'hidden' && !p.hidden) return false;
      return !term || `${p.title} ${p.description} ${p.skill} ${p.location ?? ''} ${names[p.authorUid] ?? ''}`.toLowerCase().includes(term);
    });
  }, [posts, names, search, filter]);

  const hide = async (p: Post) => {
    const reason = await ask({ title: 'Hide this job?', message: 'It disappears from the feed and map but is kept so you can restore it.', confirmLabel: 'Hide job', danger: true, withReason: true });
    if (reason !== null && (await run(p.id, () => setPostHidden(actor, p, true, reason), 'Job hidden'))) load();
  };
  const restore = async (p: Post) => {
    if ((await ask({ title: 'Restore this job?', message: 'It will show in the feed and on the map again.', confirmLabel: 'Restore' })) === null) return;
    if (await run(p.id, () => setPostHidden(actor, p, false), 'Job restored')) load();
  };
  const remove = async (p: Post) => {
    const reason = await ask({ title: 'Delete this job permanently?', message: 'This cannot be undone. Prefer hiding unless the content is illegal or abusive.', confirmLabel: 'Delete', danger: true, withReason: true });
    if (reason !== null && (await run(p.id, () => deletePostAsAdmin(actor, p, reason), 'Job deleted'))) load();
  };

  return (
    <Layout section="jobs" title="Jobs" subtitle="Job posts from customers. Hide anything that breaks the rules.">
      <div className="toolbar">
        <SearchBox value={search} onChange={setSearch} placeholder="Search title, skill, area or poster" />
        <Tabs
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'live', label: 'Live', count: (posts?.length ?? 0) - hidden },
            { value: 'hidden', label: 'Hidden', count: hidden },
            { value: 'all', label: 'All', count: posts?.length ?? 0 },
          ]}
        />
      </div>
      <div className="card table-wrap">
        {!posts ? (
          <Loading label="Loading jobs…" />
        ) : visible.length === 0 ? (
          <Empty>{search ? 'No jobs match your search.' : 'No jobs here.'}</Empty>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Job</th>
                <th>Posted by</th>
                <th>Budget</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {visible.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div className="primary">{p.title}</div>
                    <div className="secondary clamp">{p.description}</div>
                    <div className="small muted" style={{ marginTop: 4 }}>
                      {p.skill} · {p.location || 'No area'} · {timeAgo(p.createdAt)} · {p.applicantCount} applied
                    </div>
                  </td>
                  <td>
                    <a href={href(`users/${p.authorUid}`)}>{names[p.authorUid] ?? 'Member'}</a>
                  </td>
                  <td className="nowrap">{p.budget ? `₹${p.budget.toLocaleString('en-IN')}` : '—'}</td>
                  <td>
                    {p.hidden ? <Badge tone="danger">Hidden</Badge> : <Badge tone="success">Live</Badge>}
                    {p.hidden && p.hiddenReason ? <div className="small muted" style={{ marginTop: 4 }}>{p.hiddenReason}</div> : null}
                  </td>
                  <td>
                    <div className="actions">
                      {p.hidden ? (
                        <button className="btn btn-outline btn-sm" onClick={() => restore(p)} disabled={busy === p.id}>
                          Restore
                        </button>
                      ) : (
                        <button className="btn btn-outline btn-sm" onClick={() => hide(p)} disabled={busy === p.id}>
                          Hide
                        </button>
                      )}
                      <button className="btn btn-ghost btn-sm" onClick={() => remove(p)} disabled={busy === p.id}>
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
