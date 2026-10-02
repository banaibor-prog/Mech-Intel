import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
  addDoc,
  onSnapshot,
  increment,
  QueryDocumentSnapshot,
  DocumentData,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { encodeGeohash } from './locationService';
import { getAppConfig } from './appConfigService';
import {
  Application,
  Booking,
  GeoPoint,
  BookingStatus,
  Post,
  ProfileReview,
  ProviderProfile,
  PublicTrustProfile,
  TrustAction,
  TrustSummary,
  UserProfile,
  WorkReference,
} from '../types/models';
import { MOCK_PROVIDERS } from '../data/mockProviders';

/** Whether the built-in sample jobs and pros should be mixed into lists (admin setting). */
const demoContent = () => getAppConfig().showDemoContent;
import { MOCK_POSTS } from '../data/mockPosts';
import {
  MOCK_CUSTOMERS,
  MOCK_REFERENCES,
  MOCK_REVIEWS,
  MOCK_TRUST_SUMMARIES,
} from '../data/mockTrust';

function findMockUser(uid: string): UserProfile | null {
  return (
    MOCK_PROVIDERS.find((m) => m.user.uid === uid)?.user ??
    MOCK_CUSTOMERS.find((u) => u.uid === uid) ??
    null
  );
}

function findMockProvider(uid: string): ProviderProfile | null {
  return MOCK_PROVIDERS.find((m) => m.provider.uid === uid)?.provider ?? null;
}

function emptyTrustSummary(): TrustSummary {
  return {
    trustScore: 50,
    responseBoost: 'standard',
    reviewAverage: 0,
    reviewCount: 0,
    completedJobs: 0,
    onTimePayments: 0,
    latePayments: 0,
    repeatClients: 0,
    referralCount: 0,
    reportCount: 0,
    blockCount: 0,
    estimatedRevenue: 0,
  };
}

async function listProfileReviews(targetUid: string): Promise<ProfileReview[]> {
  const mockReviews = MOCK_REVIEWS.filter((review) => review.targetUid === targetUid);
  if (mockReviews.length > 0) return mockReviews;

  const snap = await getDocs(
    query(collection(db, 'reviews'), where('targetUid', '==', targetUid), limit(25))
  );
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as ProfileReview))
    .sort((a, b) => b.createdAt - a.createdAt);
}

async function listProfileReferences(targetUid: string): Promise<WorkReference[]> {
  const mockReferences = MOCK_REFERENCES.filter((reference) => reference.targetUid === targetUid);
  if (mockReferences.length > 0) return mockReferences;

  const snap = await getDocs(
    query(collection(db, 'profileReferences'), where('targetUid', '==', targetUid), limit(25))
  );
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as WorkReference))
    .sort((a, b) => b.createdAt - a.createdAt);
}

// Reports/blocks are sensitive (see firestore.rules) and not directly
// queryable by ordinary users anymore — this is admin-only, backing the
// moderation screen rather than trust-score computation.
export function subscribeToRecentTrustActions(
  callback: (actions: TrustAction[]) => void,
  limitCount = 50
) {
  const q = query(collection(db, 'trustActions'), orderBy('createdAt', 'desc'), limit(limitCount));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as TrustAction)));
  });
}

// Trust scores are computed server-side by a Cloud Function
// (functions/src/trust.ts, triggered on writes to reviews/profileReferences/
// trustActions) and stored on trustSummaries/{uid} — the client just reads
// the maintained aggregate instead of scanning the raw collections itself.
// This keeps trustActions safely lockable to reporter/target/admin-only reads.
async function getTrustSummary(uid: string): Promise<TrustSummary> {
  const mockSummary = MOCK_TRUST_SUMMARIES[uid];
  if (mockSummary) return mockSummary;

  try {
    const snap = await getDoc(doc(db, 'trustSummaries', uid));
    return snap.exists() ? (snap.data() as TrustSummary) : emptyTrustSummary();
  } catch {
    return emptyTrustSummary();
  }
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const mock = findMockUser(uid);
  if (mock) return mock;
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? (snap.data() as UserProfile) : null;
}

export async function updateUserProfile(uid: string, data: Partial<UserProfile>) {
  await setDoc(doc(db, 'users', uid), data, { merge: true });
}

export async function getProviderProfile(uid: string): Promise<ProviderProfile | null> {
  const mock = findMockProvider(uid);
  if (mock) return mock;
  const snap = await getDoc(doc(db, 'providers', uid));
  return snap.exists() ? (snap.data() as ProviderProfile) : null;
}

export async function upsertProviderProfile(uid: string, data: Omit<ProviderProfile, 'uid' | 'updatedAt'>) {
  const profile: ProviderProfile = { ...data, uid, updatedAt: Date.now() };
  await setDoc(doc(db, 'providers', uid), profile, { merge: true });
  await setDoc(doc(db, 'users', uid), { isProvider: true }, { merge: true });
}

export async function getPublicTrustProfile(uid: string): Promise<PublicTrustProfile | null> {
  const [user, provider, reviews, references, trust] = await Promise.all([
    getUserProfile(uid),
    getProviderProfile(uid),
    listProfileReviews(uid),
    listProfileReferences(uid),
    getTrustSummary(uid),
  ]);

  if (!user) return null;

  return {
    user,
    provider,
    trust,
    reviews,
    references,
    isMock: !!findMockUser(uid),
  };
}

export async function createProfileReview(data: Omit<ProfileReview, 'id' | 'createdAt'>) {
  const review: Omit<ProfileReview, 'id'> = {
    ...data,
    rating: Math.max(1, Math.min(5, Math.round(data.rating))),
    createdAt: Date.now(),
  };
  const ref = await addDoc(collection(db, 'reviews'), review);
  return ref.id;
}

export async function createProfileReference(data: Omit<WorkReference, 'id' | 'createdAt' | 'verified'>) {
  const reference: Omit<WorkReference, 'id'> = {
    ...data,
    verified: false,
    createdAt: Date.now(),
  };
  const ref = await addDoc(collection(db, 'profileReferences'), reference);
  return ref.id;
}

export async function createTrustAction(data: Omit<TrustAction, 'id' | 'createdAt'>) {
  const action: Omit<TrustAction, 'id'> = { ...data, createdAt: Date.now() };
  const ref = await addDoc(collection(db, 'trustActions'), action);
  return ref.id;
}

export interface ProviderCard extends ProviderProfile {
  displayName: string;
  photoURL?: string;
  trustScore: number;
  reviewAverage: number;
  reviewCount: number;
  completedJobs: number;
  estimatedRevenue: number;
}

const PROVIDER_PAGE_SIZE = 20;

export interface ProviderPage {
  cards: ProviderCard[];
  cursor: QueryDocumentSnapshot<DocumentData> | null;
  hasMore: boolean;
}

/**
 * Paginated provider listing for Discover. Mock cards are only included on the
 * first page (cursor === null) — they act as a fixed seed layer, not something
 * to paginate through — so real data always continues cleanly after them.
 */
export async function listProviderCardsPage(
  skill?: string,
  cursor: QueryDocumentSnapshot<DocumentData> | null = null
): Promise<ProviderPage> {
  let liveCards: ProviderCard[] = [];
  let nextCursor: QueryDocumentSnapshot<DocumentData> | null = null;
  let hasMore = false;

  try {
    const providersRef = collection(db, 'providers');
    const baseConstraints = skill && skill !== 'All'
      ? [where('skills', 'array-contains', skill), where('available', '==', true)]
      : [where('available', '==', true)];
    const q = cursor
      ? query(providersRef, ...baseConstraints, orderBy('updatedAt', 'desc'), startAfter(cursor), limit(PROVIDER_PAGE_SIZE))
      : query(providersRef, ...baseConstraints, orderBy('updatedAt', 'desc'), limit(PROVIDER_PAGE_SIZE));
    const snap = await getDocs(q);
    const providers = snap.docs.map((d) => d.data() as ProviderProfile);
    const [owners, trustSummaries] = await Promise.all([
      Promise.all(providers.map((p) => getUserProfile(p.uid))),
      Promise.all(providers.map((p) => getTrustSummary(p.uid))),
    ]);
    liveCards = providers.flatMap((p, i) => (owners[i]?.suspended ? [] : [{
      ...p,
      displayName: owners[i]?.displayName ?? 'Provider',
      photoURL: owners[i]?.photoURL,
      trustScore: trustSummaries[i].trustScore,
      reviewAverage: trustSummaries[i].reviewAverage,
      reviewCount: trustSummaries[i].reviewCount,
      completedJobs: trustSummaries[i].completedJobs,
      estimatedRevenue: trustSummaries[i].estimatedRevenue,
    }]));
    nextCursor = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null;
    hasMore = snap.docs.length === PROVIDER_PAGE_SIZE;
  } catch {
    // Firestore not reachable/configured yet — fall back to mock data only.
  }

  const mockCards: ProviderCard[] = cursor || !demoContent()
    ? []
    : MOCK_PROVIDERS.filter(
        (m) => !skill || skill === 'All' || m.provider.skills.includes(skill)
      ).map((m) => {
        const trust = MOCK_TRUST_SUMMARIES[m.user.uid] ?? emptyTrustSummary();
        return {
          ...m.provider,
          displayName: m.user.displayName,
          photoURL: m.user.photoURL,
          trustScore: trust.trustScore,
          reviewAverage: trust.reviewAverage,
          reviewCount: trust.reviewCount,
          completedJobs: trust.completedJobs,
          estimatedRevenue: trust.estimatedRevenue,
        };
      });

  return {
    cards: [...liveCards, ...mockCards].sort((a, b) => b.trustScore - a.trustScore),
    cursor: nextCursor,
    hasMore,
  };
}

/** Convenience wrapper for callers that just want the first page (e.g. the home strip). */
export async function listProviderCards(skill?: string): Promise<ProviderCard[]> {
  const page = await listProviderCardsPage(skill);
  return page.cards;
}

export async function createBooking(data: Omit<Booking, 'id' | 'status' | 'createdAt' | 'updatedAt'>) {
  const now = Date.now();
  const booking: Omit<Booking, 'id'> = {
    ...data,
    status: 'pending',
    createdAt: now,
    updatedAt: now,
  };
  const ref = await addDoc(collection(db, 'bookings'), booking);
  return ref.id;
}

export async function updateBookingStatus(bookingId: string, status: BookingStatus) {
  await updateDoc(doc(db, 'bookings', bookingId), { status, updatedAt: Date.now() });
}

export function subscribeToBookingsAsProvider(uid: string, callback: (bookings: Booking[]) => void) {
  const q = query(collection(db, 'bookings'), where('providerUid', '==', uid), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Booking)));
  });
}

export function subscribeToBookingsAsCustomer(uid: string, callback: (bookings: Booking[]) => void) {
  const q = query(collection(db, 'bookings'), where('customerUid', '==', uid), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Booking)));
  });
}

export interface FeedPost extends Post {
  authorName: string;
  authorPhotoURL?: string;
  authorTrustScore: number;
  authorResponseBoost: TrustSummary['responseBoost'];
  isMock?: boolean;
}

export async function createPost(data: Omit<Post, 'id' | 'likeCount' | 'applicantCount' | 'createdAt'>) {
  const now = Date.now();
  const post: Omit<Post, 'id'> = {
    ...data,
    ...(data.coords ? { geohash: encodeGeohash(data.coords) } : {}),
    likeCount: 0,
    applicantCount: 0,
    createdAt: now,
  };
  const ref = await addDoc(collection(db, 'posts'), post);
  return ref.id;
}

const POST_PAGE_SIZE = 10;

export interface FeedPage {
  posts: FeedPost[];
  cursor: QueryDocumentSnapshot<DocumentData> | null;
  hasMore: boolean;
}

/**
 * Paginated feed listing. Like listProviderCardsPage, mock posts only appear
 * on the first page — they're demo seed content, not something to page through.
 */
export async function listFeedPostsPage(
  skill?: string,
  cursor: QueryDocumentSnapshot<DocumentData> | null = null
): Promise<FeedPage> {
  let livePosts: FeedPost[] = [];
  let nextCursor: QueryDocumentSnapshot<DocumentData> | null = null;
  let hasMore = false;

  try {
    const postsRef = collection(db, 'posts');
    const baseConstraints = skill && skill !== 'All' ? [where('skill', '==', skill)] : [];
    const q = cursor
      ? query(postsRef, ...baseConstraints, orderBy('createdAt', 'desc'), startAfter(cursor), limit(POST_PAGE_SIZE))
      : query(postsRef, ...baseConstraints, orderBy('createdAt', 'desc'), limit(POST_PAGE_SIZE));
    const snap = await getDocs(q);
    const posts = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Post)).filter((p) => !p.hidden);
    const [authors, trustSummaries] = await Promise.all([
      Promise.all(posts.map((p) => getUserProfile(p.authorUid))),
      Promise.all(posts.map((p) => getTrustSummary(p.authorUid))),
    ]);
    livePosts = posts.flatMap((p, i) => (authors[i]?.suspended ? [] : [{
      ...p,
      authorName: authors[i]?.displayName ?? 'User',
      authorPhotoURL: authors[i]?.photoURL,
      authorTrustScore: trustSummaries[i].trustScore,
      authorResponseBoost: trustSummaries[i].responseBoost,
    }]));
    nextCursor = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null;
    hasMore = snap.docs.length === POST_PAGE_SIZE;
  } catch {
    // Firestore not reachable/configured yet — fall back to mock data only.
  }

  const mockPosts: FeedPost[] = cursor || !demoContent()
    ? []
    : MOCK_POSTS.filter((p) => !skill || skill === 'All' || p.post.skill === skill).map((p) => ({
        ...p.post,
        authorName: p.authorName,
        authorPhotoURL: p.authorPhotoURL,
        authorTrustScore: (MOCK_TRUST_SUMMARIES[p.post.authorUid] ?? emptyTrustSummary()).trustScore,
        authorResponseBoost: (MOCK_TRUST_SUMMARIES[p.post.authorUid] ?? emptyTrustSummary())
          .responseBoost,
        isMock: true,
      }));

  return {
    posts: [...livePosts, ...mockPosts].sort((a, b) => {
      const trustDelta = b.authorTrustScore - a.authorTrustScore;
      if (Math.abs(trustDelta) >= 10) return trustDelta;
      return b.createdAt - a.createdAt;
    }),
    cursor: nextCursor,
    hasMore,
  };
}

/** Convenience wrapper for callers that just want the first page. */
export async function listFeedPosts(skill?: string): Promise<FeedPost[]> {
  const page = await listFeedPostsPage(skill);
  return page.posts;
}

export async function getPost(postId: string): Promise<FeedPost | null> {
  const mock = MOCK_POSTS.find((p) => p.post.id === postId);
  if (mock) {
    const trust = MOCK_TRUST_SUMMARIES[mock.post.authorUid] ?? emptyTrustSummary();
    return {
      ...mock.post,
      authorName: mock.authorName,
      authorPhotoURL: mock.authorPhotoURL,
      authorTrustScore: trust.trustScore,
      authorResponseBoost: trust.responseBoost,
      isMock: true,
    };
  }

  const snap = await getDoc(doc(db, 'posts', postId));
  if (!snap.exists()) return null;
  const post = { id: snap.id, ...snap.data() } as Post;
  const [author, trust] = await Promise.all([getUserProfile(post.authorUid), getTrustSummary(post.authorUid)]);
  return {
    ...post,
    authorName: author?.displayName ?? 'User',
    authorPhotoURL: author?.photoURL,
    authorTrustScore: trust.trustScore,
    authorResponseBoost: trust.responseBoost,
  };
}

export async function toggleLike(postId: string, uid: string, isMock?: boolean): Promise<boolean> {
  if (isMock) return true;
  const likeRef = doc(db, 'posts', postId, 'likes', uid);
  const existing = await getDoc(likeRef);
  const postRef = doc(db, 'posts', postId);
  if (existing.exists()) {
    await deleteDoc(likeRef);
    await updateDoc(postRef, { likeCount: increment(-1) });
    return false;
  } else {
    await setDoc(likeRef, { uid, createdAt: Date.now() });
    await updateDoc(postRef, { likeCount: increment(1) });
    return true;
  }
}

export async function hasLiked(postId: string, uid: string, isMock?: boolean): Promise<boolean> {
  if (isMock) return false;
  const snap = await getDoc(doc(db, 'posts', postId, 'likes', uid));
  return snap.exists();
}

export async function applyToPost(data: Omit<Application, 'id' | 'status' | 'createdAt'>, isMock?: boolean) {
  if (isMock) return 'mock-application';
  const now = Date.now();
  const application: Omit<Application, 'id'> = {
    ...data,
    status: 'pending',
    createdAt: now,
  };
  const ref = await addDoc(collection(db, 'applications'), application);
  await updateDoc(doc(db, 'posts', data.postId), { applicantCount: increment(1) });
  return ref.id;
}

export function subscribeToApplicationsForPost(postId: string, callback: (applications: Application[]) => void) {
  const q = query(collection(db, 'applications'), where('postId', '==', postId), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Application)));
  });
}

export function subscribeToMyApplications(uid: string, callback: (applications: Application[]) => void) {
  const q = query(collection(db, 'applications'), where('applicantUid', '==', uid), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Application)));
  });
}

/** Applications other people have sent to posts authored by `uid`. */
export function subscribeToApplicationsForMyPosts(
  uid: string,
  callback: (applications: Application[]) => void
) {
  const q = query(
    collection(db, 'applications'),
    where('postAuthorUid', '==', uid),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Application)));
  });
}

export async function updateApplicationStatus(applicationId: string, status: BookingStatus) {
  await updateDoc(doc(db, 'applications', applicationId), { status });
}

export interface MapItem {
  /** Unique across kinds: `job:<postId>` or `pro:<uid>`. */
  id: string;
  kind: 'job' | 'pro';
  /** Post id for jobs, provider uid for pros. */
  refId: string;
  coords: GeoPoint;
  /** Primary category, used for the pin colour. */
  skill: string;
  skills: string[];
  /** Job title, or the provider's name. */
  title: string;
  subtitle?: string;
  personName: string;
  personUid: string;
  photoURL?: string;
  price?: number;
  priceUnit?: 'budget' | 'hour';
  trustScore: number;
  locationLabel?: string;
  createdAt: number;
  isMock?: boolean;
}

const MAP_JOB_MAX_AGE_MS = 45 * 24 * 60 * 60 * 1000;

/**
 * Everything that is currently open for work and has coordinates: recent job posts and
 * available providers. The Explore map only ever shows these, so it stays uncluttered.
 */
export async function listMapItems(): Promise<MapItem[]> {
  const items: MapItem[] = [];
  const cutoff = Date.now() - MAP_JOB_MAX_AGE_MS;

  try {
    const snap = await getDocs(query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(150)));
    const posts = snap.docs
      .map((d) => ({ id: d.id, ...d.data() } as Post))
      .filter((p) => p.coords && p.createdAt >= cutoff && !p.hidden);
    const [authors, trust] = await Promise.all([
      Promise.all(posts.map((p) => getUserProfile(p.authorUid))),
      Promise.all(posts.map((p) => getTrustSummary(p.authorUid))),
    ]);
    posts.forEach((p, i) => {
      if (authors[i]?.suspended) return;
      items.push({
        id: `job:${p.id}`,
        kind: 'job',
        refId: p.id,
        coords: p.coords as GeoPoint,
        skill: p.skill,
        skills: [p.skill],
        title: p.title,
        subtitle: p.description,
        personName: authors[i]?.displayName ?? 'User',
        personUid: p.authorUid,
        photoURL: authors[i]?.photoURL,
        price: p.budget,
        priceUnit: 'budget',
        trustScore: trust[i].trustScore,
        locationLabel: p.location,
        createdAt: p.createdAt,
      });
    });
  } catch {
    // Firestore not reachable/configured yet — mock data below still fills the map.
  }

  try {
    const snap = await getDocs(query(collection(db, 'providers'), where('available', '==', true), limit(150)));
    const providers = snap.docs
      .map((d) => d.data() as ProviderProfile)
      .filter((p) => p.coords && p.availabilityStatus !== 'away');
    const [owners, trust] = await Promise.all([
      Promise.all(providers.map((p) => getUserProfile(p.uid))),
      Promise.all(providers.map((p) => getTrustSummary(p.uid))),
    ]);
    providers.forEach((p, i) => {
      if (owners[i]?.suspended) return;
      items.push(providerToMapItem(p, owners[i], trust[i]));
    });
  } catch {
    // As above.
  }

  if (!demoContent()) return items;

  for (const m of MOCK_POSTS) {
    if (!m.post.coords) continue;
    const trust = MOCK_TRUST_SUMMARIES[m.post.authorUid] ?? emptyTrustSummary();
    items.push({
      id: `job:${m.post.id}`,
      kind: 'job',
      refId: m.post.id,
      coords: m.post.coords,
      skill: m.post.skill,
      skills: [m.post.skill],
      title: m.post.title,
      subtitle: m.post.description,
      personName: m.authorName,
      personUid: m.post.authorUid,
      photoURL: m.authorPhotoURL,
      price: m.post.budget,
      priceUnit: 'budget',
      trustScore: trust.trustScore,
      locationLabel: m.post.location,
      createdAt: m.post.createdAt,
      isMock: true,
    });
  }
  for (const m of MOCK_PROVIDERS) {
    if (!m.provider.coords || !m.provider.available) continue;
    items.push({ ...providerToMapItem(m.provider, m.user, MOCK_TRUST_SUMMARIES[m.user.uid] ?? emptyTrustSummary()), isMock: true });
  }

  return items;
}

function providerToMapItem(p: ProviderProfile, owner: UserProfile | null, trust: TrustSummary): MapItem {
  return {
    id: `pro:${p.uid}`,
    kind: 'pro',
    refId: p.uid,
    coords: p.coords as GeoPoint,
    skill: p.skills[0] ?? 'Other',
    skills: p.skills,
    title: owner?.displayName ?? 'Provider',
    subtitle: p.headline ?? p.bio,
    personName: owner?.displayName ?? 'Provider',
    personUid: p.uid,
    photoURL: owner?.photoURL,
    price: p.hourlyRate,
    priceUnit: 'hour',
    trustScore: trust.trustScore,
    locationLabel: p.location,
    createdAt: p.updatedAt,
  };
}
