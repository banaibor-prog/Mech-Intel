import React, { useEffect, useRef } from 'react';
import { Animated, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Avatar from '../Avatar';
import AppIcon from '../AppIcon';
import Button from '../Button';
import { TrustBadge } from './MarketplaceBadges';
import { FeedPost } from '../../services/dataService';
import { categoryStyle } from '../../constants/Categories';
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
  const cat = categoryStyle(post.skill);
  useEffect(() => {
    if (!saved) return;
    Animated.sequence([
      Animated.spring(saveScale, { toValue: 1.16, useNativeDriver: true, speed: 40, bounciness: 7 }),
      Animated.spring(saveScale, { toValue: 1, useNativeDriver: true, speed: 35 }),
    ]).start();
  }, [saved, saveScale]);

  return (
    <View style={styles.card}>
      <View style={[styles.band, { backgroundColor: cat.soft }]}>
        <View style={[styles.catIcon, { backgroundColor: cat.color }]}>
          <AppIcon name={cat.icon} size={14} color={Colors.white} />
        </View>
        <Text style={[styles.catText, { color: cat.color }]}>{post.skill}</Text>
        {urgent ? (
          <View style={styles.urgentChip}>
            <AppIcon name="fire" size={12} color={Colors.error} filled />
            <Text style={styles.urgentText}>Needed today</Text>
          </View>
        ) : null}
        <View style={styles.flex} />
        <Text style={styles.posted}>{timeAgo(post.createdAt)}</Text>
      </View>

      <View style={styles.body}>
        <TouchableOpacity accessibilityRole="button" onPress={onOpen} activeOpacity={0.82}>
          <View style={styles.previewRow}>
            <View style={styles.flex}>
              <Text style={styles.title}>{post.title}</Text>
              <Text style={styles.description} numberOfLines={2}>
                {post.description}
              </Text>
            </View>
            {post.photoURLs?.[0] ? <Image source={{ uri: post.photoURLs[0] }} style={styles.thumbnail} resizeMode="cover" /> : null}
          </View>
        </TouchableOpacity>

        <View style={styles.infoRow}>
          <View style={styles.budget}>
            <Text style={styles.budgetLabel}>BUDGET</Text>
            <Text style={styles.budgetValue}>{post.budget ? `₹${post.budget.toLocaleString('en-IN')}` : 'Quote'}</Text>
          </View>
          {post.location ? (
            <View style={styles.meta}>
              <AppIcon name="location" size={14} color={Colors.textMuted} />
              <Text style={styles.metaText} numberOfLines={1}>
                {post.location.split(',')[0]}
              </Text>
            </View>
          ) : null}
          <Text style={styles.activityText}>{post.applicantCount} applied</Text>
        </View>

        <View style={styles.authorRow}>
          <TouchableOpacity accessibilityRole="button" accessibilityLabel={`Open ${post.authorName}'s profile`} style={styles.authorButton} onPress={onAuthor}>
            <Avatar name={post.authorName} photoURL={post.authorPhotoURL} size={34} />
            <View style={styles.authorCopy}>
              <Text style={styles.authorName} numberOfLines={1}>
                {post.authorName}
              </Text>
              <TrustBadge score={post.authorTrustScore} />
            </View>
          </TouchableOpacity>
          <Animated.View style={{ transform: [{ scale: saveScale }] }}>
            <TouchableOpacity accessibilityRole="button" accessibilityLabel={saved ? 'Remove saved job' : 'Save job'} style={styles.saveButton} onPress={onSave}>
              <AppIcon name="bookmark" size={19} color={saved ? Colors.accent : Colors.textLight} filled={saved} />
            </TouchableOpacity>
          </Animated.View>
          <Button title={urgent ? 'Respond' : 'Apply'} size="sm" icon="arrowRight" onPress={onApply} style={styles.apply} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  card: {
    marginHorizontal: Spacing.md,
    marginBottom: 14,
    backgroundColor: Colors.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    shadowColor: '#1E3A8A',
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  band: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 14, paddingVertical: 9 },
  catIcon: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  catText: { fontFamily: Fonts.bodyBold, fontSize: 12.5 },
  urgentChip: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: Colors.surface, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  urgentText: { color: Colors.error, fontFamily: Fonts.bodyBold, fontSize: 10.5 },
  posted: { color: Colors.textLight, fontFamily: Fonts.bodyMedium, fontSize: 11 },
  body: { padding: 14, paddingTop: 12 },
  previewRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  title: { color: Colors.text, fontFamily: Fonts.display, fontSize: 18, lineHeight: 24, letterSpacing: -0.2 },
  description: { color: Colors.textLight, fontFamily: Fonts.body, fontSize: 13.5, lineHeight: 19, marginTop: 5 },
  thumbnail: { width: 74, height: 74, borderRadius: 16, backgroundColor: Colors.surfaceAlt },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12 },
  budget: { backgroundColor: Colors.surfaceAlt, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6 },
  budgetLabel: { color: Colors.textMuted, fontFamily: Fonts.bodyBold, fontSize: 8.5, letterSpacing: 1.2 },
  budgetValue: { color: Colors.text, fontFamily: Fonts.display, fontSize: 15 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 1 },
  metaText: { color: Colors.textLight, fontFamily: Fonts.bodyMedium, fontSize: 12 },
  activityText: { color: Colors.textMuted, fontFamily: Fonts.bodyMedium, fontSize: 11.5, marginLeft: 'auto' },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.border },
  authorButton: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center' },
  authorCopy: { flex: 1, minWidth: 0, marginLeft: 9, gap: 3, alignItems: 'flex-start' },
  authorName: { color: Colors.text, fontFamily: Fonts.bodyBold, fontSize: 13 },
  saveButton: { width: 40, height: 40, borderRadius: 14, backgroundColor: Colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  apply: { minWidth: 104 },
});
