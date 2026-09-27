import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert, Image, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AppIcon, { AppIconName } from '../../components/AppIcon';
import Avatar from '../../components/Avatar';
import Button from '../../components/Button';
import GycLoader from '../../components/GycLoader';
import GycLogo from '../../components/brand/GycLogo';
import Card from '../../components/ui/Card';
import TextField from '../../components/ui/TextField';
import { categoryStyle } from '../../constants/Categories';
import { Colors } from '../../constants/Colors';
import { zoneForPoint } from '../../data/meghalayaZones';
import { timeAgo } from '../../features/explore/mapData';
import { Spacing } from '../../constants/Spacing';
import { Fonts } from '../../constants/Typography';
import {
  getPost,
  applyToPost,
  subscribeToApplicationsForPost,
  updateApplicationStatus,
  getUserProfile,
  FeedPost,
} from '../../services/dataService';
import { Application, BookingStatus, UserProfile } from '../../types/models';
import { useAuth } from '../../context/AuthContext';

// Registered in both the Home and Explore stacks, so typed structurally.
interface Props {
  route: { params: { postId: string } };
  navigation: { navigate: (screen: string, params: { uid: string }) => void };
}

interface ApplicantRow extends Application {
  applicantName: string;
  applicantPhotoURL?: string;
}

const STATUS_STYLES: Record<BookingStatus, { bg: string; fg: string; label: string }> = {
  pending: { bg: Colors.warningSoft, fg: Colors.warning, label: 'Pending' },
  accepted: { bg: Colors.successSoft, fg: Colors.success, label: 'Accepted' },
  declined: { bg: Colors.errorSoft, fg: Colors.error, label: 'Declined' },
  cancelled: { bg: Colors.surfaceAlt, fg: Colors.textMuted, label: 'Cancelled' },
  completed: { bg: Colors.accentSoft, fg: Colors.accent, label: 'Completed' },
};

export default function PostDetailScreen({ route, navigation }: Props) {
  const { postId } = route.params;
  const { user } = useAuth();
  const rootNavigation = useNavigation<any>();
  const [post, setPost] = useState<FeedPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [applicants, setApplicants] = useState<ApplicantRow[]>([]);

  useEffect(() => {
    (async () => {
      const p = await getPost(postId);
      setPost(p);
      setLoading(false);
    })();
  }, [postId]);

  useEffect(() => {
    if (!post || post.isMock || !user || post.authorUid !== user.uid) return;
    const unsub = subscribeToApplicationsForPost(postId, async (apps) => {
      const owners = await Promise.all(apps.map((a) => getUserProfile(a.applicantUid)));
      setApplicants(
        apps.map((a, i) => ({
          ...a,
          applicantName: owners[i]?.displayName ?? 'Applicant',
          applicantPhotoURL: owners[i]?.photoURL,
        }))
      );
    });
    return unsub;
  }, [post, user, postId]);

  const isOwner = post && user && post.authorUid === user.uid;

  const handleApply = async () => {
    if (!user || !post) return;
    if (isOwner) {
      Alert.alert("That's your post", "You can't apply to your own job post.");
      return;
    }
    if (!message.trim()) {
      Alert.alert('Add a message', 'Tell them why you\'re a good fit.');
      return;
    }
    setSubmitting(true);
    try {
      await applyToPost(
        {
          postId: post.id,
          applicantUid: user.uid,
          postAuthorUid: post.authorUid,
          message: message.trim(),
        },
        post.isMock
      );
      setMessage('');
      Alert.alert('Applied', 'Your application has been sent.');
    } catch (e: any) {
      Alert.alert('Failed to apply', e.message ?? 'Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRespond = async (applicationId: string, status: BookingStatus) => {
    try {
      await updateApplicationStatus(applicationId, status);
    } catch (e: any) {
      Alert.alert('Failed', e.message ?? 'Could not update this application.');
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <GycLoader size={110} label="Loading job" />
      </View>
    );
  }

  if (!post) {
    return (
      <View style={styles.center}>
        <GycLogo size={84} />
        <Text style={styles.emptyText}>This post is no longer available.</Text>
      </View>
    );
  }

  const cat = categoryStyle(post.skill);
  const zone = post.coords ? zoneForPoint(post.coords) : null;
  const place = post.location || (zone ? `${zone.name}, ${zone.area}` : undefined);
  const seeOnMap = () =>
    rootNavigation.getParent()?.navigate('ExploreTab', { screen: 'Explore', params: { focusId: `job:${post.id}` } });

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.hero}>
        <View style={styles.band}>
          <View style={styles.bandRow}>
            <View style={styles.bandIcon}>
              <AppIcon name={cat.icon} size={18} color={Colors.text} />
            </View>
            <Text style={styles.bandSkill}>{post.skill}</Text>
            <Text style={styles.bandTime}>{timeAgo(post.createdAt)}</Text>
          </View>
        </View>

        <View style={styles.heroBody}>
          <Text style={styles.title}>{post.title}</Text>
          <Text style={styles.description}>{post.description}</Text>

          <TouchableOpacity
            style={styles.authorRow}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('PublicProfile', { uid: post.authorUid })}>
            <Avatar name={post.authorName} photoURL={post.authorPhotoURL} size={40} />
            <View style={styles.authorText}>
              <Text style={styles.authorLabel}>Posted by</Text>
              <Text style={styles.authorName}>{post.authorName}</Text>
            </View>
            <View style={styles.trustPill}>
              <AppIcon name="verified" size={12} color={Colors.success} />
              <Text style={styles.trustPillText}>Trust {post.authorTrustScore}</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.statsRow}>
        <Stat icon="briefcase" value={post.budget ? `₹${post.budget}` : 'Open'} label="budget" />
        <Stat icon="users" value={String(post.applicantCount)} label="applied" />
        <Stat icon="location" value={zone?.name ?? 'Nearby'} label={zone?.area ?? 'area'} />
      </View>

      {post.photoURLs?.length ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photos}>
          {post.photoURLs.map((uri) => (
            <Image key={uri} source={{ uri }} style={styles.photo} />
          ))}
        </ScrollView>
      ) : null}

      {post.coords ? (
        <TouchableOpacity activeOpacity={0.85} onPress={seeOnMap}>
          <View style={styles.mapCard}>
            <View style={[styles.mapPin, { borderColor: Colors.border }]}>
              <AppIcon name={cat.icon} size={16} color={Colors.text} />
            </View>
            <View style={styles.flex}>
              <Text style={styles.mapTitle}>{place ?? 'Pinned on the map'}</Text>
              <Text style={styles.mapSub}>Approximate spot (~100 m). See nearby jobs and pros.</Text>
            </View>
            <View style={styles.mapGo}>
              <AppIcon name="map" size={16} color={Colors.white} />
            </View>
          </View>
        </TouchableOpacity>
      ) : null}

      {isOwner ? (
        <>
          <SectionHeading title={`Applicants (${applicants.length})`} />
          {applicants.length === 0 ? (
            <View style={styles.emptyCard}>
              <AppIcon name="leaf" size={16} color={Colors.bamboo} />
              <Text style={styles.emptyInline}>No applicants yet. Your job is live on the feed and the Explore map.</Text>
            </View>
          ) : (
            applicants.map((a) => {
              const statusStyle = STATUS_STYLES[a.status];
              return (
                <Card key={a.id} style={styles.applicantCard}>
                  <TouchableOpacity
                    style={styles.applicantHeader}
                    activeOpacity={0.8}
                    onPress={() => navigation.navigate('PublicProfile', { uid: a.applicantUid })}>
                    <Avatar name={a.applicantName} photoURL={a.applicantPhotoURL} size={38} />
                    <Text style={styles.applicantName}>{a.applicantName}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                      <Text style={[styles.statusText, { color: statusStyle.fg }]}>{statusStyle.label}</Text>
                    </View>
                  </TouchableOpacity>
                  <Text style={styles.applicantMessage}>{a.message}</Text>
                  {a.status === 'pending' && (
                    <View style={styles.actionRow}>
                      <Button title="Decline" variant="outline" size="sm" onPress={() => handleRespond(a.id, 'declined')} style={styles.flex} />
                      <Button title="Accept" size="sm" icon="verified" onPress={() => handleRespond(a.id, 'accepted')} style={styles.flex} />
                    </View>
                  )}
                </Card>
              );
            })
          )}
        </>
      ) : (
        <>
          <SectionHeading title="Apply for this job" />
          <Card>
            <TextField
              placeholder="Introduce yourself and why you're a good fit…"
              multiline
              numberOfLines={4}
              value={message}
              onChangeText={setMessage}
            />
            <Button title="Send application" icon="arrowRight" onPress={handleApply} loading={submitting} style={styles.spacingTop} />
          </Card>
        </>
      )}
    </ScrollView>
  );
}

function SectionHeading({ title }: { title: string }) {
  return (
    <View style={styles.sectionHeading}>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

function Stat({ icon, value, label }: { icon: AppIconName; value: string; label: string }) {
  return (
    <View style={styles.stat}>
      <AppIcon name={icon} size={16} color={Colors.accent} />
      <Text style={styles.statValue} numberOfLines={1}>
        {value}
      </Text>
      <Text style={styles.statLabel} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: Spacing.md, paddingBottom: Spacing.xxl, backgroundColor: Colors.background, flexGrow: 1 },
  flex: { flex: 1 },
  center: { flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center', padding: Spacing.lg },
  emptyText: { fontFamily: Fonts.bodyMedium, color: Colors.textLight, marginTop: Spacing.md },

  hero: {
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
  band: { paddingHorizontal: Spacing.md, paddingVertical: 14, backgroundColor: Colors.ink },
  bandRow: { flexDirection: 'row', alignItems: 'center' },
  bandIcon: { width: 34, height: 34, borderRadius: 17, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center' },
  bandSkill: { flex: 1, color: Colors.white, fontFamily: Fonts.display, fontSize: 15, marginLeft: 10 },
  bandTime: { color: 'rgba(255,255,255,0.85)', fontFamily: Fonts.bodySemibold, fontSize: 12 },
  heroBody: { padding: Spacing.md },
  title: { fontSize: 22, lineHeight: 28, fontFamily: Fonts.display, color: Colors.text, letterSpacing: -0.4 },
  description: { fontSize: 14.5, fontFamily: Fonts.body, color: Colors.textLight, marginTop: 8, lineHeight: 22 },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderColor: Colors.border,
  },
  authorText: { marginLeft: 10, flex: 1 },
  authorLabel: { fontSize: 11, fontFamily: Fonts.bodyMedium, color: Colors.textMuted },
  authorName: { fontSize: 14.5, fontFamily: Fonts.bodyBold, color: Colors.text, marginTop: 1 },
  trustPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.successSoft, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  trustPillText: { fontSize: 11.5, fontFamily: Fonts.bodyBold, color: Colors.success },

  statsRow: { flexDirection: 'row', marginTop: Spacing.md, gap: 10 },
  stat: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  statValue: { fontSize: 15, fontFamily: Fonts.display, color: Colors.text, marginTop: 6 },
  statLabel: { fontSize: 11, fontFamily: Fonts.bodyMedium, color: Colors.textLight, marginTop: 2 },

  photos: { gap: 10, paddingTop: Spacing.md },
  photo: { width: 140, height: 140, borderRadius: 18, backgroundColor: Colors.surfaceAlt },

  mapCard: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 20, padding: 14, marginTop: Spacing.md, backgroundColor: Colors.ink },
  mapPin: { width: 40, height: 40, borderRadius: 20, borderWidth: 2.5, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center' },
  mapTitle: { color: Colors.white, fontFamily: Fonts.bodyBold, fontSize: 14 },
  mapSub: { color: 'rgba(255,255,255,0.7)', fontFamily: Fonts.body, fontSize: 11.5, marginTop: 2 },
  mapGo: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center' },

  sectionHeading: { marginTop: Spacing.lg, marginBottom: 10 },
  sectionTitle: { fontSize: 18, fontFamily: Fonts.display, color: Colors.text, letterSpacing: -0.3 },
  spacingTop: { marginTop: Spacing.md },
  emptyCard: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: Colors.borderStrong,
    borderRadius: 16,
    padding: Spacing.md,
  },
  emptyInline: { flex: 1, color: Colors.textLight, fontFamily: Fonts.body, fontSize: 13, lineHeight: 19 },
  applicantCard: { marginBottom: 10 },
  applicantHeader: { flexDirection: 'row', alignItems: 'center' },
  applicantName: { flex: 1, fontSize: 14.5, fontFamily: Fonts.bodyBold, color: Colors.text, marginLeft: 10 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  statusText: { fontSize: 11, fontFamily: Fonts.bodyBold },
  applicantMessage: { fontSize: 13.5, fontFamily: Fonts.body, color: Colors.textLight, marginTop: 10, lineHeight: 19 },
  actionRow: { flexDirection: 'row', marginTop: Spacing.md, gap: Spacing.sm },
});
