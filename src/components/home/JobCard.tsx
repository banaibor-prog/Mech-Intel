import React, { useEffect, useRef } from 'react';
import { Animated, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Avatar from '../Avatar';
import AppIcon from '../AppIcon';
import { TrustBadge } from './MarketplaceBadges';
import { FeedPost } from '../../services/dataService';
import { Colors } from '../../constants/Colors';
import { Fonts } from '../../constants/Typography';
import { Spacing } from '../../constants/Spacing';

function timeAgo(timestamp: number): string {
  const minutes = Math.max(1, Math.floor((Date.now() - timestamp) / 60000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function isUrgent(post: FeedPost): boolean {
  return /urgent|today|immediately|asap|emergency/i.test(`${post.title} ${post.description}`);
}

interface Props {
  post: FeedPost;
  saved: boolean;
  onSave: () => void;
  onOpen: () => void;
  onApply: () => void;
  onAuthor: () => void;
}

export default function JobCard({ post, saved, onSave, onOpen, onApply, onAuthor }: Props) {
  const saveScale = useRef(new Animated.Value(1)).current;
  const urgent = isUrgent(post);
  useEffect(() => {
    if (!saved) return;
    Animated.sequence([
      Animated.spring(saveScale, { toValue: 1.16, useNativeDriver: true, speed: 40, bounciness: 7 }),
      Animated.spring(saveScale, { toValue: 1, useNativeDriver: true, speed: 35 }),
    ]).start();
  }, [saved, saveScale]);

  return (
    <View style={styles.card}>
      <View style={styles.authorRow}>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel={`Open ${post.authorName}'s profile`} style={styles.authorButton} onPress={onAuthor}>
          <Avatar name={post.authorName} photoURL={post.authorPhotoURL} size={42} />
          <View style={styles.authorCopy}>
            <Text style={styles.authorName} numberOfLines={1}>{post.authorName}</Text>
            <View style={styles.authorMeta}><TrustBadge score={post.authorTrustScore} /><Text style={styles.response}>{post.authorResponseBoost === 'fast' ? 'Fast responder' : 'Marketplace member'}</Text></View>
          </View>
        </TouchableOpacity>
        <Animated.View style={{ transform: [{ scale: saveScale }] }}>
          <TouchableOpacity accessibilityRole="button" accessibilityLabel={saved ? 'Remove saved job' : 'Save job'} style={styles.saveButton} onPress={onSave}>
            <AppIcon name="bookmark" size={21} color={saved ? Colors.accent : Colors.textLight} filled={saved} />
          </TouchableOpacity>
        </Animated.View>
      </View>

      <TouchableOpacity accessibilityRole="button" onPress={onOpen} activeOpacity={0.82}>
        <Text style={styles.title}>{post.title}</Text>
        <View style={styles.chips}>
          {urgent ? <View style={styles.urgentChip}><AppIcon name="bolt" size={12} color={Colors.warning} filled /><Text style={styles.urgentText}>Needed today</Text></View> : null}
          <View style={styles.chip}><Text style={styles.chipText}>{post.skill}</Text></View>
          <View style={styles.chip}><Text style={styles.chipText}>One-time</Text></View>
        </View>
        <View style={styles.previewRow}>
          <Text style={styles.description} numberOfLines={3}>{post.description}</Text>
          {post.photoURLs?.[0] ? <Image source={{ uri: post.photoURLs[0] }} style={styles.thumbnail} resizeMode="cover" /> : null}
        </View>
      </TouchableOpacity>

      <View style={styles.metaRows}>
        {post.location ? <View style={styles.meta}><AppIcon name="location" size={15} color={Colors.textMuted} /><Text style={styles.metaText} numberOfLines={1}>{post.location.split(',')[0]} · Nearby</Text></View> : null}
        <View style={styles.meta}><AppIcon name="clock" size={15} color={Colors.textMuted} /><Text style={styles.metaText}>Posted {timeAgo(post.createdAt)}</Text></View>
      </View>

      <View style={styles.priceRow}>
        <View><Text style={styles.priceLabel}>Budget</Text><Text style={styles.price}>{post.budget ? `\u20B9${post.budget.toLocaleString('en-IN')} fixed` : 'Quote requested'}</Text></View>
        <View style={styles.activity}><Text style={styles.activityText}>{post.likeCount} saved</Text><View style={styles.activityDot} /><Text style={styles.activityText}>{post.applicantCount} applicants</Text></View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity accessibilityRole="button" style={styles.secondaryAction} onPress={onOpen}><Text style={styles.secondaryActionText}>View details</Text></TouchableOpacity>
        <TouchableOpacity accessibilityRole="button" style={styles.primaryAction} onPress={onApply}><Text style={styles.primaryActionText}>{urgent ? 'Respond' : 'Apply'}</Text><AppIcon name="arrowRight" size={16} color={Colors.white} /></TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { marginHorizontal: Spacing.md, marginBottom: 12, backgroundColor: Colors.surface, borderRadius: 18, borderWidth: 1, borderColor: Colors.border, padding: Spacing.md },
  authorRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  authorButton: { flex: 1, minWidth: 0, minHeight: 48, flexDirection: 'row', alignItems: 'center' },
  authorCopy: { flex: 1, minWidth: 0, marginLeft: 10 },
  authorName: { color: Colors.text, fontFamily: Fonts.bodyBold, fontSize: 14 },
  authorMeta: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 4 },
  response: { flexShrink: 1, color: Colors.textMuted, fontFamily: Fonts.bodyMedium, fontSize: 10.5 },
  saveButton: { width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  title: { color: Colors.text, fontFamily: Fonts.displaySemibold, fontSize: 19, lineHeight: 25, marginTop: 13 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  chip: { height: 25, borderRadius: 8, backgroundColor: Colors.surfaceAlt, paddingHorizontal: 8, justifyContent: 'center' },
  chipText: { color: Colors.textLight, fontFamily: Fonts.bodySemibold, fontSize: 10.5 },
  urgentChip: { height: 25, borderRadius: 8, backgroundColor: Colors.warningSoft, paddingHorizontal: 7, flexDirection: 'row', alignItems: 'center', gap: 3 },
  urgentText: { color: Colors.warning, fontFamily: Fonts.bodyBold, fontSize: 10.5 },
  previewRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 11, marginTop: 11 },
  description: { flex: 1, color: Colors.textLight, fontFamily: Fonts.body, fontSize: 14, lineHeight: 20 },
  thumbnail: { width: 76, height: 76, borderRadius: 12, backgroundColor: Colors.surfaceAlt },
  metaRows: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 13 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 5, maxWidth: '65%' },
  metaText: { color: Colors.textLight, fontFamily: Fonts.bodyMedium, fontSize: 11.5 },
  priceRow: { minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, borderTopWidth: 1, borderTopColor: Colors.border, marginTop: 14, paddingTop: 12 },
  priceLabel: { color: Colors.textMuted, fontFamily: Fonts.bodyMedium, fontSize: 10 },
  price: { color: Colors.text, fontFamily: Fonts.bodyBold, fontSize: 15, marginTop: 2 },
  activity: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  activityText: { color: Colors.textMuted, fontFamily: Fonts.bodyMedium, fontSize: 10.5 },
  activityDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: Colors.textMuted },
  actions: { flexDirection: 'row', gap: 9, marginTop: 13 },
  secondaryAction: { flex: 1, minHeight: 44, borderRadius: 12, borderWidth: 1, borderColor: Colors.borderStrong, alignItems: 'center', justifyContent: 'center' },
  primaryAction: { flex: 1, minHeight: 44, borderRadius: 12, backgroundColor: Colors.accent, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  secondaryActionText: { color: Colors.text, fontFamily: Fonts.bodyBold, fontSize: 13 },
  primaryActionText: { color: Colors.white, fontFamily: Fonts.bodyBold, fontSize: 13 },
});
