import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getCountFromServer,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  where,
  QueryConstraint,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import {
  AdminActionType,
  AdminLog,
  Application,
  Booking,
  Post,
  ProfileReview,
  ProviderProfile,
  TrustAction,
  TrustActionStatus,
  TrustSummary,
  UserProfile,
} from '../types/models';

// Everything here touches live Firestore data only (never the built-in demo content)
// and is permitted by firestore.rules only when the caller's users doc has isAdmin.

const LIST_LIMIT = 300;
const DAY = 24 * 60 * 60 * 1000;

export interface AdminActor {
  uid: string;
  name: string;
}

async function count(path: string, ...constraints: QueryConstraint[]): Promise<number> {
  try {
    const snap = await getCountFromServer(query(collection(db, path), ...constraints));
    return snap.data().count;
  } catch {
    return 0;
  }
}

async function list<T>(path: string, ...constraints: QueryConstraint[]): Promise<T[]> {
  const snap = await getDocs(query(collection(db, path), ...constraints));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as T);
}

/** Records an admin action in the append-only adminLogs collection. */
async function log(
  actor: AdminActor,
  action: AdminActionType,
  targetType: AdminLog['targetType'],
  targetId: string,
  summary: string,
  note?: string,
) {
  const entry: Omit<AdminLog, 'id'> = {
    actorUid: actor.uid,
    actorName: actor.name,
    action,
    targetType,
    targetId,
    summary,
    ...(note ? { note } : {}),
    createdAt: Date.now(),
  };
  await addDoc(collection(db, 'adminLogs'), entry);
}

// ---------------------------------------------------------------- dashboard

export interface DashboardStats {
  users: number;
  newUsers7d: number;
  providers: number;
  availableProviders: number;
  suspendedUsers: number;
  posts: number;
  newPosts7d: number;
  hiddenPosts: number;
  bookings: number;
  pendingBookings: number;
  acceptedBookings: number;
  completedBookings: number;
  applications: number;
  openReports: number;
  reviews: number;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const weekAgo = Date.now() - 7 * DAY;
  const [
    users,
    newUsers7d,
    providers,
    availableProviders,
    suspendedUsers,
    posts,
    newPosts7d,
    hiddenPosts,
    bookings,
    pendingBookings,
    acceptedBookings,
    completedBookings,
    applications,
    reviews,
    reports,
  ] = await Promise.all([
    count('users'),
    count('users', where('createdAt', '>=', weekAgo)),
    count('providers'),
    count('providers', where('available', '==', true)),
    count('users', where('suspended', '==', true)),
    count('posts'),
    count('posts', where('createdAt', '>=', weekAgo)),
    count('posts', where('hidden', '==', true)),
    count('bookings'),
    count('bookings', where('status', '==', 'pending')),
    count('bookings', where('status', '==', 'accepted')),
    count('bookings', where('status', '==', 'completed')),
    count('applications'),
    count('reviews'),
    // Open reports have no status field, so count them from the recent queue instead.
    list<TrustAction>('trustActions', orderBy('createdAt', 'desc'), limit(LIST_LIMIT)).catch(() => []),
  ]);
  return {
    users,
    newUsers7d,
    providers,
    availableProviders,
    suspendedUsers,
    posts,
    newPosts7d,
    hiddenPosts,
    bookings,
    pendingBookings,
    acceptedBookings,
    completedBookings,
    applications,
    openReports: reports.filter((r) => !r.status || r.status === 'open').length,
    reviews,
  };
}

// ---------------------------------------------------------------- users

export async function listUsers(): Promise<UserProfile[]> {
  const snap = await getDocs(query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(LIST_LIMIT)));
  return snap.docs.map((d) => ({ ...(d.data() as UserProfile), uid: d.id }));
}

export interface AdminUserDetail {
  user: UserProfile;
  provider: ProviderProfile | null;
  trust: TrustSummary | null;
  posts: Post[];
  bookings: Booking[];
  reportsAgainst: TrustAction[];
  reportsFiled: TrustAction[];
}

export async function getAdminUserDetail(uid: string): Promise<AdminUserDetail | null> {
  const userSnap = await getDoc(doc(db, 'users', uid));
  if (!userSnap.exists()) return null;
  const [providerSnap, trustSnap, posts, asProvider, asCustomer, reportsAgainst, reportsFiled] = await Promise.all([
    getDoc(doc(db, 'providers', uid)),
    getDoc(doc(db, 'trustSummaries', uid)).catch(() => null),
    list<Post>('posts', where('authorUid', '==', uid), limit(50)).catch(() => []),
    list<Booking>('bookings', where('providerUid', '==', uid), limit(50)).catch(() => []),
    list<Booking>('bookings', where('customerUid', '==', uid), limit(50)).catch(() => []),
    list<TrustAction>('trustActions', where('targetUid', '==', uid), limit(50)).catch(() => []),
    list<TrustAction>('trustActions', where('reporterUid', '==', uid), limit(50)).catch(() => []),
  ]);
  const byNewest = <T extends { createdAt: number }>(items: T[]) => [...items].sort((a, b) => b.createdAt - a.createdAt);
  return {
    user: { ...(userSnap.data() as UserProfile), uid },
    provider: providerSnap.exists() ? (providerSnap.data() as ProviderProfile) : null,
    trust: trustSnap?.exists() ? (trustSnap.data() as TrustSummary) : null,
    posts: byNewest(posts),
    bookings: byNewest([...asProvider, ...asCustomer]),
    reportsAgainst: byNewest(reportsAgainst),
    reportsFiled: byNewest(reportsFiled),
  };
}

export async function setUserSuspended(actor: AdminActor, user: UserProfile, suspended: boolean, reason?: string) {
  await updateDoc(doc(db, 'users', user.uid), suspended
    ? { suspended: true, suspendedReason: reason || 'Violation of community guidelines', suspendedAt: Date.now(), suspendedBy: actor.uid }
    : { suspended: false, suspendedReason: '', suspendedAt: 0, suspendedBy: '' });
  await log(
    actor,
    suspended ? 'user.suspend' : 'user.unsuspend',
    'user',
    user.uid,
    `${suspended ? 'Suspended' : 'Restored'} ${user.displayName}`,
    reason,
  );
}

export async function setUserAdmin(actor: AdminActor, user: UserProfile, isAdmin: boolean) {
  await updateDoc(doc(db, 'users', user.uid), { isAdmin });
  await log(actor, isAdmin ? 'user.grantAdmin' : 'user.revokeAdmin', 'user', user.uid, `${isAdmin ? 'Made' : 'Removed'} ${user.displayName} ${isAdmin ? 'an admin' : 'as admin'}`);
}

export async function setProviderVerified(actor: AdminActor, provider: ProviderProfile, name: string, verified: boolean) {
  const current = provider.verifications ?? [];
  const verifications = verified
    ? Array.from(new Set([...current, 'identity' as const]))
    : current.filter((v) => v !== 'identity');
  await updateDoc(doc(db, 'providers', provider.uid), { verifications });
  await log(actor, verified ? 'provider.verify' : 'provider.unverify', 'provider', provider.uid, `${verified ? 'Verified' : 'Removed verification from'} ${name}`);
}

// ---------------------------------------------------------------- jobs

export async function listPosts(): Promise<Post[]> {
  return list<Post>('posts', orderBy('createdAt', 'desc'), limit(LIST_LIMIT));
}

export async function setPostHidden(actor: AdminActor, post: Post, hidden: boolean, reason?: string) {
  await updateDoc(doc(db, 'posts', post.id), hidden
    ? { hidden: true, hiddenReason: reason || 'Removed by moderator', hiddenAt: Date.now(), hiddenBy: actor.uid }
    : { hidden: false, hiddenReason: '', hiddenAt: 0, hiddenBy: '' });
  await log(actor, hidden ? 'post.hide' : 'post.unhide', 'post', post.id, `${hidden ? 'Hid' : 'Restored'} job "${post.title}"`, reason);
}

export async function deletePostAsAdmin(actor: AdminActor, post: Post, reason?: string) {
  await deleteDoc(doc(db, 'posts', post.id));
  await log(actor, 'post.delete', 'post', post.id, `Deleted job "${post.title}"`, reason);
}

// ---------------------------------------------------------------- bookings

export async function listBookings(): Promise<Booking[]> {
  return list<Booking>('bookings', orderBy('createdAt', 'desc'), limit(LIST_LIMIT));
}

export async function listApplications(): Promise<Application[]> {
  return list<Application>('applications', orderBy('createdAt', 'desc'), limit(LIST_LIMIT));
}

export async function cancelBookingAsAdmin(actor: AdminActor, booking: Booking, reason?: string) {
  await updateDoc(doc(db, 'bookings', booking.id), { status: 'cancelled', updatedAt: Date.now() });
  await log(actor, 'booking.cancel', 'booking', booking.id, `Cancelled ${booking.skill} booking`, reason);
}

// ---------------------------------------------------------------- reports

export function subscribeToReports(callback: (reports: TrustAction[]) => void) {
  const q = query(collection(db, 'trustActions'), orderBy('createdAt', 'desc'), limit(LIST_LIMIT));
  return onSnapshot(
    q,
    (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as TrustAction)),
    () => callback([]),
  );
}

export async function setReportStatus(actor: AdminActor, report: TrustAction, status: Exclude<TrustActionStatus, 'open'>, resolution?: string) {
  await updateDoc(doc(db, 'trustActions', report.id), {
    status,
    resolution: resolution || (status === 'resolved' ? 'Action taken' : 'No action needed'),
    resolvedBy: actor.uid,
    resolvedAt: Date.now(),
  });
  await log(actor, status === 'resolved' ? 'report.resolve' : 'report.dismiss', 'report', report.id, `${status === 'resolved' ? 'Resolved' : 'Dismissed'} ${report.type}: ${report.reason}`, resolution);
}

// ---------------------------------------------------------------- reviews

export async function listReviews(): Promise<ProfileReview[]> {
  return list<ProfileReview>('reviews', orderBy('createdAt', 'desc'), limit(LIST_LIMIT));
}

export async function deleteReviewAsAdmin(actor: AdminActor, review: ProfileReview, reason?: string) {
  await deleteDoc(doc(db, 'reviews', review.id));
  await log(actor, 'review.delete', 'review', review.id, `Deleted ${review.rating}★ review by ${review.reviewerName}`, reason);
}

// ---------------------------------------------------------------- settings & activity

export async function logConfigChange(actor: AdminActor, summary: string) {
  await log(actor, 'config.update', 'config', 'app', summary);
}

export async function listAdminLogs(): Promise<AdminLog[]> {
  return list<AdminLog>('adminLogs', orderBy('createdAt', 'desc'), limit(LIST_LIMIT));
}

/** Look up display names for a set of uids (cached by the caller). */
export async function getNames(uids: string[]): Promise<Record<string, string>> {
  const unique = Array.from(new Set(uids.filter(Boolean)));
  const entries = await Promise.all(
    unique.map(async (uid) => {
      try {
        const snap = await getDoc(doc(db, 'users', uid));
        return [uid, snap.exists() ? (snap.data() as UserProfile).displayName : 'Unknown user'] as const;
      } catch {
        return [uid, 'Unknown user'] as const;
      }
    }),
  );
  return Object.fromEntries(entries);
}
