import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import { getFirestore } from 'firebase-admin/firestore';

// Mirrors the shape of src/types/models.ts's TrustSummary in the app. Kept as
// a plain duplicate rather than a shared package — small, pure, and the two
// runtimes (React Native / Cloud Functions) don't otherwise share code today.
interface TrustSummary {
  trustScore: number;
  responseBoost: 'fast' | 'standard' | 'limited';
  reviewAverage: number;
  reviewCount: number;
  completedJobs: number;
  onTimePayments: number;
  latePayments: number;
  repeatClients: number;
  referralCount: number;
  reportCount: number;
  blockCount: number;
  estimatedRevenue: number;
  lastReviewedAt?: number;
}

interface ProfileReview {
  reviewerUid: string;
  rating: number;
  amount?: number;
  paymentOnTime?: boolean;
  createdAt: number;
}

interface WorkReference {
  createdAt: number;
}

interface TrustAction {
  type: 'report' | 'block';
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

// Exact port of computeTrustSummary from src/services/dataService.ts — keep
// these two in sync if the formula ever changes.
function computeTrustSummary(
  reviews: ProfileReview[],
  references: WorkReference[],
  trustActions: TrustAction[]
): TrustSummary {
  if (reviews.length === 0 && references.length === 0 && trustActions.length === 0) {
    return emptyTrustSummary();
  }

  const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
  const reviewAverage = reviews.length ? totalRating / reviews.length : 0;
  const completedJobs = reviews.length;
  const onTimePayments = reviews.filter((review) => review.paymentOnTime === true).length;
  const latePayments = reviews.filter((review) => review.paymentOnTime === false).length;
  const repeatClients = new Set(reviews.map((review) => review.reviewerUid)).size;
  const reportCount = trustActions.filter((action) => action.type === 'report').length;
  const blockCount = trustActions.filter((action) => action.type === 'block').length;
  const estimatedRevenue = reviews.reduce((sum, review) => sum + (review.amount ?? 0), 0);
  const lastReviewedAt = reviews.reduce<number | undefined>(
    (latest, review) => (latest ? Math.max(latest, review.createdAt) : review.createdAt),
    undefined
  );

  const ratingScore = reviews.length ? reviewAverage * 14 : 0;
  const volumeScore = Math.min(completedJobs * 2, 16);
  const paymentScore = onTimePayments * 2 - latePayments * 6;
  const referralScore = Math.min(references.length * 3, 12);
  const safetyPenalty = reportCount * 12 + blockCount * 8;
  const trustScore = Math.max(
    0,
    Math.min(100, Math.round(35 + ratingScore + volumeScore + paymentScore + referralScore - safetyPenalty))
  );

  return {
    trustScore,
    responseBoost: trustScore >= 85 ? 'fast' : trustScore < 45 ? 'limited' : 'standard',
    reviewAverage: Number(reviewAverage.toFixed(1)),
    reviewCount: reviews.length,
    completedJobs,
    onTimePayments,
    latePayments,
    repeatClients,
    referralCount: references.length,
    reportCount,
    blockCount,
    estimatedRevenue,
    ...(lastReviewedAt !== undefined ? { lastReviewedAt } : {}),
  };
}

async function recomputeTrustSummary(targetUid: string): Promise<void> {
  const db = getFirestore();

  const [reviewsSnap, referencesSnap, actionsSnap] = await Promise.all([
    db.collection('reviews').where('targetUid', '==', targetUid).get(),
    db.collection('profileReferences').where('targetUid', '==', targetUid).get(),
    db.collection('trustActions').where('targetUid', '==', targetUid).get(),
  ]);

  const reviews = reviewsSnap.docs.map((d) => d.data() as ProfileReview);
  const references = referencesSnap.docs.map((d) => d.data() as WorkReference);
  const trustActions = actionsSnap.docs.map((d) => d.data() as TrustAction);

  const summary = computeTrustSummary(reviews, references, trustActions);
  await db.collection('trustSummaries').doc(targetUid).set(summary);
}

// Firestore triggers only fire on writes to the collection they're bound to,
// so the same targetUid can be recomputed by any of these three depending on
// which collection changed. `event.data` is undefined on a delete; reviews
// and references can't be deleted per firestore.rules today, but trustActions
// share the same trigger shape so the null-check is defensive, not dead code.
export const onReviewWritten = onDocumentWritten('reviews/{reviewId}', async (event) => {
  const data = event.data?.after.exists ? event.data.after.data() : event.data?.before.data();
  const targetUid = data?.targetUid as string | undefined;
  if (targetUid) await recomputeTrustSummary(targetUid);
});

export const onReferenceWritten = onDocumentWritten('profileReferences/{referenceId}', async (event) => {
  const data = event.data?.after.exists ? event.data.after.data() : event.data?.before.data();
  const targetUid = data?.targetUid as string | undefined;
  if (targetUid) await recomputeTrustSummary(targetUid);
});

export const onTrustActionWritten = onDocumentWritten('trustActions/{actionId}', async (event) => {
  const data = event.data?.after.exists ? event.data.after.data() : event.data?.before.data();
  const targetUid = data?.targetUid as string | undefined;
  if (targetUid) await recomputeTrustSummary(targetUid);
});
