import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Avatar from './Avatar';
import AppIcon from './AppIcon';
import Button from './Button';
import BambooTexture from './brand/BambooTexture';
import MeghalayaSky from './brand/MeghalayaSky';
import KhasiWeave from './brand/KhasiWeave';
import Card from './ui/Card';
import { categoryStyle } from '../constants/Categories';
import { Colors, Gradients } from '../constants/Colors';
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

const AVATAR = 88;

function completionRate(trust: TrustSummary) {
  if (!trust.completedJobs) return '--';
  return `${Math.max(0, Math.min(100, Math.round((trust.completedJobs / Math.max(1, trust.completedJobs + trust.latePayments)) * 100)))}%`;
}

export function ProfileIdentityHeader({ user, provider, trust, isOwner, onEditPhoto, onEditProfile }: HeaderProps) {
  const state = availability[provider?.availabilityStatus ?? (provider?.available ? 'availableToday' : 'away')];
  const headline = provider?.headline || provider?.skills.slice(0, 3).join(' · ') || 'Marketplace member';
  const verified = (provider?.verifications?.length ?? 0) > 0;
  const primary = categoryStyle(provider?.skills[0]);
  const place = provider?.location || user.location;

  return (
    <View style={styles.identityCard}>
      <View style={styles.banner}>
        <MeghalayaSky animated={false} style={styles.bannerSky} />
        <KhasiWeave height={8} color={Colors.white} opacity={0.45} bordered={false} style={styles.bannerWeave} />
      </View>

      <View style={styles.identityBody}>
        <View style={styles.avatarRow}>
          <TouchableOpacity
            accessibilityRole={onEditPhoto ? 'button' : undefined}
            accessibilityLabel={onEditPhoto ? 'Edit profile photo' : 'Profile photo'}
            disabled={!onEditPhoto}
            onPress={onEditPhoto}
            activeOpacity={0.8}
            style={[styles.avatarRing, { borderColor: provider ? primary.color : Colors.accent }]}>
            <Avatar name={user.displayName} photoURL={user.photoURL} size={AVATAR} />
            {onEditPhoto ? (
              <View style={styles.photoEdit}>
                <AppIcon name="camera" size={13} color={Colors.white} />
              </View>
            ) : null}
          </TouchableOpacity>
          <View style={styles.avatarSide}>
            <View style={[styles.availabilityPill, { backgroundColor: `${state.color}18` }]}>
              <View style={[styles.availabilityDot, { backgroundColor: state.color }]} />
              <Text style={[styles.availabilityText, { color: state.color }]}>{state.label}</Text>
            </View>
            {isOwner && onEditProfile ? (
              <TouchableOpacity accessibilityRole="button" onPress={onEditProfile} style={styles.editButton} hitSlop={6}>
                <AppIcon name="pen" size={13} color={Colors.text} />
                <Text style={styles.editText}>Edit</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        <View style={styles.nameLine}>
          <Text style={styles.name} numberOfLines={1}>{user.displayName}</Text>
          {verified ? <AppIcon name="verified" size={18} color={Colors.accent} /> : null}
        </View>
        <Text style={styles.headline} numberOfLines={2}>{headline}</Text>
        <View style={styles.locationRow}>
          <AppIcon name="location" size={13} color={Colors.textMuted} />
          <Text style={styles.location} numberOfLines={1}>
            {place || 'Location not added'}
            {provider?.serviceRadiusKm ? ` · serves ${provider.serviceRadiusKm} km` : ''}
          </Text>
        </View>
        {provider?.nextAvailableLabel ? <Text style={styles.nextAvailable}>{provider.nextAvailableLabel}</Text> : null}

        <View style={styles.statRow}>
          <CompactStat value={trust.reviewCount ? trust.reviewAverage.toFixed(1) : 'New'} label="rating" star />
          <View style={styles.statDivider} />
          <CompactStat value={String(trust.reviewCount)} label="reviews" />
          <View style={styles.statDivider} />
          <CompactStat value={String(trust.completedJobs)} label="jobs done" />
          <View style={styles.statDivider} />
          <CompactStat value={completionRate(trust)} label="completion" />
        </View>
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
    <Card bamboo style={styles.strengthCard}>
      <View style={styles.strengthTop}>
        <View style={styles.flex}>
          <Text style={styles.eyebrow}>PROFILE STRENGTH</Text>
          <Text style={styles.strengthTitle}>{complete}% complete</Text>
        </View>
        <Button title="Improve" size="sm" variant="outline" icon="sparkles" onPress={onEdit} />
      </View>
      <View style={styles.progressTrack}>
        <LinearGradient
          colors={[...Gradients.brand]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={[styles.progressFill, { width: `${complete}%` }]}
        />
      </View>
      <Text style={styles.strengthHint}>
        {complete < 100 ? 'Add services, portfolio work and verification to earn more trust.' : 'Your public profile is ready to be discovered.'}
      </Text>
    </Card>
  );
}

export function MarketplaceProfileContent({ user, provider, trust, reviews, isOwner, onEdit, onBook, showReviews = true }: ContentProps) {
  const isProvider = !!provider;
  const status = availability[provider?.availabilityStatus ?? 'away'];
  return (
    <>
      <ProfileSection title="About" actionLabel={isOwner ? 'Edit' : undefined} onAction={isOwner ? () => onEdit?.('details') : undefined}>
        <Card>
          <Text style={styles.bodyText}>
            {provider?.bio ||
              (isOwner
                ? 'Add a short introduction so customers understand what you do and why they should choose you.'
                : 'This member has not added an introduction yet.')}
          </Text>
          {provider?.languages?.length || provider?.yearsExperience ? (
            <View style={styles.factRow}>
              {provider?.yearsExperience ? <Fact icon="clock" text={`${provider.yearsExperience}+ yrs experience`} /> : null}
              {provider?.languages?.length ? <Fact icon="users" text={provider.languages.join(', ')} /> : null}
            </View>
          ) : null}
        </Card>
      </ProfileSection>

      <ProfileSection title="Top skills" actionLabel={isOwner ? 'Manage' : undefined} onAction={isOwner ? () => onEdit?.('skills') : undefined}>
        {provider?.skills.length ? (
          <View style={styles.chipWrap}>
            {provider.skills.slice(0, 6).map((skill) => {
              const cat = categoryStyle(skill);
              return (
                <View key={skill} style={[styles.skillChip, { backgroundColor: cat.soft, borderColor: `${cat.color}55` }]}>
                  <AppIcon name={cat.icon} size={14} color={cat.color} />
                  <Text style={[styles.skillText, { color: Colors.text }]}>{skill}</Text>
                </View>
              );
            })}
          </View>
        ) : (
          <EmptyHint text={isOwner ? 'Add skills to appear on the Explore map and start receiving relevant work.' : 'Skills have not been added yet.'} />
        )}
      </ProfileSection>

      <ProfileSection title="Services" actionLabel={isOwner ? 'Add service' : undefined} onAction={isOwner ? () => onEdit?.('services') : undefined}>
        {provider?.services?.length ? (
          <View style={styles.serviceList}>
            {provider.services.map((service) => (
              <Card key={service.id} accent={Colors.bamboo}>
                <View style={styles.serviceTop}>
                  <View style={styles.flex}>
                    <Text style={styles.serviceTitle}>{service.title}</Text>
                    <Text style={styles.serviceDescription} numberOfLines={2}>{service.description}</Text>
                  </View>
                  <View style={styles.pricePill}>
                    <Text style={styles.servicePrice}>{formatPricing(service.pricingModel, service.price)}</Text>
                  </View>
                </View>
                <View style={styles.serviceFooter}>
                  <AppIcon name={service.onSite ? 'location' : 'monitor'} size={13} color={Colors.textMuted} />
                  <Text style={styles.serviceMeta}>{service.duration || (service.onSite ? 'On-site service' : 'Flexible delivery')}</Text>
                  {!isOwner && onBook ? <Button title="Book" size="sm" variant="dark" onPress={() => onBook(service.title)} style={styles.bookButton} /> : null}
                </View>
              </Card>
            ))}
          </View>
        ) : (
          <EmptyHint text={isOwner ? 'Create a bookable service with a clear price or quote option.' : 'No services have been added yet.'} />
        )}
      </ProfileSection>

      <ProfileSection title="Portfolio" actionLabel={isOwner ? 'Add work' : undefined} onAction={isOwner ? () => onEdit?.('portfolio') : undefined}>
        {provider?.portfolio?.length ? (
          <PortfolioGrid items={provider.portfolio} />
        ) : (
          <EmptyHint text={isOwner ? 'Show completed work to make your profile easier to trust.' : 'No portfolio work has been shared yet.'} />
        )}
      </ProfileSection>

      <ProfileSection title="Experience & credentials" actionLabel={isOwner ? 'Manage' : undefined} onAction={isOwner ? () => onEdit?.('details') : undefined}>
        {provider?.experience?.length || provider?.credentials?.length ? (
          <Card style={styles.timeline}>
            {provider.experience?.slice(0, 2).map((item) => (
              <View key={item.id} style={styles.timelineItem}>
                <View style={styles.timelineDot} />
                <Text style={styles.timelineTitle}>{item.title}</Text>
                <Text style={styles.timelineMeta}>{[item.organisation, `${item.startYear} – ${item.endYear || 'Present'}`].filter(Boolean).join(' · ')}</Text>
                {item.description ? <Text style={styles.timelineDescription}>{item.description}</Text> : null}
              </View>
            ))}
            {provider.credentials?.slice(0, 2).map((item) => (
              <View key={item.id} style={styles.timelineItem}>
                <View style={[styles.timelineDot, styles.timelineDotCredential]} />
                <View style={styles.credentialLine}>
                  <Text style={styles.timelineTitle}>{item.title}</Text>
                  {item.verified ? <AppIcon name="verified" size={15} color={Colors.accent} /> : null}
                </View>
                <Text style={styles.timelineMeta}>{item.issuer} · {item.issuedYear}</Text>
              </View>
            ))}
          </Card>
        ) : (
          <EmptyHint text={isOwner ? 'Add training, work experience or credentials to strengthen your profile.' : 'No public qualifications added yet.'} />
        )}
      </ProfileSection>

      {isProvider ? (
        <ProfileSection title="Availability & service area" actionLabel={isOwner ? 'Edit' : undefined} onAction={isOwner ? () => onEdit?.('availability') : undefined}>
          <Card style={styles.availabilityCard}>
            <View style={[styles.availabilityIcon, { backgroundColor: `${status.color}18` }]}>
              <AppIcon name="map" size={18} color={status.color} />
            </View>
            <View style={styles.flex}>
              <Text style={styles.availabilityTitle}>{status.label}</Text>
              <Text style={styles.availabilityDescription}>
                {provider?.location || user.location || 'Location pending'}
                {provider?.serviceRadiusKm ? `, serving within ${provider.serviceRadiusKm} km` : ''}
              </Text>
              {provider?.workTypes?.length ? <Text style={styles.supportingText}>{formatWorkTypes(provider.workTypes)}</Text> : null}
            </View>
          </Card>
        </ProfileSection>
      ) : null}

      <ProfileSection title="Work insights">
        <View style={styles.insightGrid}>
          <Insight icon="briefcase" color={Colors.accent} value={String(trust.completedJobs)} label="jobs completed" />
          <Insight icon="verified" color={Colors.success} value={completionRate(trust)} label="completion rate" />
          <Insight
            icon="users"
            color={Colors.community}
            value={trust.repeatClients ? `${Math.round((trust.repeatClients / Math.max(1, trust.completedJobs)) * 100)}%` : '--'}
            label="repeat customers"
          />
          <Insight
            icon="bolt"
            color={Colors.warning}
            value={trust.responseBoost === 'fast' ? 'Fast' : trust.responseBoost === 'limited' ? 'Limited' : 'Standard'}
            label="response priority"
          />
        </View>
      </ProfileSection>

      {showReviews ? (
        <ProfileSection title="Reviews">
          <Card style={styles.reviewSummary}>
            <Text style={styles.reviewScore}>{trust.reviewCount ? trust.reviewAverage.toFixed(1) : 'New'}</Text>
            <View style={styles.flex}>
              {trust.reviewCount ? <Stars rating={Math.round(trust.reviewAverage)} size={15} /> : <Text style={styles.reviewNone}>No ratings yet</Text>}
              <Text style={styles.reviewCount}>
                {trust.reviewCount ? `Based on ${trust.reviewCount} verified reviews` : 'Complete a booked job to start building reviews.'}
              </Text>
            </View>
          </Card>
          {reviews.slice(0, 2).map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </ProfileSection>
      ) : null}
    </>
  );
}

export function ProfileSection({ title, actionLabel, onAction, children }: SectionProps) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>{title}</Text>
          <KhasiWeave height={6} opacity={0.55} bordered={false} style={styles.sectionWeave} />
        </View>
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

function CompactStat({ value, label, star }: { value: string; label: string; star?: boolean }) {
  return (
    <View style={styles.compactStat}>
      <View style={styles.compactValueRow}>
        {star ? <AppIcon name="star" size={13} color="#F59E0B" /> : null}
        <Text style={styles.compactValue}>{value}</Text>
      </View>
      <Text style={styles.compactLabel}>{label}</Text>
    </View>
  );
}

function Fact({ icon, text }: { icon: 'clock' | 'users'; text: string }) {
  return (
    <View style={styles.fact}>
      <AppIcon name={icon} size={13} color={Colors.bamboo} />
      <Text style={styles.factText}>{text}</Text>
    </View>
  );
}

function Insight({ icon, color, value, label }: { icon: 'briefcase' | 'verified' | 'users' | 'bolt'; color: string; value: string; label: string }) {
  return (
    <View style={styles.insight}>
      <View style={[styles.insightIcon, { backgroundColor: `${color}16` }]}>
        <AppIcon name={icon} size={15} color={color} />
      </View>
      <Text style={styles.insightValue}>{value}</Text>
      <Text style={styles.insightLabel}>{label}</Text>
    </View>
  );
}

function Stars({ rating, size }: { rating: number; size: number }) {
  return (
    <View style={styles.stars}>
      {[1, 2, 3, 4, 5].map((i) => (
        <AppIcon key={i} name="star" size={size} color={i <= rating ? '#F59E0B' : Colors.borderStrong} />
      ))}
    </View>
  );
}

function EmptyHint({ text }: { text: string }) {
  return (
    <View style={styles.emptyHint}>
      <AppIcon name="leaf" size={16} color={Colors.bamboo} />
      <Text style={styles.emptyHintText}>{text}</Text>
    </View>
  );
}

function ReviewCard({ review }: { review: ProfileReview }) {
  return (
    <Card style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <Avatar name={review.reviewerName} photoURL={review.reviewerPhotoURL} size={36} />
        <View style={styles.reviewIdentity}>
          <Text style={styles.reviewName}>{review.reviewerName}</Text>
          <View style={styles.reviewMetaRow}>
            <Stars rating={review.rating} size={11} />
            <Text style={styles.reviewMeta}>Verified job</Text>
          </View>
        </View>
      </View>
      {review.projectTitle ? <Text style={styles.reviewProject}>{review.projectTitle}</Text> : null}
      <Text style={styles.reviewText}>{review.comment}</Text>
    </Card>
  );
}

function PortfolioGrid({ items }: { items: PortfolioProject[] }) {
  return (
    <View style={styles.portfolioGrid}>
      {items.slice(0, 4).map((item) => {
        const cat = categoryStyle(item.skills[0]);
        const image = item.mediaUrls?.[0];
        return (
          <View key={item.id} style={[styles.portfolioTile, { backgroundColor: cat.soft }]}>
            {image ? <Image source={{ uri: image }} style={styles.portfolioImage} /> : <BambooTexture color={cat.color} opacity={0.14} />}
            {image ? (
              <LinearGradient colors={['transparent', 'rgba(15,23,42,0.78)']} style={styles.portfolioShade} />
            ) : (
              <View style={[styles.portfolioBadge, { backgroundColor: Colors.surface }]}>
                <AppIcon name={cat.icon} size={16} color={cat.color} />
              </View>
            )}
            <View style={styles.portfolioOverlay}>
              <Text style={[styles.portfolioSkill, image ? styles.onImage : { color: cat.color }]} numberOfLines={1}>
                {item.skills.slice(0, 2).join(' · ') || 'Project'}
              </Text>
              <Text style={[styles.portfolioTitle, image ? styles.onImage : null]} numberOfLines={2}>
                {item.title}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

function formatPricing(model: PricingModel, price?: number) {
  if (model === 'quote') return 'Request quote';
  if (model === 'negotiable') return 'Negotiable';
  if (!price) return 'Price on request';
  if (model === 'hourly') return `₹${price}/hr`;
  if (model === 'daily') return `₹${price}/day`;
  if (model === 'startingAt') return `From ₹${price}`;
  return `₹${price}`;
}

function formatWorkTypes(types: NonNullable<ProviderProfile['workTypes']>) {
  const labels = { onSite: 'On-site', remote: 'Remote', hybrid: 'Hybrid' };
  return types.map((type) => labels[type]).join(' · ');
}

const styles = StyleSheet.create({
  flex: { flex: 1 },

  identityCard: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    shadowColor: '#1E3A8A',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  banner: { height: 86, overflow: 'hidden' },
  bannerSky: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  bannerWeave: { position: 'absolute', bottom: 8, left: 0, right: 0 },
  identityBody: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.md },
  avatarRow: { flexDirection: 'row', alignItems: 'flex-end', marginTop: -(AVATAR / 2 + 4) },
  avatarRing: { borderWidth: 3, borderRadius: AVATAR / 2 + 6, padding: 2, backgroundColor: Colors.surface },
  photoEdit: {
    position: 'absolute',
    right: 0,
    bottom: 2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.ink,
    borderWidth: 2,
    borderColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarSide: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 8, paddingBottom: 6 },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 6,
  },
  editText: { color: Colors.text, fontFamily: Fonts.bodyBold, fontSize: 12 },
  nameLine: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  name: { fontFamily: Fonts.display, fontSize: 24, letterSpacing: -0.4, color: Colors.text, flexShrink: 1 },
  headline: { color: Colors.inkSoft, fontFamily: Fonts.bodySemibold, fontSize: 13.5, lineHeight: 19, marginTop: 3 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  location: { flex: 1, color: Colors.textLight, fontFamily: Fonts.bodyMedium, fontSize: 12 },
  nextAvailable: { color: Colors.textLight, fontFamily: Fonts.body, fontSize: 12, marginTop: 4 },
  availabilityPill: { flexDirection: 'row', alignItems: 'center', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  availabilityDot: { width: 7, height: 7, borderRadius: 4, marginRight: 6 },
  availabilityText: { fontFamily: Fonts.bodyBold, fontSize: 11.5 },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 16,
    marginTop: Spacing.md,
    paddingVertical: 12,
  },
  statDivider: { width: 1, height: 26, backgroundColor: Colors.border },
  compactStat: { flex: 1, alignItems: 'center', minWidth: 0 },
  compactValueRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  compactValue: { color: Colors.text, fontFamily: Fonts.display, fontSize: 15 },
  compactLabel: { color: Colors.textMuted, fontFamily: Fonts.bodyMedium, fontSize: 10.5, marginTop: 2 },

  strengthCard: { marginTop: Spacing.md },
  strengthTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  eyebrow: { color: Colors.accent, fontFamily: Fonts.bodyBold, fontSize: 10, letterSpacing: 1.8 },
  strengthTitle: { color: Colors.text, fontFamily: Fonts.display, fontSize: 18, marginTop: 3 },
  progressTrack: { height: 8, borderRadius: 8, backgroundColor: Colors.surfaceAlt, overflow: 'hidden', marginTop: 14 },
  progressFill: { height: '100%', borderRadius: 8 },
  strengthHint: { color: Colors.textLight, fontFamily: Fonts.body, fontSize: 12, lineHeight: 17, marginTop: 9 },

  section: { marginTop: Spacing.lg },
  sectionHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 },
  sectionTitle: { color: Colors.text, fontFamily: Fonts.display, fontSize: 18, letterSpacing: -0.3 },
  sectionWeave: { width: 64, marginTop: 4 },
  sectionAction: { color: Colors.accent, fontFamily: Fonts.bodyBold, fontSize: 13, marginTop: 3 },
  bodyText: { color: Colors.textLight, fontFamily: Fonts.body, fontSize: 14, lineHeight: 21 },
  supportingText: { color: Colors.textLight, fontFamily: Fonts.bodyMedium, fontSize: 12, marginTop: 6 },
  factRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  fact: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: Colors.bambooSoft, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  factText: { color: Colors.text, fontFamily: Fonts.bodySemibold, fontSize: 12 },

  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  skillChip: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999 },
  skillText: { fontFamily: Fonts.bodySemibold, fontSize: 12.5 },

  emptyHint: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: Colors.borderStrong,
    borderRadius: 16,
    padding: Spacing.md,
  },
  emptyHintText: { flex: 1, color: Colors.textLight, fontFamily: Fonts.body, fontSize: 13, lineHeight: 19 },

  serviceList: { gap: 10 },
  serviceTop: { flexDirection: 'row', gap: 10, paddingLeft: 4 },
  serviceTitle: { color: Colors.text, fontFamily: Fonts.display, fontSize: 15 },
  serviceDescription: { color: Colors.textLight, fontFamily: Fonts.body, fontSize: 12.5, lineHeight: 18, marginTop: 4 },
  pricePill: { alignSelf: 'flex-start', backgroundColor: Colors.accentSoft, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, maxWidth: 120 },
  servicePrice: { color: Colors.accent, fontFamily: Fonts.bodyBold, fontSize: 12, textAlign: 'center' },
  serviceFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderTopWidth: 1,
    borderColor: Colors.border,
    paddingTop: 10,
    marginTop: 12,
    marginLeft: 4,
  },
  serviceMeta: { flex: 1, color: Colors.textMuted, fontFamily: Fonts.bodyMedium, fontSize: 11.5 },
  bookButton: { borderRadius: 12 },

  portfolioGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  portfolioTile: { width: '48.4%', aspectRatio: 1, overflow: 'hidden', borderRadius: 18, justifyContent: 'flex-end' },
  portfolioImage: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' },
  portfolioShade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '60%' },
  portfolioBadge: { position: 'absolute', top: 10, left: 10, width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  portfolioOverlay: { padding: 12 },
  portfolioSkill: { fontFamily: Fonts.bodyBold, fontSize: 10, letterSpacing: 0.6, textTransform: 'uppercase' },
  portfolioTitle: { color: Colors.text, fontFamily: Fonts.display, fontSize: 13.5, lineHeight: 18, marginTop: 3 },
  onImage: { color: Colors.white },

  timeline: { gap: 14 },
  timelineItem: { borderLeftWidth: 2, borderLeftColor: Colors.accentSoft, paddingLeft: 14 },
  timelineDot: { position: 'absolute', left: -6, top: 3, width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.accent, borderWidth: 2, borderColor: Colors.surface },
  timelineDotCredential: { backgroundColor: Colors.bamboo },
  credentialLine: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  timelineTitle: { color: Colors.text, fontFamily: Fonts.bodyBold, fontSize: 14 },
  timelineMeta: { color: Colors.textLight, fontFamily: Fonts.bodyMedium, fontSize: 12, marginTop: 3 },
  timelineDescription: { color: Colors.textLight, fontFamily: Fonts.body, fontSize: 12.5, lineHeight: 18, marginTop: 5 },

  availabilityCard: { flexDirection: 'row', alignItems: 'center' },
  availabilityIcon: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  availabilityTitle: { color: Colors.text, fontFamily: Fonts.bodyBold, fontSize: 14 },
  availabilityDescription: { color: Colors.textLight, fontFamily: Fonts.body, fontSize: 12.5, marginTop: 3 },

  insightGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  insight: { width: '48.4%', backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 18, padding: 14 },
  insightIcon: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  insightValue: { color: Colors.text, fontFamily: Fonts.display, fontSize: 18 },
  insightLabel: { color: Colors.textLight, fontFamily: Fonts.bodyMedium, fontSize: 11.5, marginTop: 2 },

  stars: { flexDirection: 'row', gap: 2 },
  reviewSummary: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  reviewScore: { color: Colors.text, fontFamily: Fonts.display, fontSize: 32, marginRight: 14 },
  reviewNone: { color: Colors.textMuted, fontFamily: Fonts.bodyBold, fontSize: 12 },
  reviewCount: { color: Colors.textLight, fontFamily: Fonts.body, fontSize: 11.5, marginTop: 5 },
  reviewCard: { marginBottom: 10 },
  reviewHeader: { flexDirection: 'row', alignItems: 'center' },
  reviewIdentity: { marginLeft: 10, flex: 1 },
  reviewName: { color: Colors.text, fontFamily: Fonts.bodyBold, fontSize: 13.5 },
  reviewMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 },
  reviewMeta: { color: Colors.textLight, fontFamily: Fonts.bodyMedium, fontSize: 11 },
  reviewProject: { color: Colors.accent, fontFamily: Fonts.bodySemibold, fontSize: 12, marginTop: 10 },
  reviewText: { color: Colors.textLight, fontFamily: Fonts.body, fontSize: 13, lineHeight: 19, marginTop: 5 },
});
