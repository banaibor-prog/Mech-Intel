import { useEffect, useMemo, useRef, useState } from 'react';
import Layout from '../components/Layout';
import { Loading, timeAgo, useAction, useFeedback } from '../components/ui';
import { useAdmin } from '../session';
import { logConfigChange } from '../services/admin';
import { saveAppConfig, subscribeToAppConfig } from '../services/config';
import { AnnouncementTone, AppConfig } from '../../../src/types/models';

const TONES: { value: AnnouncementTone; label: string; color: string }[] = [
  { value: 'info', label: 'Info', color: '#3b82f6' },
  { value: 'success', label: 'Good news', color: '#15803d' },
  { value: 'warning', label: 'Warning', color: '#f59e0b' },
];

function describeChanges(before: AppConfig, after: AppConfig): string[] {
  const out: string[] = [];
  if (before.maintenance.enabled !== after.maintenance.enabled) out.push(`maintenance ${after.maintenance.enabled ? 'on' : 'off'}`);
  else if (before.maintenance.message !== after.maintenance.message) out.push('maintenance message');
  if (before.announcement.active !== after.announcement.active) out.push(`announcement ${after.announcement.active ? 'published' : 'removed'}`);
  else if (before.announcement.title !== after.announcement.title || before.announcement.message !== after.announcement.message || before.announcement.tone !== after.announcement.tone)
    out.push('announcement text');
  if (before.allowNewPosts !== after.allowNewPosts) out.push(`new job posts ${after.allowNewPosts ? 'allowed' : 'paused'}`);
  if (before.showDemoContent !== after.showDemoContent) out.push(`demo content ${after.showDemoContent ? 'shown' : 'hidden'}`);
  if ((before.supportEmail ?? '') !== (after.supportEmail ?? '')) out.push('support email');
  return out;
}

function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="switch">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} aria-label={label} />
      <span />
    </label>
  );
}

export default function Settings() {
  const { actor } = useAdmin();
  const { ask, toast } = useFeedback();
  const { busy, run } = useAction();
  const [live, setLive] = useState<AppConfig | null>(null);
  const [draft, setDraft] = useState<AppConfig | null>(null);
  const liveRef = useRef<AppConfig | null>(null);

  // Pick up changes saved elsewhere, but never overwrite edits that haven't been saved yet.
  useEffect(
    () =>
      subscribeToAppConfig((c) => {
        const prev = liveRef.current;
        liveRef.current = c;
        setLive(c);
        setDraft((d) => (d && prev && describeChanges(prev, d).length ? d : c));
      }),
    [],
  );

  const changes = useMemo(() => (live && draft ? describeChanges(live, draft) : []), [live, draft]);

  if (!live || !draft) {
    return (
      <Layout section="settings" title="App settings">
        <Loading />
      </Layout>
    );
  }

  const setAnn = (patch: Partial<AppConfig['announcement']>) => setDraft({ ...draft, announcement: { ...draft.announcement, ...patch } });
  const setMaint = (patch: Partial<AppConfig['maintenance']>) => setDraft({ ...draft, maintenance: { ...draft.maintenance, ...patch } });

  const save = async () => {
    if (draft.announcement.active && !draft.announcement.title.trim() && !draft.announcement.message.trim()) {
      toast('Add an announcement title or message, or switch it off.', true);
      return;
    }
    if (draft.maintenance.enabled && !live.maintenance.enabled) {
      const ok = await ask({ title: 'Turn on maintenance mode?', message: 'Everyone except admins will be locked out of the app until you switch it off.', confirmLabel: 'Turn on', danger: true });
      if (ok === null) return;
    }
    await run(
      'save',
      async () => {
        await saveAppConfig(
          {
            maintenance: { enabled: draft.maintenance.enabled, message: draft.maintenance.message.trim() || live.maintenance.message },
            announcement: { ...draft.announcement, title: draft.announcement.title.trim(), message: draft.announcement.message.trim() },
            allowNewPosts: draft.allowNewPosts,
            showDemoContent: draft.showDemoContent,
            supportEmail: draft.supportEmail?.trim() ?? '',
          },
          actor.uid,
        );
        await logConfigChange(actor, `Updated settings: ${changes.join(', ')}`);
      },
      'Settings saved — live for everyone now',
    );
  };

  const tone = TONES.find((t) => t.value === draft.announcement.tone) ?? TONES[0];

  return (
    <Layout
      section="settings"
      title="App settings"
      subtitle={live.updatedAt ? `Last changed ${timeAgo(live.updatedAt)}` : 'Changes apply to everyone using the app.'}
      actions={
        <div className="row">
          {changes.length ? (
            <button className="btn btn-ghost" onClick={() => setDraft(live)}>
              Discard
            </button>
          ) : null}
          <button className="btn btn-primary" onClick={save} disabled={!changes.length || busy === 'save'}>
            {busy === 'save' ? 'Saving…' : changes.length ? `Save ${changes.length} change${changes.length === 1 ? '' : 's'}` : 'No changes'}
          </button>
        </div>
      }>
      <div className="grid grid-2" style={{ alignItems: 'start' }}>
        <div className="card card-pad">
          <div className="toggle">
            <div>
              <strong>Announcement</strong>
              <p>A banner at the top of everyone's Home screen.</p>
            </div>
            <Switch label="Show announcement" checked={draft.announcement.active} onChange={(v) => setAnn({ active: v })} />
          </div>
          <label className="field">
            <span>Title</span>
            <input value={draft.announcement.title} onChange={(e) => setAnn({ title: e.target.value })} placeholder="e.g. Khublei Shillong!" />
          </label>
          <label className="field">
            <span>Message</span>
            <textarea value={draft.announcement.message} onChange={(e) => setAnn({ message: e.target.value })} placeholder="What should everyone know?" />
          </label>
          <div className="field">
            <span>Style</span>
            <div className="tabs">
              {TONES.map((t) => (
                <button key={t.value} type="button" className={draft.announcement.tone === t.value ? 'active' : ''} onClick={() => setAnn({ tone: t.value })}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          {draft.announcement.title || draft.announcement.message ? (
            <div className="field">
              <span>Preview</span>
              <div className="announcement" style={{ ['--tone' as string]: tone.color }}>
                <div>
                  {draft.announcement.title ? <strong>{draft.announcement.title}</strong> : null}
                  {draft.announcement.message ? <p>{draft.announcement.message}</p> : null}
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <div className="stack" style={{ gap: 12 }}>
          <div className="card card-pad">
            <div className="toggle">
              <div>
                <strong>Allow new job posts</strong>
                <p>Turn off to pause posting, e.g. during a spam wave. Admins can still post.</p>
              </div>
              <Switch label="Allow new job posts" checked={draft.allowNewPosts} onChange={(v) => setDraft({ ...draft, allowNewPosts: v })} />
            </div>
            <div className="divider" />
            <div className="toggle">
              <div>
                <strong>Show demo content</strong>
                <p>Mix the built-in sample jobs and pros into the feed and map. Turn off once real listings fill the app.</p>
              </div>
              <Switch label="Show demo content" checked={draft.showDemoContent} onChange={(v) => setDraft({ ...draft, showDemoContent: v })} />
            </div>
          </div>

          <div className="card card-pad" style={draft.maintenance.enabled ? { borderColor: 'var(--danger)' } : undefined}>
            <div className="toggle">
              <div>
                <strong>Maintenance mode</strong>
                <p>Everyone except admins sees the message below instead of the app.</p>
              </div>
              <Switch label="Maintenance mode" checked={draft.maintenance.enabled} onChange={(v) => setMaint({ enabled: v })} />
            </div>
            <label className="field">
              <span>Message</span>
              <textarea value={draft.maintenance.message} onChange={(e) => setMaint({ message: e.target.value })} />
            </label>
          </div>

          <div className="card card-pad">
            <label className="field" style={{ marginTop: 0 }}>
              <span>Support email</span>
              <input type="email" value={draft.supportEmail ?? ''} onChange={(e) => setDraft({ ...draft, supportEmail: e.target.value })} placeholder="support@example.com" />
              <small>Shown on the suspended-account and maintenance screens in the app.</small>
            </label>
          </div>
        </div>
      </div>
    </Layout>
  );
}
