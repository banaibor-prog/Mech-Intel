import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  Alert,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import Button from '../../components/Button';
import Avatar from '../../components/Avatar';
import { Colors } from '../../constants/Colors';
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

const STATUS_STYLES: Record<BookingStatus, { bg: string; fg: string }> = {
  pending: { bg: '#FBF0DF', fg: Colors.warning },
  accepted: { bg: '#E3F5EA', fg: Colors.success },
  declined: { bg: '#FBE8E7', fg: Colors.error },
  cancelled: { bg: Colors.surfaceAlt, fg: Colors.textMuted },
  completed: { bg: Colors.accentSoft, fg: Colors.accent },
};

export default function PostDetailScreen({ route, navigation }: Props) {
  const { postId } = route.params;
  const { user } = useAuth();
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
    return <ActivityIndicator style={styles.loader} color={Colors.ink} />;
  }

  if (!post) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>This post is no longer available.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity
        style={styles.headerRow}
        activeOpacity={0.8}
        onPress={() => navigation.navigate('PublicProfile', { uid: post.authorUid })}
      >
        <Avatar name={post.authorName} photoURL={post.authorPhotoURL} size={44} />
        <View style={styles.headerText}>
          <Text style={styles.authorName}>{post.authorName}</Text>
          <View style={styles.skillTag}>
            <Text style={styles.skillTagText}>{post.skill}</Text>
          </View>
        </View>
        <View style={styles.trustPill}>
          <Text style={styles.trustPillText}>Trust {post.authorTrustScore}</Text>
        </View>
      </TouchableOpacity>

      <Text style={styles.title}>{post.title}</Text>
      <Text style={styles.description}>{post.description}</Text>

      <View style={styles.statsRow}>
        {post.budget ? (
          <View style={styles.statPill}>
            <Text style={styles.statValue}>₹{post.budget}</Text>
            <Text style={styles.statLabel}>budget</Text>
          </View>
        ) : null}
        {post.location ? (
          <View style={styles.statPill}>
            <Text style={styles.statValue}>📍</Text>
            <Text style={styles.statLabel} numberOfLines={1}>
              {post.location}
            </Text>
          </View>
        ) : null}
        <View style={styles.statPill}>
          <Text style={styles.statValue}>{post.applicantCount}</Text>
          <Text style={styles.statLabel}>applied</Text>
        </View>
      </View>

      {isOwner ? (
        <>
          <Text style={styles.sectionTitle}>Applicants</Text>
          {applicants.length === 0 ? (
            <Text style={styles.emptyInline}>No applicants yet.</Text>
          ) : (
            applicants.map((a) => {
              const statusStyle = STATUS_STYLES[a.status];
              return (
                <View key={a.id} style={styles.applicantCard}>
                  <TouchableOpacity
                    style={styles.applicantHeader}
                    activeOpacity={0.8}
                    onPress={() => navigation.navigate('PublicProfile', { uid: a.applicantUid })}
                  >
                    <Avatar name={a.applicantName} photoURL={a.applicantPhotoURL} size={36} />
                    <Text style={styles.applicantName}>{a.applicantName}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                      <Text style={[styles.statusText, { color: statusStyle.fg }]}>
                        {a.status.toUpperCase()}
                      </Text>
                    </View>
                  </TouchableOpacity>
                  <Text style={styles.applicantMessage}>{a.message}</Text>
                  {a.status === 'pending' && (
                    <View style={styles.actionRow}>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.declineButton]}
                        onPress={() => handleRespond(a.id, 'declined')}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.declineText}>Decline</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.acceptButton]}
                        onPress={() => handleRespond(a.id, 'accepted')}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.acceptText}>Accept</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })
          )}
        </>
      ) : (
        <>
          <Text style={styles.sectionTitle}>Apply for this job</Text>
          <TextInput
            style={styles.input}
            placeholder="Introduce yourself and why you're a good fit..."
            placeholderTextColor={Colors.textMuted}
            multiline
            numberOfLines={4}
            value={message}
            onChangeText={setMessage}
          />
          {submitting ? (
            <ActivityIndicator color={Colors.ink} style={styles.spacingTop} />
          ) : (
            <Button title="Apply" onPress={handleApply} style={styles.spacingTop} />
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl + 80,
    backgroundColor: Colors.background,
    flexGrow: 1,
  },
  loader: {
    flex: 1,
    marginTop: Spacing.xxl,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    marginLeft: Spacing.sm + 2,
    flex: 1,
    flexShrink: 1,
  },
  authorName: {
    fontSize: 15,
    fontFamily: Fonts.bodyBold,
    color: Colors.text,
  },
  skillTag: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.accentSoft,
    borderRadius: 6,
    paddingHorizontal: Spacing.xs + 2,
    paddingVertical: 2,
    marginTop: 4,
  },
  skillTagText: {
    fontSize: 12,
    fontFamily: Fonts.bodySemibold,
    color: Colors.accent,
  },
  trustPill: {
    backgroundColor: Colors.successSoft,
    borderRadius: 12,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
    marginLeft: Spacing.sm,
  },
  trustPillText: {
    fontSize: 11,
    fontFamily: Fonts.bodyBold,
    color: Colors.success,
  },
  title: {
    fontSize: 22,
    fontFamily: Fonts.display,
    color: Colors.text,
    marginTop: Spacing.lg,
  },
  description: {
    fontSize: 15,
    fontFamily: Fonts.body,
    color: Colors.textLight,
    marginTop: Spacing.xs,
    lineHeight: 22,
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  statPill: {
    flex: 1,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 14,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 15,
    fontFamily: Fonts.displaySemibold,
    color: Colors.text,
  },
  statLabel: {
    fontSize: 11,
    fontFamily: Fonts.bodyMedium,
    color: Colors.textLight,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: Fonts.display,
    color: Colors.text,
    marginTop: Spacing.xl,
    marginBottom: Spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: Spacing.md,
    fontSize: 14,
    fontFamily: Fonts.body,
    minHeight: 100,
    textAlignVertical: 'top',
    color: Colors.text,
  },
  spacingTop: {
    marginTop: Spacing.md,
  },
  emptyText: {
    textAlign: 'center',
    color: Colors.textLight,
    fontFamily: Fonts.body,
    marginTop: Spacing.xxl,
  },
  emptyInline: {
    color: Colors.textLight,
    fontFamily: Fonts.body,
    fontSize: 14,
  },
  applicantCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    shadowColor: Colors.black,
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  applicantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  applicantName: {
    flex: 1,
    fontSize: 14,
    fontFamily: Fonts.bodyBold,
    color: Colors.text,
    marginLeft: Spacing.xs + 2,
  },
  statusBadge: {
    paddingHorizontal: Spacing.xs + 2,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontFamily: Fonts.bodyBold,
  },
  applicantMessage: {
    fontSize: 13,
    fontFamily: Fonts.body,
    color: Colors.textLight,
    marginTop: Spacing.xs + 2,
    lineHeight: 19,
  },
  actionRow: {
    flexDirection: 'row',
    marginTop: Spacing.sm,
    gap: Spacing.sm,
  },
  actionButton: {
    flex: 1,
    paddingVertical: Spacing.xs + 4,
    borderRadius: 10,
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: Colors.ink,
  },
  declineButton: {
    backgroundColor: Colors.surfaceAlt,
  },
  acceptText: {
    color: Colors.white,
    fontFamily: Fonts.bodyBold,
    fontSize: 13,
  },
  declineText: {
    color: Colors.error,
    fontFamily: Fonts.bodyBold,
    fontSize: 13,
  },
});
