import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Avatar from '../../components/Avatar';
import Button from '../../components/Button';
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
  if (!value) return 'Rs 0';
  return `Rs ${value.toLocaleString('en-IN')}`;
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
    return <ActivityIndicator style={styles.loader} color={Colors.ink} />;
  }

  if (!profile) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>This profile is no longer available.</Text>
      </View>
    );
  }

  const trust = profile.trust;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <ProfileIdentityHeader user={profile.user} provider={profile.provider} trust={trust} />
      <MarketplaceProfileContent
        user={profile.user}
        provider={profile.provider}
        trust={trust}
        reviews={profile.reviews}
        onBook={() => navigation.navigate('ProviderDetail', { uid })}
      />

      <ProfileSection title="Trust actions">
      <View style={styles.actionGrid}>
        <Action label="Share" onPress={shareProfile} />
        {targetIsProvider ? <Action label="Request booking" onPress={() => navigation.navigate('ProviderDetail', { uid })} /> : null}
        {!isSelf ? <Action label="Review" onPress={() => setActiveForm('review')} /> : null}
        {!isSelf ? <Action label="Refer" onPress={() => setActiveForm('refer')} /> : null}
        {!isSelf ? (
          <Action
            label="Report"
            danger
            onPress={() => {
              setSafetyReason(null);
              setSafetyNote('');
              setActiveForm('report');
            }}
          />
        ) : null}
        {!isSelf ? (
          <Action
            label="Block"
            danger
            onPress={() => {
              setSafetyReason(null);
              setSafetyNote('');
              setActiveForm('block');
            }}
          />
        ) : null}
      </View>
      </ProfileSection>

      {activeForm === 'review' ? (
        <View style={styles.form}>
          <Text style={styles.formTitle}>Post a review</Text>
          <View style={styles.ratingRow}>
            {[1, 2, 3, 4, 5].map((value) => (
              <TouchableOpacity
                key={value}
                style={[styles.ratingButton, rating === value && styles.ratingButtonActive]}
                onPress={() => setRating(value)}
                activeOpacity={0.8}
              >
                <Text style={[styles.ratingText, rating === value && styles.ratingTextActive]}>
                  {value}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput
            style={styles.input}
            placeholder="Project title"
            placeholderTextColor={Colors.textMuted}
            value={projectTitle}
            onChangeText={setProjectTitle}
          />
          <TextInput
            style={styles.input}
            placeholder="Amount involved (optional)"
            placeholderTextColor={Colors.textMuted}
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
          />
          {!targetIsProvider ? (
            <TouchableOpacity
              style={styles.checkRow}
              onPress={() => setPaymentOnTime((next) => !next)}
              activeOpacity={0.8}
            >
              <View style={[styles.checkbox, paymentOnTime && styles.checkboxActive]} />
              <Text style={styles.checkText}>Payment was made on time</Text>
            </TouchableOpacity>
          ) : null}
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="What should others know?"
            placeholderTextColor={Colors.textMuted}
            multiline
            value={reviewText}
            onChangeText={setReviewText}
          />
          <Button title={saving ? 'Posting...' : 'Post Review'} onPress={submitReview} disabled={saving} />
        </View>
      ) : null}

      {activeForm === 'refer' ? (
        <View style={styles.form}>
          <Text style={styles.formTitle}>Refer this profile</Text>
          <TextInput
            style={styles.input}
            placeholder="Your relationship"
            placeholderTextColor={Colors.textMuted}
            value={referenceRelation}
            onChangeText={setReferenceRelation}
          />
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Why would you refer them?"
            placeholderTextColor={Colors.textMuted}
            multiline
            value={referenceText}
            onChangeText={setReferenceText}
          />
          <Button title={saving ? 'Adding...' : 'Add Reference'} onPress={submitReference} disabled={saving} />
        </View>
      ) : null}

      {activeForm === 'report' || activeForm === 'block' ? (
        <View style={styles.form}>
          <Text style={styles.formTitle}>{activeForm === 'report' ? 'Report profile' : 'Block profile'}</Text>
          <Text style={styles.formLabel}>What's the reason?</Text>
          <View style={styles.reasonGrid}>
            {(activeForm === 'report' ? REPORT_REASONS : BLOCK_REASONS).map((reason) => (
              <TouchableOpacity
                key={reason}
                style={[styles.reasonChip, safetyReason === reason && styles.reasonChipActive]}
                onPress={() => setSafetyReason(reason)}
                activeOpacity={0.8}
              >
                <Text
                  style={[styles.reasonChipText, safetyReason === reason && styles.reasonChipTextActive]}
                >
                  {reason}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder={
              safetyReason === 'Other'
                ? 'Describe what happened.'
                : 'Add details (optional).'
            }
            placeholderTextColor={Colors.textMuted}
            multiline
            value={safetyNote}
            onChangeText={setSafetyNote}
          />
          <Button
            title={saving ? 'Saving...' : activeForm === 'report' ? 'Submit Report' : 'Block Profile'}
            onPress={() => submitSafetyAction(activeForm)}
            disabled={saving}
          />
        </View>
      ) : null}

      <Text style={styles.sectionTitle}>Reviews</Text>
      {profile.reviews.length === 0 ? (
        <Text style={styles.emptyInline}>No reviews yet.</Text>
      ) : (
        profile.reviews.map((review) => (
          <View key={review.id} style={styles.historyCard}>
            <View style={styles.historyHeader}>
              <Avatar name={review.reviewerName} photoURL={review.reviewerPhotoURL} size={34} />
              <View style={styles.historyHeaderText}>
                <Text style={styles.historyName}>{review.reviewerName}</Text>
                <Text style={styles.historyMeta}>
                  {review.rating}/5{review.amount ? `, ${currency(review.amount)}` : ''}
                </Text>
              </View>
            </View>
            {review.projectTitle ? <Text style={styles.projectTitle}>{review.projectTitle}</Text> : null}
            <Text style={styles.bodyText}>{review.comment}</Text>
          </View>
        ))
      )}

      <Text style={styles.sectionTitle}>References</Text>
      {profile.references.length === 0 ? (
        <Text style={styles.emptyInline}>No references yet.</Text>
      ) : (
        profile.references.map((reference) => (
          <View key={reference.id} style={styles.historyCard}>
            <View style={styles.historyHeader}>
              <Avatar name={reference.fromName} photoURL={reference.fromPhotoURL} size={34} />
              <View style={styles.historyHeaderText}>
                <Text style={styles.historyName}>{reference.fromName}</Text>
                <Text style={styles.historyMeta}>
                  {reference.relationship}{reference.verified ? ', verified' : ', pending verification'}
                </Text>
              </View>
            </View>
            <Text style={styles.bodyText}>{reference.note}</Text>
          </View>
        ))
      )}

      {trust.reportCount || trust.blockCount ? (
        <View style={styles.safetyBox}>
          <Text style={styles.safetyTitle}>Safety signals</Text>
          <Text style={styles.safetyText}>
            {trust.reportCount} reports, {trust.blockCount} blocks. Review the history before transacting.
          </Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

function Action({
  label,
  onPress,
  danger,
}: {
  label: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.actionButton, danger && styles.actionDanger]}
      activeOpacity={0.8}
      onPress={onPress}
    >
      <Text style={[styles.actionText, danger && styles.actionDangerText]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl + 80,
    backgroundColor: Colors.background,
  },
  loader: {
    flex: 1,
    marginTop: Spacing.xxl,
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  emptyText: {
    fontFamily: Fonts.body,
    color: Colors.textLight,
  },
  sectionTitle: {
    fontFamily: Fonts.display,
    fontSize: 18,
    color: Colors.text,
    marginTop: Spacing.xl,
    marginBottom: Spacing.xs,
  },
  bodyText: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.textLight,
    lineHeight: 21,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
  actionButton: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  actionText: {
    fontFamily: Fonts.bodyBold,
    color: Colors.text,
    fontSize: 13,
  },
  actionDanger: {
    backgroundColor: Colors.errorSoft,
    borderColor: Colors.errorSoft,
  },
  actionDangerText: {
    color: Colors.error,
  },
  form: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    padding: Spacing.md,
    marginTop: Spacing.md,
  },
  formTitle: {
    fontFamily: Fonts.bodyBold,
    color: Colors.text,
    fontSize: 15,
    marginBottom: Spacing.sm,
  },
  formLabel: {
    fontFamily: Fonts.bodyMedium,
    color: Colors.textLight,
    fontSize: 12,
    marginBottom: Spacing.xs,
  },
  reasonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  reasonChip: {
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
    borderRadius: 20,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: Spacing.xs + 2,
  },
  reasonChipActive: {
    backgroundColor: Colors.error,
    borderColor: Colors.error,
  },
  reasonChipText: {
    fontFamily: Fonts.bodyMedium,
    color: Colors.text,
    fontSize: 12.5,
  },
  reasonChipTextActive: {
    color: Colors.white,
  },
  ratingRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  ratingButton: {
    width: 38,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceAlt,
  },
  ratingButtonActive: {
    backgroundColor: Colors.ink,
  },
  ratingText: {
    fontFamily: Fonts.bodyBold,
    color: Colors.text,
  },
  ratingTextActive: {
    color: Colors.white,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
    borderRadius: 12,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    fontFamily: Fonts.body,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  textArea: {
    minHeight: 92,
    textAlignVertical: 'top',
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: Colors.borderStrong,
    marginRight: Spacing.xs,
  },
  checkboxActive: {
    backgroundColor: Colors.success,
    borderColor: Colors.success,
  },
  checkText: {
    fontFamily: Fonts.bodyMedium,
    color: Colors.text,
    fontSize: 13,
  },
  historyCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyHeaderText: {
    marginLeft: Spacing.sm,
    flex: 1,
  },
  historyName: {
    fontFamily: Fonts.bodyBold,
    color: Colors.text,
    fontSize: 14,
  },
  historyMeta: {
    fontFamily: Fonts.bodyMedium,
    color: Colors.textLight,
    fontSize: 11,
    marginTop: 2,
  },
  projectTitle: {
    fontFamily: Fonts.bodyBold,
    color: Colors.text,
    fontSize: 13,
    marginTop: Spacing.sm,
    marginBottom: 2,
  },
  emptyInline: {
    fontFamily: Fonts.body,
    color: Colors.textLight,
    fontSize: 13,
  },
  safetyBox: {
    backgroundColor: Colors.warningSoft,
    borderRadius: 14,
    padding: Spacing.md,
    marginTop: Spacing.lg,
  },
  safetyTitle: {
    fontFamily: Fonts.bodyBold,
    color: Colors.warning,
    fontSize: 14,
  },
  safetyText: {
    fontFamily: Fonts.body,
    color: Colors.textLight,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 3,
  },
});
