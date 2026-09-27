import React from 'react';
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Avatar from './Avatar';
import { Colors } from '../constants/Colors';
import { Fonts } from '../constants/Typography';
import { Spacing } from '../constants/Spacing';
import {
  AvailabilityStatus,
  PortfolioProject,
  PricingModel,
  ProfileReview,
  ProviderProfile,
  TrustSummary,
  UserProfile,
} from '../types/models';

interface HeaderProps {
  user: UserProfile;
  provider?: ProviderProfile | null;
  trust: TrustSummary;
  isOwner?: boolean;
  onEditPhoto?: () => void;
  onEditProfile?: () => void;
}

interface SectionProps {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  children: React.ReactNode;
}

interface ContentProps {
  user: UserProfile;
  provider?: ProviderProfile | null;
  trust: TrustSummary;
  reviews: ProfileReview[];
  isOwner?: boolean;
  onEdit?: (section: 'skills' | 'services' | 'portfolio' | 'availability' | 'details') => void;
  onBook?: (serviceTitle?: string) => void;
  showReviews?: boolean;
}

const availability: Record<AvailabilityStatus, { label: string; color: string }> = {
  availableNow: { label: 'Available now', color: Colors.success },
  availableToday: { label: 'Available today', color: Colors.success },
  availableThisWeek: { label: 'Available this week', color: Colors.warning },
  away: { label: 'Currently unavailable', color: Colors.textMuted },
};

const portfolioColors = ['#E8F1FF', '#EEF6ED', '#FFF1E2', '#F5EDFF'];

export function ProfileIdentityHeader({
  user,
  provider,
  trust,
  isOwner,
  onEditPhoto,
  onEditProfile,
}: HeaderProps) {
  const state = availability[provider?.availabilityStatus ?? (provider?.available ? 'availableToday' : 'away')];
  const headline = provider?.headline || provider?.skills.slice(0, 3).join('  |  ') || 'Marketplace member';
  const verificationCount = provider?.verifications?.length ?? 0;

  return (
    <View style={styles.identityCard}>
      <View style={styles.identityTop}>
        <TouchableOpacity
          accessibilityRole={onEditPhoto ? 'button' : undefined}
          accessibilityLabel={onEditPhoto ? 'Edit profile photo' : 'Profile photo'}
          disabled={!onEditPhoto}
          onPress={onEditPhoto}
          activeOpacity={0.8}
        >
          <Avatar name={user.displayName} photoURL={user.photoURL} size={82} />
          {onEditPhoto ? <View style={styles.photoEdit}><Text style={styles.photoEditText}>Edit</Text></View> : null}
        </TouchableOpacity>
        <View style={styles.identityCopy}>
          <View style={styles.nameLine}>
            <Text style={styles.name} numberOfLines={1}>{user.displayName}</Text>
            {verificationCount > 0 ? <Text style={styles.verifiedMark}>Verified</Text> : null}
          </View>
          <Text style={styles.headline} numberOfLines={2}>{headline}</Text>
          <Text style={styles.location} numberOfLines={1}>
            {provider?.location || user.location || 'Location not added'}
            {provider?.serviceRadiusKm ? `  |  ${provider.serviceRadiusKm} km` : ''}
          </Text>
        </View>
      </View>

      <View style={styles.identityMeta}>
        <View style={[styles.availabilityPill, { backgroundColor: `${state.color}18` }]}>
          <View style={[styles.availabilityDot, { backgroundColor: state.color }]} />
          <Text style={[styles.availabilityText, { color: state.color }]}>{state.label}</Text>
        </View>
        {provider?.nextAvailableLabel ? <Text style={styles.nextAvailable}>{provider.nextAvailableLabel}</Text> : null}
        {isOwner && onEditProfile ? (
          <TouchableOpacity accessibilityRole="button" onPress={onEditProfile} style={styles.textAction}>
            <Text style={styles.textActionLabel}>Edit profile</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.statRow}>
        <CompactStat value={trust.reviewCount ? trust.reviewAverage.toFixed(1) : 'New'} label="rating" prefix="* " />
        <CompactStat value={String(trust.reviewCount)} label="reviews" />
        <CompactStat value={String(trust.completedJobs)} label="jobs done" />
        <CompactStat value={trust.completedJobs ? `${Math.max(0, Math.min(100, Math.round((trust.completedJobs / Math.max(1, trust.completedJobs + trust.latePayments)) * 100)))}%` : '--'} label="completion" />
      </View>
    </View>
  );
}

export function ProfileStrengthCard({ provider, photoURL, onEdit }: { provider?: ProviderProfile | null; photoURL?: string; onEdit: () => void }) {
  const checks = [
    !!photoURL,
    !!provider?.headline,
    (provider?.skills.length ?? 0) >= 3,
    (provider?.services?.length ?? 0) > 0,
    (provider?.portfolio?.length ?? 0) > 0,
    (provider?.verifications?.length ?? 0) > 0,
  ];
  const complete = Math.round((checks.filter(Boolean).length / checks.length) * 100);
  return (
    <View style={styles.strengthCard}>
      <View style={styles.strengthTop}>
        <View>
          <Text style={styles.eyebrow}>PROFILE STRENGTH</Text>
          <Text style={styles.strengthTitle}>{complete}% complete</Text>
        </View>
        <TouchableOpacity accessibilityRole="button" onPress={onEdit} style={styles.improveButton}>
          <Text style={styles.improveText}>Improve</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${complete}%` }]} /></View>
      <Text style={styles.strengthHint}>
        {complete < 100 ? 'Add services, portfolio work, and verification to improve trust.' : 'Your public profile is ready to get discovered.'}
      </Text>
    </View>
  );
}

export function MarketplaceProfileContent({ user, provider, trust, reviews, isOwner, onEdit, onBook, showReviews = true }: ContentProps) {
  const isProvider = !!provider;
  return (
    <>
      <ProfileSection title="About" actionLabel={isOwner ? 'Edit' : undefined} onAction={isOwner ? () => onEdit?.('details') : undefined}>
        <Text style={styles.bodyText}>
          {provider?.bio || (isOwner
            ? 'Add a short introduction so customers understand what you do and why they should choose you.'
            : 'This member has not added an introduction yet.')}
        </Text>
        {provider?.languages?.length ? <Text style={styles.supportingText}>Languages: {provider.languages.join(', ')}</Text> : null}
        {provider?.yearsExperience ? <Text style={styles.supportingText}>{provider.yearsExperience}+ years of experience</Text> : null}
      </ProfileSection>

      <ProfileSection title="Top skills" actionLabel={isOwner ? 'Manage' : undefined} onAction={isOwner ? () => onEdit?.('skills') : undefined}>
        {provider?.skills.length ? (
          <View style={styles.chipWrap}>
            {provider.skills.slice(0, 6).map((skill, index) => (
              <View key={skill} style={[styles.skillChip, index < 3 && styles.topSkillChip]}>
                <Text style={[styles.skillText, index < 3 && styles.topSkillText]}>{skill}</Text>
              </View>
            ))}
          </View>
        ) : (
          <EmptyHint text={isOwner ? 'Add skills to appear in discovery and start receiving relevant work.' : 'Skills have not been added yet.'} />
        )}
      </ProfileSection>

      <ProfileSection title="Services" actionLabel={isOwner ? 'Add service' : undefined} onAction={isOwner ? () => onEdit?.('services') : undefined}>
        {provider?.services?.length ? (
          <View style={styles.serviceList}>
            {provider.services.map((service) => (
              <View key={service.id} style={styles.serviceCard}>
                <View style={styles.serviceTop}>
                  <View style={styles.serviceCopy}>
                    <Text style={styles.serviceTitle}>{service.title}</Text>
                    <Text style={styles.serviceDescription} numberOfLines={2}>{service.description}</Text>
                  </View>
                  <Text style={styles.servicePrice}>{formatPricing(service.pricingModel, service.price)}</Text>
                </View>
                <View style={styles.serviceFooter}>
                  <Text style={styles.serviceMeta}>{service.duration || (service.onSite ? 'On-site service' : 'Flexible delivery')}</Text>
                  {!isOwner && onBook ? (
                    <TouchableOpacity accessibilityRole="button" onPress={() => onBook(service.title)} style={styles.bookTextButton}>
                      <Text style={styles.bookText}>Book</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>
            ))}
          </View>
        ) : (
          <EmptyHint text={isOwner ? 'Create a bookable service with a clear price or quote option.' : 'No services have been added yet.'} />
        )}
      </ProfileSection>

      <ProfileSection title="Portfolio" actionLabel={isOwner ? 'Add work' : provider?.portfolio?.length ? 'View all' : undefined} onAction={isOwner ? () => onEdit?.('portfolio') : undefined}>
        {provider?.portfolio?.length ? <PortfolioGrid items={provider.portfolio} /> : <EmptyHint text={isOwner ? 'Show completed work to make your profile easier to trust.' : 'No portfolio work has been shared yet.'} />}
      </ProfileSection>

      <ProfileSection title="Experience & credentials" actionLabel={isOwner ? 'Manage' : undefined} onAction={isOwner ? () => onEdit?.('details') : undefined}>
        {provider?.experience?.length || provider?.credentials?.length ? (
          <View style={styles.timeline}>
            {provider.experience?.slice(0, 2).map((item) => (
              <View key={item.id} style={styles.timelineItem}>
                <Text style={styles.timelineTitle}>{item.title}</Text>
                <Text style={styles.timelineMeta}>{[item.organisation, `${item.startYear} - ${item.endYear || 'Present'}`].filter(Boolean).join('  |  ')}</Text>
                {item.description ? <Text style={styles.timelineDescription}>{item.description}</Text> : null}
              </View>
            ))}
            {provider.credentials?.slice(0, 2).map((item) => (
              <View key={item.id} style={styles.timelineItem}>
                <Text style={styles.timelineTitle}>{item.title}{item.verified ? '  Verified' : ''}</Text>
                <Text style={styles.timelineMeta}>{item.issuer}  |  {item.issuedYear}</Text>
              </View>
            ))}
          </View>
        ) : <EmptyHint text={isOwner ? 'Add training, work experience, or credentials to strengthen your profile.' : 'No public qualifications added yet.'} />}
      </ProfileSection>

      {isProvider ? (
        <ProfileSection title="Availability & service area" actionLabel={isOwner ? 'Edit' : undefined} onAction={isOwner ? () => onEdit?.('availability') : undefined}>
          <View style={styles.availabilityCard}>
            <View style={[styles.availabilityIcon, { backgroundColor: `${availability[provider?.availabilityStatus ?? 'away'].color}18` }]}>
              <View style={[styles.availabilityDot, { backgroundColor: availability[provider?.availabilityStatus ?? 'away'].color }]} />
            </View>
            <View style={styles.availabilityBody}>
              <Text style={styles.availabilityTitle}>{availability[provider?.availabilityStatus ?? 'away'].label}</Text>
              <Text style={styles.availabilityDescription}>
                {provider?.location || user.location || 'Location pending'}{provider?.serviceRadiusKm ? `, serving within ${provider.serviceRadiusKm} km` : ''}
              </Text>
            </View>
          </View>
          {provider?.workTypes?.length ? <Text style={styles.supportingText}>{formatWorkTypes(provider.workTypes)}</Text> : null}
        </ProfileSection>
      ) : null}

      <ProfileSection title="Work insights">
        <View style={styles.insightGrid}>
          <Insight value={String(trust.completedJobs)} label="jobs completed" />
          <Insight value={trust.completedJobs ? `${Math.round((trust.completedJobs / Math.max(1, trust.completedJobs + trust.latePayments)) * 100)}%` : '--'} label="completion rate" />
          <Insight value={trust.repeatClients ? `${Math.round((trust.repeatClients / Math.max(1, trust.completedJobs)) * 100)}%` : '--'} label="repeat customers" />
          <Insight value={trust.responseBoost === 'fast' ? 'Fast' : trust.responseBoost === 'limited' ? 'Limited' : 'Standard'} label="response priority" />
        </View>
      </ProfileSection>

      {showReviews ? <ProfileSection title="Reviews" actionLabel={reviews.length ? 'See all' : undefined}>
        <View style={styles.reviewSummary}>
          <Text style={styles.reviewScore}>{trust.reviewCount ? trust.reviewAverage.toFixed(1) : 'New'}</Text>
          <View>
            <Text style={styles.reviewStars}>{trust.reviewCount ? '* * * * *' : 'No ratings yet'}</Text>
            <Text style={styles.reviewCount}>{trust.reviewCount ? `Based on ${trust.reviewCount} verified reviews` : 'Complete a booked job to start building reviews.'}</Text>
          </View>
        </View>
        {reviews.slice(0, 2).map((review) => <ReviewCard key={review.id} review={review} />)}
      </ProfileSection> : null}
    </>
  );
}

export function ProfileSection({ title, actionLabel, onAction, children }: SectionProps) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {actionLabel && onAction ? (
          <TouchableOpacity accessibilityRole="button" onPress={onAction} hitSlop={8}>
            <Text style={styles.sectionAction}>{actionLabel}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
      {children}
    </View>
  );
}

function CompactStat({ value, label, prefix = '' }: { value: string; label: string; prefix?: string }) {
  return <View style={styles.compactStat}><Text style={styles.compactValue}>{prefix}{value}</Text><Text style={styles.compactLabel}>{label}</Text></View>;
}

function Insight({ value, label }: { value: string; label: string }) {
  return <View style={styles.insight}><Text style={styles.insightValue}>{value}</Text><Text style={styles.insightLabel}>{label}</Text></View>;
}

function EmptyHint({ text }: { text: string }) {
  return <View style={styles.emptyHint}><Text style={styles.emptyHintText}>{text}</Text></View>;
}

function ReviewCard({ review }: { review: ProfileReview }) {
  return (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <Avatar name={review.reviewerName} photoURL={review.reviewerPhotoURL} size={34} />
        <View style={styles.reviewIdentity}>
          <Text style={styles.reviewName}>{review.reviewerName}</Text>
          <Text style={styles.reviewMeta}>{'* '.repeat(review.rating).trim()}  |  Verified job</Text>
        </View>
      </View>
      {review.projectTitle ? <Text style={styles.reviewProject}>{review.projectTitle}</Text> : null}
      <Text style={styles.reviewText}>{review.comment}</Text>
    </View>
  );
}

function PortfolioGrid({ items }: { items: PortfolioProject[] }) {
  return (
    <View style={styles.portfolioGrid}>
      {items.slice(0, 4).map((item, index) => (
        <TouchableOpacity key={item.id} accessibilityRole="button" activeOpacity={0.85} style={[styles.portfolioTile, { backgroundColor: portfolioColors[index % portfolioColors.length] }]}>
          {item.mediaUrls?.[0] ? <Image source={{ uri: item.mediaUrls[0] }} style={styles.portfolioImage} /> : null}
          <View style={[styles.portfolioOverlay, item.mediaUrls?.[0] ? styles.portfolioOverlayImage : null]}>
            <Text style={styles.portfolioSkill} numberOfLines={1}>{item.skills.slice(0, 2).join('  |  ') || 'Project'}</Text>
            <Text style={styles.portfolioTitle} numberOfLines={2}>{item.title}</Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function formatPricing(model: PricingModel, price?: number) {
  if (model === 'quote') return 'Request quote';
  if (model === 'negotiable') return 'Negotiable';
  if (!price) return 'Price on request';
  if (model === 'hourly') return `Rs ${price}/hr`;
  if (model === 'daily') return `Rs ${price}/day`;
  if (model === 'startingAt') return `From Rs ${price}`;
  return `Rs ${price}`;
}

function formatWorkTypes(types: NonNullable<ProviderProfile['workTypes']>) {
  const labels = { onSite: 'On-site', remote: 'Remote', hybrid: 'Hybrid' };
  return types.map((type) => labels[type]).join('  |  ');
}

const styles = StyleSheet.create({
  identityCard: { backgroundColor: Colors.surface, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, padding: Spacing.md },
  identityTop: { flexDirection: 'row', alignItems: 'center' },
  identityCopy: { flex: 1, marginLeft: 14 },
  nameLine: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { fontFamily: Fonts.display, fontSize: 24, color: Colors.text, flexShrink: 1 },
  verifiedMark: { color: Colors.success, fontFamily: Fonts.bodyBold, fontSize: 11, backgroundColor: Colors.successSoft, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 9, overflow: 'hidden' },
  headline: { color: Colors.inkSoft, fontFamily: Fonts.bodySemibold, fontSize: 13, lineHeight: 19, marginTop: 3 },
  location: { color: Colors.textLight, fontFamily: Fonts.body, fontSize: 12, marginTop: 5 },
  photoEdit: { position: 'absolute', bottom: -2, alignSelf: 'center', backgroundColor: Colors.ink, borderRadius: 10, paddingHorizontal: 7, paddingVertical: 3 },
  photoEditText: { color: Colors.white, fontFamily: Fonts.bodyBold, fontSize: 10 },
  identityMeta: { flexDirection: 'row', alignItems: 'center', marginTop: Spacing.md, gap: Spacing.sm },
  availabilityPill: { flexDirection: 'row', alignItems: 'center', borderRadius: 999, paddingHorizontal: 9, paddingVertical: 6 },
  availabilityDot: { width: 7, height: 7, borderRadius: 4, marginRight: 6 },
  availabilityText: { fontFamily: Fonts.bodyBold, fontSize: 12 },
  nextAvailable: { flex: 1, color: Colors.textLight, fontFamily: Fonts.body, fontSize: 12 },
  textAction: { marginLeft: 'auto', padding: 4 },
  textActionLabel: { color: Colors.accent, fontFamily: Fonts.bodyBold, fontSize: 12 },
  statRow: { flexDirection: 'row', borderTopWidth: 1, borderColor: Colors.border, marginTop: Spacing.md, paddingTop: Spacing.md },
  compactStat: { flex: 1, alignItems: 'center', minWidth: 0 },
  compactValue: { color: Colors.text, fontFamily: Fonts.displaySemibold, fontSize: 14 },
  compactLabel: { color: Colors.textMuted, fontFamily: Fonts.bodyMedium, fontSize: 10, marginTop: 2 },
  strengthCard: { backgroundColor: '#F0F3FF', borderRadius: 16, padding: Spacing.md, marginTop: Spacing.md, borderWidth: 1, borderColor: '#DFE5FF' },
  strengthTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  eyebrow: { color: Colors.accent, fontFamily: Fonts.bodyBold, fontSize: 10, letterSpacing: 0.4 },
  strengthTitle: { color: Colors.text, fontFamily: Fonts.displaySemibold, fontSize: 17, marginTop: 3 },
  improveButton: { backgroundColor: Colors.surface, borderRadius: 10, paddingHorizontal: 11, paddingVertical: 8 },
  improveText: { color: Colors.accent, fontFamily: Fonts.bodyBold, fontSize: 12 },
  progressTrack: { height: 7, borderRadius: 7, backgroundColor: '#D8DFFB', overflow: 'hidden', marginTop: 13 },
  progressFill: { height: '100%', borderRadius: 7, backgroundColor: Colors.accent },
  strengthHint: { color: Colors.textLight, fontFamily: Fonts.body, fontSize: 12, lineHeight: 17, marginTop: 9 },
  section: { marginTop: Spacing.lg },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.sm },
  sectionTitle: { color: Colors.text, fontFamily: Fonts.display, fontSize: 18 },
  sectionAction: { color: Colors.accent, fontFamily: Fonts.bodyBold, fontSize: 13 },
  bodyText: { color: Colors.textLight, fontFamily: Fonts.body, fontSize: 14, lineHeight: 21 },
  supportingText: { color: Colors.textLight, fontFamily: Fonts.bodyMedium, fontSize: 12, marginTop: 8 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  skillChip: { backgroundColor: Colors.surfaceAlt, paddingHorizontal: 11, paddingVertical: 8, borderRadius: 10 },
  topSkillChip: { backgroundColor: Colors.accentSoft },
  skillText: { color: Colors.textLight, fontFamily: Fonts.bodySemibold, fontSize: 12 },
  topSkillText: { color: Colors.accent, fontFamily: Fonts.bodyBold },
  emptyHint: { backgroundColor: Colors.surface, borderWidth: 1, borderStyle: 'dashed', borderColor: Colors.borderStrong, borderRadius: 12, padding: Spacing.md },
  emptyHintText: { color: Colors.textLight, fontFamily: Fonts.body, fontSize: 13, lineHeight: 19 },
  serviceList: { gap: Spacing.sm },
  serviceCard: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 14, padding: Spacing.md },
  serviceTop: { flexDirection: 'row', gap: 10 },
  serviceCopy: { flex: 1 },
  serviceTitle: { color: Colors.text, fontFamily: Fonts.displaySemibold, fontSize: 15 },
  serviceDescription: { color: Colors.textLight, fontFamily: Fonts.body, fontSize: 12, lineHeight: 18, marginTop: 4 },
  servicePrice: { color: Colors.accent, fontFamily: Fonts.bodyBold, fontSize: 12, textAlign: 'right', maxWidth: 100 },
  serviceFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderColor: Colors.border, paddingTop: 10, marginTop: 11 },
  serviceMeta: { color: Colors.textMuted, fontFamily: Fonts.bodyMedium, fontSize: 11 },
  bookTextButton: { backgroundColor: Colors.ink, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7 },
  bookText: { color: Colors.white, fontFamily: Fonts.bodyBold, fontSize: 12 },
  portfolioGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  portfolioTile: { width: '48.6%', aspectRatio: 1, overflow: 'hidden', borderRadius: 13, justifyContent: 'flex-end' },
  portfolioImage: { ...StyleSheet.absoluteFill, width: '100%', height: '100%' },
  portfolioOverlay: { padding: 11 },
  portfolioOverlayImage: { backgroundColor: 'rgba(0,0,0,0.32)' },
  portfolioSkill: { color: Colors.textLight, fontFamily: Fonts.bodyBold, fontSize: 10, textTransform: 'uppercase' },
  portfolioTitle: { color: Colors.text, fontFamily: Fonts.displaySemibold, fontSize: 13, lineHeight: 18, marginTop: 3 },
  timeline: { gap: 12 },
  timelineItem: { borderLeftWidth: 2, borderLeftColor: Colors.accentSoft, paddingLeft: 12 },
  timelineTitle: { color: Colors.text, fontFamily: Fonts.bodyBold, fontSize: 14 },
  timelineMeta: { color: Colors.textLight, fontFamily: Fonts.bodyMedium, fontSize: 12, marginTop: 3 },
  timelineDescription: { color: Colors.textLight, fontFamily: Fonts.body, fontSize: 12, lineHeight: 18, marginTop: 5 },
  availabilityCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 14, padding: Spacing.md },
  availabilityIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  availabilityBody: { flex: 1 },
  availabilityTitle: { color: Colors.text, fontFamily: Fonts.bodyBold, fontSize: 14 },
  availabilityDescription: { color: Colors.textLight, fontFamily: Fonts.body, fontSize: 12, marginTop: 3 },
  insightGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  insight: { width: '48.6%', backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, padding: 12 },
  insightValue: { color: Colors.text, fontFamily: Fonts.displaySemibold, fontSize: 17 },
  insightLabel: { color: Colors.textLight, fontFamily: Fonts.bodyMedium, fontSize: 11, marginTop: 4 },
  reviewSummary: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 14, padding: Spacing.md, marginBottom: 8 },
  reviewScore: { color: Colors.text, fontFamily: Fonts.display, fontSize: 30, marginRight: 12 },
  reviewStars: { color: Colors.warning, fontFamily: Fonts.bodyBold, fontSize: 12 },
  reviewCount: { color: Colors.textLight, fontFamily: Fonts.body, fontSize: 11, marginTop: 4 },
  reviewCard: { paddingVertical: 12, borderBottomWidth: 1, borderColor: Colors.border },
  reviewHeader: { flexDirection: 'row', alignItems: 'center' },
  reviewIdentity: { marginLeft: 9, flex: 1 },
  reviewName: { color: Colors.text, fontFamily: Fonts.bodyBold, fontSize: 13 },
  reviewMeta: { color: Colors.textLight, fontFamily: Fonts.bodyMedium, fontSize: 11, marginTop: 2 },
  reviewProject: { color: Colors.accent, fontFamily: Fonts.bodySemibold, fontSize: 12, marginTop: 9 },
  reviewText: { color: Colors.textLight, fontFamily: Fonts.body, fontSize: 13, lineHeight: 19, marginTop: 5 },
});
