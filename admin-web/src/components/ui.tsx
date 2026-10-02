import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { LOGO_ARMS, LOGO_HEAD, LOGO_RIBS, LOGO_VIEWBOX, LOGO_WEAVE, LOGO_WINGS, BRAND_GRADIENT, BRAND_GRADIENT_VECTOR } from '../../../src/components/brand/logoPaths';

// ---------------------------------------------------------------- icons

const ICONS = {
  dashboard: 'M3 3h7v9H3zM14 3h7v5h-7zM14 12h7v9h-7zM3 16h7v5H3z',
  flag: 'M4 22V4m0 0h12l-2 4 2 4H4',
  users: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
  briefcase: 'M3 7h18v13H3zM16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2M3 13h18',
  calendar: 'M3 5h18v16H3zM16 3v4M8 3v4M3 10h18',
  star: 'M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z',
  settings: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z',
  clock: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2',
  search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.35-4.35',
  logout: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9',
  arrowLeft: 'M19 12H5M12 19l-7-7 7-7',
  external: 'M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3',
} as const;
export type IconName = keyof typeof ICONS;

export function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={ICONS[name]} />
    </svg>
  );
}

export function Logo({ size = 36 }: { size?: number }) {
  const id = 'gyc-gradient';
  return (
    <svg width={size} height={size * 0.6106} viewBox={LOGO_VIEWBOX} aria-label="Got You Covered">
      <defs>
        <linearGradient id={id} gradientUnits="userSpaceOnUse" x1={BRAND_GRADIENT_VECTOR.x1} y1={BRAND_GRADIENT_VECTOR.y1} x2={BRAND_GRADIENT_VECTOR.x2} y2={BRAND_GRADIENT_VECTOR.y2}>
          {BRAND_GRADIENT.map((s) => (
            <stop key={s.offset} offset={s.offset} stopColor={s.color} />
          ))}
        </linearGradient>
      </defs>
      <g fill={`url(#${id})`}>
        {LOGO_WINGS.map((d) => <path key={d} d={d} />)}
        {LOGO_RIBS.map((d) => <path key={d} d={d} />)}
        <path d={LOGO_WEAVE} fillRule="evenodd" />
        <path d={LOGO_HEAD} />
        <path d={LOGO_ARMS} />
      </g>
    </svg>
  );
}

// ---------------------------------------------------------------- small pieces

type Tone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

export function Badge({ children, tone = 'neutral' }: { children: React.ReactNode; tone?: Tone }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

export function Avatar({ name, src, large }: { name: string; src?: string; large?: boolean }) {
  const cls = `avatar${large ? ' avatar-lg' : ''}`;
  if (src) return <img className={cls} src={src} alt="" referrerPolicy="no-referrer" />;
  const initials = name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '').join('') || '?';
  return <span className={cls}>{initials}</span>;
}

export function Loading({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="loading">
      <span className="spinner" /> {label}
    </div>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <div className="empty">{children}</div>;
}

export function Stat({ label, value, hint, onClick }: { label: string; value: React.ReactNode; hint?: string; onClick?: () => void }) {
  const inner = (
    <>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
      {hint ? <div className="stat-hint">{hint}</div> : null}
    </>
  );
  return onClick ? (
    <button type="button" className="stat" onClick={onClick}>
      {inner}
    </button>
  ) : (
    <div className="stat">{inner}</div>
  );
}

export function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <label className="search">
      <Icon name="search" size={16} />
      <input type="search" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </label>
  );
}

export function Tabs<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { value: T; label: string; count?: number }[] }) {
  return (
    <div className="tabs" role="tablist">
      {options.map((o) => (
        <button key={o.value} type="button" role="tab" aria-selected={o.value === value} className={o.value === value ? 'active' : ''} onClick={() => onChange(o.value)}>
          {o.label}
          {o.count !== undefined ? <span className="n">{o.count}</span> : null}
        </button>
      ))}
    </div>
  );
}

export function Stars({ rating }: { rating: number }) {
  return (
    <span className="stars" aria-label={`${rating} out of 5`}>
      {'★★★★★'.split('').map((s, i) => (
        <span key={i} className={i < rating ? '' : 'off'}>
          {s}
        </span>
      ))}
    </span>
  );
}

export function formatDate(ts?: number) {
  if (!ts) return '—';
  return new Date(ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatDateTime(ts?: number) {
  if (!ts) return '—';
  return new Date(ts).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export function timeAgo(ts?: number) {
  if (!ts) return '—';
  const mins = Math.max(1, Math.round((Date.now() - ts) / 60000));
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(ts);
}

export function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ---------------------------------------------------------------- confirm / reason dialog + toasts

interface AskOptions {
  title: string;
  message?: string;
  confirmLabel: string;
  danger?: boolean;
  withReason?: boolean;
  placeholder?: string;
}

interface Feedback {
  ask: (o: AskOptions) => Promise<string | null>;
  toast: (message: string, error?: boolean) => void;
}

const FeedbackContext = createContext<Feedback>({ ask: async () => null, toast: () => {} });

export function useFeedback() {
  return useContext(FeedbackContext);
}

export function FeedbackProvider({ children }: { children: React.ReactNode }) {
  const [dialog, setDialog] = useState<AskOptions | null>(null);
  const [text, setText] = useState('');
  const [toasts, setToasts] = useState<{ id: number; message: string; error?: boolean }[]>([]);
  const resolver = useRef<((v: string | null) => void) | null>(null);

  const ask = useCallback((o: AskOptions) => {
    setText('');
    setDialog(o);
    return new Promise<string | null>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const close = (v: string | null) => {
    resolver.current?.(v);
    resolver.current = null;
    setDialog(null);
  };

  const toast = useCallback((message: string, error?: boolean) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, error }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  }, []);

  return (
    <FeedbackContext.Provider value={{ ask, toast }}>
      {children}
      {dialog ? (
        <div className="backdrop" onMouseDown={(e) => e.target === e.currentTarget && close(null)}>
          <div className="modal" role="dialog" aria-modal="true" aria-labelledby="dlg-title">
            <h3 id="dlg-title">{dialog.title}</h3>
            {dialog.message ? <p>{dialog.message}</p> : null}
            {dialog.withReason ? (
              <textarea autoFocus value={text} onChange={(e) => setText(e.target.value)} placeholder={dialog.placeholder ?? 'Reason (shown to the user where relevant)'} />
            ) : null}
            <div className="modal-actions">
              <button type="button" className="btn btn-outline" onClick={() => close(null)}>
                Cancel
              </button>
              <button type="button" className={`btn ${dialog.danger ? 'btn-danger' : 'btn-primary'}`} onClick={() => close(text.trim())} autoFocus={!dialog.withReason}>
                {dialog.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      ) : null}
      <div className="toasts" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast${t.error ? ' error' : ''}`}>
            {t.message}
          </div>
        ))}
      </div>
    </FeedbackContext.Provider>
  );
}

/** Runs an admin action with a success/error toast. Returns true on success. */
export function useAction() {
  const { toast } = useFeedback();
  const [busy, setBusy] = useState<string | null>(null);
  const run = useCallback(
    async (key: string, fn: () => Promise<void>, success: string) => {
      setBusy(key);
      try {
        await fn();
        toast(success);
        return true;
      } catch (e: unknown) {
        toast(e instanceof Error ? e.message : 'Something went wrong. Please try again.', true);
        return false;
      } finally {
        setBusy(null);
      }
    },
    [toast],
  );
  return { busy, run };
}
