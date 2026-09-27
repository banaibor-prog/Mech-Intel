/**
 * Which side of the marketplace the user is currently browsing as. This is a
 * view preference only — it does not affect whether others can see or book
 * them (that is `ProviderProfile.available`).
 */
export type AppMode = 'hiring' | 'working';

export interface GeoPoint {
  lat: number;
  lng: number;
}

/** How the current user came to know a person in their network. */
export type ConnectionKind = 'hiredThem' | 'workedForThem' | 'applied' | 'appliedToMine';

export interface Connection {
  uid: string;
  displayName: string;
  photoURL?: string;
  kinds: ConnectionKind[];
  lastInteractionAt: number;
  /** Skill from the most recent booking/application that links the two users. */
  context?: string;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  phone?: string;
  location?: string;
  /** Last approximate position recorded while using the app. */
  lastCoords?: GeoPoint;
  isProvider: boolean;
  createdAt: number;
  /** Grants access to the moderation queue. Set manually in Firestore — there is no in-app way to grant this. */
  isAdmin?: boolean;
}

export type ReviewRelationship = 'hiredProvider' | 'workedForCustomer';

export interface ProfileReview {
  id: string;
  targetUid: string;
  reviewerUid: string;
  reviewerName: string;
  reviewerPhotoURL?: string;
  relationship: ReviewRelationship;
  rating: number;
  comment: string;
  projectTitle?: string;
  amount?: number;
  paymentOnTime?: boolean;
  wouldWorkAgain: boolean;
  createdAt: number;
}

export interface WorkReference {
  id: string;
  targetUid: string;
  fromUid: string;
  fromName: string;
  fromPhotoURL?: string;
  relationship: string;
  note: string;
  skill?: string;
  verified: boolean;
  createdAt: number;
}

export type TrustActionType = 'report' | 'block';

export interface TrustAction {
  id: string;
  targetUid: string;
  reporterUid: string;
  type: TrustActionType;
  reason: string;
  note?: string;
  createdAt: number;
}

export interface TrustSummary {
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

export interface PublicTrustProfile {
  user: UserProfile;
  provider?: ProviderProfile | null;
  trust: TrustSummary;
  reviews: ProfileReview[];
  references: WorkReference[];
  isMock?: boolean;
}

export type AvailabilityStatus = 'availableNow' | 'availableToday' | 'availableThisWeek' | 'away';
export type PricingModel = 'fixed' | 'startingAt' | 'hourly' | 'daily' | 'quote' | 'negotiable';
export type VerificationType = 'identity' | 'phone' | 'email' | 'address' | 'credential' | 'background';

export interface ProfileService {
  id: string;
  title: string;
  description: string;
  pricingModel: PricingModel;
  price?: number;
  duration?: string;
  onSite?: boolean;
  rating?: number;
  reviewCount?: number;
}

export interface PortfolioProject {
  id: string;
  title: string;
  description: string;
  skills: string[];
  completedAt?: number;
  mediaUrls?: string[];
  reviewId?: string;
}

export interface ProfileExperience {
  id: string;
  title: string;
  organisation?: string;
  location?: string;
  startYear: number;
  endYear?: number;
  description?: string;
}

export interface ProfileCredential {
  id: string;
  title: string;
  issuer: string;
  issuedYear: number;
  verified?: boolean;
}

export interface ProfilePrivacy {
  showAvailability?: boolean;
  showPricing?: boolean;
  showPortfolio?: boolean;
  showWorkHistory?: boolean;
}

export interface ProviderProfile {
  uid: string;
  skills: string[];
  bio: string;
  hourlyRate?: number;
  location?: string;
  yearsExperience?: number;
  available: boolean;
  headline?: string;
  availabilityStatus?: AvailabilityStatus;
  nextAvailableLabel?: string;
  serviceRadiusKm?: number;
  languages?: string[];
  workTypes?: Array<'onSite' | 'remote' | 'hybrid'>;
  jobTypes?: Array<'oneTime' | 'hourly' | 'daily' | 'contract' | 'recurring'>;
  services?: ProfileService[];
  /** Approximate (~100 m) position, refreshed while the provider uses the app. */
  coords?: GeoPoint;
  geohash?: string;
  coordsUpdatedAt?: number;
  portfolio?: PortfolioProject[];
  experience?: ProfileExperience[];
  credentials?: ProfileCredential[];
  verifications?: VerificationType[];
  badges?: string[];
  minimumCallout?: number;
  dailyRate?: number;
  privacy?: ProfilePrivacy;
  updatedAt: number;
}

export type BookingStatus = 'pending' | 'accepted' | 'declined' | 'cancelled' | 'completed';

export interface Booking {
  id: string;
  providerUid: string;
  customerUid: string;
  skill: string;
  message: string;
  preferredDate?: string;
  status: BookingStatus;
  createdAt: number;
  updatedAt: number;
}

export interface Post {
  id: string;
  authorUid: string;
  title: string;
  description: string;
  skill: string;
  budget?: number;
  location?: string;
  /** Approximate (~100 m) position recorded when the post was created. */
  coords?: GeoPoint;
  geohash?: string;
  photoURLs?: string[];
  likeCount: number;
  applicantCount: number;
  createdAt: number;
}

export interface Application {
  id: string;
  postId: string;
  applicantUid: string;
  postAuthorUid: string;
  message: string;
  status: BookingStatus;
  createdAt: number;
}

export const SKILL_CATEGORIES = [
  'Electrician',
  'Plumber',
  'House Cleaner',
  'Helper',
  'Carpenter',
  'Painter',
  'Mechanic',
  'Gardener',
  'Cook',
  'Artist',
  'Musician',
  'Photographer',
  'Tutor',
  'Freelance Writer',
  'Freelance Designer',
  'Freelance Developer',
  'Other',
] as const;
