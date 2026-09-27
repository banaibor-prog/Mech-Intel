import { Unsubscribe } from 'firebase/firestore';
import {
  getUserProfile,
  subscribeToApplicationsForMyPosts,
  subscribeToBookingsAsCustomer,
  subscribeToBookingsAsProvider,
  subscribeToMyApplications,
} from './dataService';
import { Application, Booking, Connection, ConnectionKind } from '../types/models';

interface RawLink {
  uid: string;
  kind: ConnectionKind;
  at: number;
  context?: string;
}

/**
 * Builds the user's network from existing booking/application records — there
 * is no follow graph. Firestore rules scope both collections to their
 * participants, so each side must be queried separately and merged here rather
 * than with one collection-group query.
 */
export function subscribeToNetwork(
  uid: string,
  callback: (connections: Connection[]) => void
): Unsubscribe {
  let asProvider: Booking[] = [];
  let asCustomer: Booking[] = [];
  let myApplications: Application[] = [];
  let applicationsToMe: Application[] = [];

  // Names are fetched per uid and cached for the lifetime of the subscription;
  // without this every snapshot would refetch the same profiles.
  const profileCache = new Map<string, { displayName: string; photoURL?: string }>();
  let cancelled = false;

  const recompute = async () => {
    const links: RawLink[] = [
      ...asProvider.map((b) => ({
        uid: b.customerUid,
        kind: 'workedForThem' as const,
        at: b.createdAt,
        context: b.skill,
      })),
      ...asCustomer.map((b) => ({
        uid: b.providerUid,
        kind: 'hiredThem' as const,
        at: b.createdAt,
        context: b.skill,
      })),
      ...myApplications.map((a) => ({
        uid: a.postAuthorUid,
        kind: 'applied' as const,
        at: a.createdAt,
      })),
      ...applicationsToMe.map((a) => ({
        uid: a.applicantUid,
        kind: 'appliedToMine' as const,
        at: a.createdAt,
      })),
    ].filter((link) => link.uid && link.uid !== uid);

    const byUid = new Map<string, Connection>();
    for (const link of links) {
      const existing = byUid.get(link.uid);
      if (existing) {
        if (!existing.kinds.includes(link.kind)) existing.kinds.push(link.kind);
        if (link.at > existing.lastInteractionAt) {
          existing.lastInteractionAt = link.at;
          if (link.context) existing.context = link.context;
        }
      } else {
        byUid.set(link.uid, {
          uid: link.uid,
          displayName: '',
          kinds: [link.kind],
          lastInteractionAt: link.at,
          ...(link.context ? { context: link.context } : {}),
        });
      }
    }

    const unknown = [...byUid.keys()].filter((id) => !profileCache.has(id));
    if (unknown.length) {
      const fetched = await Promise.all(
        unknown.map(async (id) => {
          try {
            const p = await getUserProfile(id);
            return [id, p] as const;
          } catch {
            return [id, null] as const;
          }
        })
      );
      for (const [id, p] of fetched) {
        profileCache.set(id, {
          displayName: p?.displayName ?? 'Unknown user',
          ...(p?.photoURL ? { photoURL: p.photoURL } : {}),
        });
      }
    }

    if (cancelled) return;

    const connections = [...byUid.values()]
      .map((c) => {
        const cached = profileCache.get(c.uid);
        return {
          ...c,
          displayName: cached?.displayName ?? 'Unknown user',
          ...(cached?.photoURL ? { photoURL: cached.photoURL } : {}),
        };
      })
      .sort((a, b) => b.lastInteractionAt - a.lastInteractionAt);

    callback(connections);
  };

  const unsubscribers: Unsubscribe[] = [
    subscribeToBookingsAsProvider(uid, (b) => {
      asProvider = b;
      void recompute();
    }),
    subscribeToBookingsAsCustomer(uid, (b) => {
      asCustomer = b;
      void recompute();
    }),
    subscribeToMyApplications(uid, (a) => {
      myApplications = a;
      void recompute();
    }),
    subscribeToApplicationsForMyPosts(uid, (a) => {
      applicationsToMe = a;
      void recompute();
    }),
  ];

  return () => {
    cancelled = true;
    unsubscribers.forEach((fn) => fn());
  };
}

export const CONNECTION_LABELS: Record<ConnectionKind, string> = {
  hiredThem: 'You hired them',
  workedForThem: 'You worked for them',
  applied: 'You applied to their job',
  appliedToMine: 'Applied to your job',
};
