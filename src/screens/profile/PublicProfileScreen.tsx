import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AppIcon, { AppIconName } from '../../components/AppIcon';
import Avatar from '../../components/Avatar';
import Button from '../../components/Button';
import GycLoader from '../../components/GycLoader';
import GycLogo from '../../components/brand/GycLogo';
import Card from '../../components/ui/Card';
import Chip from '../../components/ui/Chip';
import TextField from '../../components/ui/TextField';
import {
  MarketplaceProfileContent,
  ProfileIdentityHeader,
  ProfileSection,
} from '../../components/MarketplaceProfileSections';
import { Colors } from '../../constants/Colors';
import { Spacing } from '../../constants/Spacing';
import { Fonts } from '../../constants/Typography';
import { useAuth } from '../../context/AuthContext';
import {
  createProfileReference,
  createProfileReview,
  createTrustAction,
  getPublicTrustProfile,
} from '../../services/dataService';
import { PublicTrustProfile, ReviewRelationship } from '../../types/models';

type ActiveForm = 'review' | 'refer' | 'report' | 'block' | null;

const REPORT_REASONS = [
  'Non-payment',
  'No-show / unresponsive',
  'Unsafe or unethical behaviour',
  'Poor quality of work',
  'Spam or fake profile',
  'Other',
] as const;

const BLOCK_REASONS = [
  'Payment issue',
  'Unsafe or unethical behaviour',
  'Unwanted contact',
  'Other',
] as const;

interface Props {
  route: { params: { uid: string } };
  navigation: { navigate: (screen: string, params: { uid: string }) => void };
}

function currency(value: number): string {
  if (!value) return '₹0';
  return `₹${value.toLocaleString('en-IN')}`;
}

function responseLabel(boost: PublicTrustProfile['trust']['responseBoost']): string {
  if (boost === 'fast') return 'Fast response priority';
  if (boost === 'limited') return 'Limited trust';
  return 'Standard trust';
}

export default function PublicProfileScreen({ route, navigation }: Props) {
  const { uid } = route.params;
  const { user, profile: viewerProfile } = useAuth();
  const [profile, setProfile] = useState<PublicTrustProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeForm, setActiveForm] = useState<ActiveForm>(null);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [projectTitle, setProjectTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentOnTime, setPaymentOnTime] = useState(true);
  const [referenceText, setReferenceText] = useState('');
  const [referenceRelation, setReferenceRelation] = useState('');
  const [safetyReason, setSafetyReason] = useState<string | null>(null);
  const [safetyNote, setSafetyNote] = useState('');

  const loadProfile = async () => {
    const next = await getPublicTrustProfile(uid);
    setProfile(next);
    setLoading(false);
  };

  useEffect(() => {
    setLoading(true);
    loadProfile();
  }, [uid]);

  const isSelf = user?.uid === uid;
  const targetIsProvider = !!profile?.provider;

  const submitReview = async () => {
    if (!user || !viewerProfile || !profile) return;
    if (profile.isMock) {
      Alert.alert('Demo profile', 'Reviews can be posted on live user profiles.');
      return;
    }
    if (!reviewText.trim()) {
      Alert.alert('Add a review', 'Write what happened so others can trust the history.');
      return;
    }

    setSaving(true);
    try {
      const relationship: ReviewRelationship = targetIsProvider
        ? 'hiredProvider'
        : 'workedForCustomer';
      await createProfileReview({
        targetUid: uid,
        reviewerUid: user.uid,
        reviewerName: viewerProfile.displayName,
        reviewerPhotoURL: viewerProfile.photoURL,
        relationship,
        rating,
        comment: reviewText.trim(),
        wouldWorkAgain: true,
        ...(projectTitle.trim() ? { projectTitle: projectTitle.trim() } : {}),
        ...(amount ? { amount: Number(amount) } : {}),
        ...(!targetIsProvider ? { paymentOnTime } : {}),
      });
      setReviewText('');
      setProjectTitle('');
      setAmount('');
      setActiveForm(null);
      await loadProfile();
      Alert.alert('Review posted', 'This profile history has been updated.');
    } catch (e: any) {
      Alert.alert('Could not post review', e.message ?? 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const submitReference = async () => {
    if (!user || !viewerProfile || !profile) return;
    if (profile.isMock) {
      Alert.alert('Demo profile', 'References can be added on live user profiles.');
      return;
    }
    if (!referenceText.trim()) {
      Alert.alert('Add a reference', 'Write why you would refer this person.');
      return;
    }

    setSaving(true);
    try {
      await createProfileReference({
        targetUid: uid,
        fromUid: user.uid,
        fromName: viewerProfile.displayName,
        fromPhotoURL: viewerProfile.photoURL,
        relationship: referenceRelation.trim() || 'Known contact',
        note: referenceText.trim(),
        ...(profile.provider?.skills[0] ? { skill: profile.provider.skills[0] } : {}),
      });
      setReferenceText('');
      setReferenceRelation('');
      setActiveForm(null);
      await loadProfile();
      Alert.alert('Reference added', 'Your referral has been attached to this profile.');
    } catch (e: any) {
      Alert.alert('Could not add reference', e.message ?? 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const submitSafetyAction = async (type: 'report' | 'block') => {
    if (!user || !profile) return;
    if (profile.isMock) {
      Alert.alert('Demo profile', 'Safety actions can be used on live user profiles.');
      return;
    }
    if (!safetyReason) {
      Alert.alert('Choose a reason', 'Select the reason that best describes what happened.');
      return;
    }
    if (safetyReason === 'Other' && !safetyNote.trim()) {
      Alert.alert('Add details', 'Describe the reason since you selected "Other".');
      return;
    }

    setSaving(true);
    try {
      await createTrustAction({
        targetUid: uid,
        reporterUid: user.uid,
        type,
        reason: safetyReason,
        ...(safetyNote.trim() ? { note: safetyNote.trim() } : {}),
      });
      setSafetyReason(null);
      setSafetyNote('');
      setActiveForm(null);
      await loadProfile();
      Alert.alert(type === 'report' ? 'Report submitted' : 'Profile blocked', 'The trust record has been updated.');
    } catch (e: any) {
      Alert.alert('Could not update trust record', e.message ?? 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const shareProfile = async () => {
    if (!profile) return;
    await Share.share({
      message: `${profile.user.displayName} on Got You Covered. Trust score ${profile.trust.trustScore}/100, ${profile.trust.reviewCount} reviews, ${profile.trust.completedJobs} completed jobs.`,
    });
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <GycLoader size={110} label="Loading profile" />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.center}>
        <GycLogo size={84} />
        <Text style={styles.emptyText}>This profile is no longer available.</Text>
      </View>
    );
  }

  const trust = profile.trust;
  const openSafety = (form: 'report' | 'block') => {
    setSafetyReason(null);
    setSafetyNote('');
    setActiveForm(form);
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <ProfileIdentityHeader user={profile.user} provider={profile.provider} trust={trust} />

      <View style={styles.primaryActions}>
        {targetIsProvider && !isSelf ? (
          <Button title="Request booking" icon="calendar" onPress={() => navigation.navigate('ProviderDetail', { uid })} style={styles.flex} />
        ) : null}
        <Button title="Share" icon="arrowRight" variant="outline" onPress={shareProfile} style={targetIsProvider && !isSelf ? null : styles.flex} />
      </View>

      <Card style={styles.trustCard}>
        <View style={styles.trustRow}>
          <View style={styles.trustScore}>
            <Text style={styles.trustValue}>{trust.trustScore}</Text>
            <Text style={styles.trustMax}>/100</Text>
          </View>
          <View style={styles.flex}>
            <Text style={styles.trustEyebrow}>TRUST SCORE</Text>
            <Text style={styles.trustLabel}>{responseLabel(trust.responseBoost)}</Text>
            <Text style={styles.trustMeta}>
              {trust.referralCount} referrals · {trust.repeatClients} repeat clients
            </Text>
          </View>
        </View>
        <View style={styles.trustTrack}>
          <View style={[styles.trustFill, { width: `${Math.max(4, Math.min(100, trust.trustScore))}%` }]} />
        </View>
      </Card>

      {trust.reportCount || trust.blockCount ? (
        <View style={styles.safetyBox}>
          <AppIcon name="fire" size={18} color={Colors.warning} />
          <View style={styles.flex}>
            <Text style={styles.safetyTitle}>Safety signals</Text>
            <Text style={styles.safetyText}>
              {trust.reportCount} reports, {trust.blockCount} blocks. Review the history before transacting.
            </Text>
          </View>
        </View>
      ) : null}

      <MarketplaceProfileContent
        user={profile.user}
        provider={profile.provider}
        trust={trust}
        reviews={profile.reviews}
        onBook={isSelf ? undefined : () => navigation.navigate('ProviderDetail', { uid })}
        showReviews={false}
      />

      {!isSelf ? (
        <ProfileSection title="Vouch or flag">
          <View style={styles.actionGrid}>
            <Action icon="star" label="Review" active={activeForm === 'review'} onPress={() => setActiveForm(activeForm === 'review' ? null : 'review')} />
            <Action icon="users" label="Refer" active={activeForm === 'refer'} onPress={() => setActiveForm(activeForm === 'refer' ? null : 'refer')} />
            <Action icon="bell" label="Report" danger active={activeForm === 'report'} onPress={() => openSafety('report')} />
            <Action icon="close" label="Block" danger active={activeForm === 'block'} onPress={() => openSafety('block')} />
          </View>

          {activeForm === 'review' ? (
            <Card style={styles.form}>
              <Text style={styles.formTitle}>Post a review</Text>
              <View style={styles.ratingRow}>
                {[1, 2, 3, 4, 5].map((value) => (
                  <TouchableOpacity
                    key={value}
                    onPress={() => setRating(value)}
                    activeOpacity={0.7}
                    hitSlop={4}
                    accessibilityRole="button"
                    accessibilityLabel={`${value} star${value > 1 ? 's' : ''}`}>
                    <AppIcon name="star" size={30} color={value <= rating ? '#F59E0B' : Colors.borderStrong} />
                  </TouchableOpacity>
                ))}
              </View>
              <TextField placeholder="Project title" value={projectTitle} onChangeText={setProjectTitle} containerStyle={styles.field} />
              <TextField placeholder="Amount involved (optional)" keyboardType="numeric" value={amount} onChangeText={setAmount} containerStyle={styles.field} />
              {!targetIsProvider ? (
                <TouchableOpacity style={styles.checkRow} onPress={() => setPaymentOnTime((next) => !next)} activeOpacity={0.8}>
                  <View style={[styles.checkbox, paymentOnTime && styles.checkboxActive]}>
                    {paymentOnTime ? <AppIcon name="verified" size={12} color={Colors.white} /> : null}
                  </View>
                  <Text style={styles.checkText}>Payment was made on time</Text>
                </TouchableOpacity>
              ) : null}
              <TextField placeholder="What should others know?" multiline value={reviewText} onChangeText={setReviewText} containerStyle={styles.field} />
              <Button title="Post review" onPress={submitReview} loading={saving} style={styles.formButton} />
            </Card>
          ) : null}

          {activeForm === 'refer' ? (
            <Card style={styles.form}>
              <Text style={styles.formTitle}>Refer this profile</Text>
              <TextField placeholder="Your relationship, e.g. neighbour in Mawlai" value={referenceRelation} onChangeText={setReferenceRelation} containerStyle={styles.field} />
              <TextField placeholder="Why would you refer them?" multiline value={referenceText} onChangeText={setReferenceText} containerStyle={styles.field} />
              <Button title="Add reference" onPress={submitReference} loading={saving} style={styles.formButton} />
            </Card>
          ) : null}

          {activeForm === 'report' || activeForm === 'block' ? (
            <Card style={styles.form}>
              <Text style={styles.formTitle}>{activeForm === 'report' ? 'Report profile' : 'Block profile'}</Text>
              <Text style={styles.formLabel}>What's the reason?</Text>
              <View style={styles.reasonGrid}>
                {(activeForm === 'report' ? REPORT_REASONS : BLOCK_REASONS).map((reason) => (
                  <Chip key={reason} label={reason} color={Colors.error} active={safetyReason === reason} onPress={() => setSafetyReason(reason)} />
                ))}
              </View>
              <TextField
                placeholder={safetyReason === 'Other' ? 'Describe what happened.' : 'Add details (optional).'}
                multiline
                value={safetyNote}
                onChangeText={setSafetyNote}
                containerStyle={styles.field}
              />
              <Button
                title={activeForm === 'report' ? 'Submit report' : 'Block profile'}
                variant="dark"
                onPress={() => submitSafetyAction(activeForm)}
                loading={saving}
                style={styles.formButton}
              />
            </Card>
          ) : null}
        </ProfileSection>
      ) : null}

      <ProfileSection title={`Reviews (${profile.reviews.length})`}>
        {profile.reviews.length === 0 ? (
          <Text style={styles.emptyInline}>No reviews yet.</Text>
        ) : (
          profile.reviews.map((review) => (
            <Card key={review.id} style={styles.historyCard}>
              <View style={styles.historyHeader}>
                <Avatar name={review.reviewerName} photoURL={review.reviewerPhotoURL} size={36} />
                <View style={styles.historyHeaderText}>
                  <Text style={styles.historyName}>{review.reviewerName}</Text>
                  <View style={styles.historyMetaRow}>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <AppIcon key={i} name="star" size={11} color={i <= review.rating ? '#F59E0B' : Colors.borderStrong} />
                    ))}
                    {review.amount ? <Text style={styles.historyMeta}>  ·  {currency(review.amount)}</Text> : null}
                  </View>
                </View>
              </View>
              {review.projectTitle ? <Text style={styles.projectTitle}>{review.projectTitle}</Text> : null}
              <Text style={styles.bodyText}>{review.comment}</Text>
            </Card>
          ))
        )}
      </ProfileSection>

      <ProfileSection title={`References (${profile.references.length})`}>
        {profile.references.length === 0 ? (
          <Text style={styles.emptyInline}>No references yet.</Text>
        ) : (
          profile.references.map((reference) => (
            <Card key={reference.id} style={styles.historyCard}>
              <View style={styles.historyHeader}>
                <Avatar name={reference.fromName} photoURL={reference.fromPhotoURL} size={36} />
                <View style={styles.historyHeaderText}>
                  <Text style={styles.historyName}>{reference.fromName}</Text>
                  <Text style={styles.historyMeta}>
                    {reference.relationship} · {reference.verified ? 'verified' : 'pending verification'}
                  </Text>
                </View>
              </View>
              <Text style={styles.bodyText}>{reference.note}</Text>
            </Card>
          ))
        )}
      </ProfileSection>

    </ScrollView>
  );
}

function Action({
  icon,
  label,
  onPress,
  danger,
  active,
}: {
  icon: AppIconName;
  label: string;
  onPress: () => void;
  danger?: boolean;
  active?: boolean;
}) {
  const color = danger ? Colors.error : Colors.accent;
  return (
    <TouchableOpacity
      style={[styles.actionButton, active && { borderColor: color, backgroundColor: danger ? Colors.errorSoft : Colors.accentSoft }]}
      activeOpacity={0.8}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: !!active }}>
      <View style={[styles.actionIcon, { backgroundColor: danger ? Colors.errorSoft : Colors.accentSoft }]}>
        <AppIcon name={icon} size={16} color={color} />
      </View>
      <Text style={[styles.actionText, danger && { color: Colors.error }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { padding: Spacing.md, paddingBottom: Spacing.xxl, backgroundColor: Colors.background },
  flex: { flex: 1 },
  center: { flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center', padding: Spacing.lg },
  emptyText: { fontFamily: Fonts.bodyMedium, color: Colors.textLight, marginTop: Spacing.md },
  primaryActions: { flexDirection: 'row', gap: 10, marginTop: Spacing.md },

  trustCard: { marginTop: Spacing.md },
  trustRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  trustScore: { flexDirection: 'row', alignItems: 'flex-end' },
  trustValue: { fontFamily: Fonts.display, fontSize: 36, color: Colors.text, lineHeight: 40 },
  trustMax: { fontFamily: Fonts.bodySemibold, fontSize: 13, color: Colors.textMuted, marginBottom: 6, marginLeft: 2 },
  trustEyebrow: { fontFamily: Fonts.bodyBold, fontSize: 10, letterSpacing: 1.8, color: Colors.accent },
  trustLabel: { fontFamily: Fonts.bodyBold, fontSize: 14, color: Colors.text, marginTop: 2 },
  trustMeta: { fontFamily: Fonts.body, fontSize: 12, color: Colors.textLight, marginTop: 2 },
  trustTrack: { height: 8, borderRadius: 4, backgroundColor: Colors.surfaceAlt, marginTop: 14, overflow: 'hidden' },
  trustFill: { height: '100%', borderRadius: 4, backgroundColor: Colors.success },

  safetyBox: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: Colors.warningSoft,
    borderRadius: 18,
    padding: Spacing.md,
    marginTop: Spacing.md,
  },
  safetyTitle: { fontFamily: Fonts.bodyBold, color: Colors.warning, fontSize: 14 },
  safetyText: { fontFamily: Fonts.body, color: Colors.textLight, fontSize: 13, lineHeight: 19, marginTop: 3 },

  actionGrid: { flexDirection: 'row', gap: 8 },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 18,
    paddingVertical: 12,
  },
  actionIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  actionText: { fontFamily: Fonts.bodyBold, color: Colors.text, fontSize: 12.5 },

  form: { marginTop: Spacing.md },
  formTitle: { fontFamily: Fonts.display, color: Colors.text, fontSize: 16, marginBottom: Spacing.sm },
  formLabel: { fontFamily: Fonts.bodySemibold, color: Colors.textLight, fontSize: 12.5, marginBottom: Spacing.sm },
  formButton: { marginTop: Spacing.md },
  field: { marginTop: 10 },
  reasonGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  ratingRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  checkRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: Colors.borderStrong,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: { backgroundColor: Colors.success, borderColor: Colors.success },
  checkText: { fontFamily: Fonts.bodyMedium, color: Colors.text, fontSize: 13 },

  historyCard: { marginBottom: 10 },
  historyHeader: { flexDirection: 'row', alignItems: 'center' },
  historyHeaderText: { marginLeft: 10, flex: 1 },
  historyName: { fontFamily: Fonts.bodyBold, color: Colors.text, fontSize: 14 },
  historyMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 3 },
  historyMeta: { fontFamily: Fonts.bodyMedium, color: Colors.textLight, fontSize: 11.5, marginTop: 2 },
  projectTitle: { fontFamily: Fonts.bodySemibold, color: Colors.accent, fontSize: 12.5, marginTop: 10 },
  bodyText: { fontFamily: Fonts.body, fontSize: 13.5, color: Colors.textLight, lineHeight: 20, marginTop: 5 },
  emptyInline: { fontFamily: Fonts.body, color: Colors.textLight, fontSize: 13 },
});
