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

  const place = post.location?.split(',')[0];
  const photos = post.photoURLs ?? [];
  return (
    <View style={styles.card}>
      <TouchableOpacity accessibilityRole="button" onPress={onOpen} activeOpacity={0.88}>
        <View style={styles.header}>
          <View style={[styles.catIcon, { backgroundColor: cat.soft }]}>
            <AppIcon name={cat.icon} size={18} color={cat.color} />
          </View>
          <View style={styles.flex}>
            <Text style={[styles.catText, { color: cat.color }]}>{post.skill}</Text>
            <Text style={styles.posted}>
              {timeAgo(post.createdAt)}
              {place ? ` · ${place}` : ''}
            </Text>
          </View>
          {urgent ? (
            <View style={styles.urgentChip}>
              <AppIcon name="fire" size={12} color="#E11D48" filled />
              <Text style={styles.urgentText}>Today</Text>
            </View>
          ) : null}
          <Animated.View style={{ transform: [{ scale: saveScale }] }}>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={saved ? 'Remove saved job' : 'Save job'}
              style={styles.saveButton}
              onPress={onSave}
              hitSlop={6}>
              <AppIcon name="bookmark" size={17} color={saved ? Colors.accent : Colors.textMuted} filled={saved} />
            </TouchableOpacity>
          </Animated.View>
        </View>

        <Text style={styles.title}>{post.title}</Text>
        <Text style={styles.description} numberOfLines={2}>
          {post.description}
        </Text>

        {photos.length ? (
          <View style={styles.photoRow}>
            {photos.slice(0, 3).map((uri, i) => (
              <View key={uri} style={styles.photoWrap}>
                <Image source={{ uri }} style={styles.photo} resizeMode="cover" />
                {i === 2 && photos.length > 3 ? (
                  <View style={styles.photoMore}>
                    <Text style={styles.photoMoreText}>+{photos.length - 3}</Text>
                  </View>
                ) : null}
              </View>
            ))}
          </View>
        ) : null}
      </TouchableOpacity>

      <View style={styles.infoRow}>
        <View>
          <Text style={styles.budgetValue}>{post.budget ? `₹${post.budget.toLocaleString('en-IN')}` : 'Open quote'}</Text>
          <Text style={styles.budgetLabel}>budget</Text>
        </View>
        <View style={styles.infoDivider} />
        <View>
          <Text style={styles.infoValue}>{post.applicantCount}</Text>
          <Text style={styles.budgetLabel}>applied</Text>
        </View>
        <View style={styles.flex} />
        <Button title={urgent ? 'Respond' : 'Apply'} size="sm" icon="arrowRight" onPress={onApply} style={styles.apply} />
      </View>

      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={`Open ${post.authorName}'s profile`}
        style={styles.authorRow}
        onPress={onAuthor}
        activeOpacity={0.8}>
        <Avatar name={post.authorName} photoURL={post.authorPhotoURL} size={26} />
        <Text style={styles.authorName} numberOfLines={1}>
          {post.authorName}
        </Text>
        <TrustBadge score={post.authorTrustScore} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  card: {
    marginHorizontal: Spacing.md,
    marginBottom: 14,
    backgroundColor: Colors.surface,
    borderRadius: 26,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EDF1F7',
    shadowColor: '#1E3A8A',
    shadowOpacity: 0.07,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  catIcon: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  catText: { fontFamily: Fonts.bodyBold, fontSize: 12.5 },
  posted: { color: Colors.textMuted, fontFamily: Fonts.bodyMedium, fontSize: 11.5, marginTop: 1 },
  urgentChip: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#FFE4E6', borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5 },
  urgentText: { color: '#E11D48', fontFamily: Fonts.bodyBold, fontSize: 11 },
  saveButton: { width: 34, height: 34, borderRadius: 12, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' },
  title: { color: Colors.text, fontFamily: Fonts.display, fontSize: 18, lineHeight: 24, letterSpacing: -0.3, marginTop: 14 },
  description: { color: Colors.textLight, fontFamily: Fonts.body, fontSize: 13.5, lineHeight: 20, marginTop: 5 },
  photoRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  photoWrap: { flex: 1, maxWidth: '33%', aspectRatio: 1.25, borderRadius: 16, overflow: 'hidden', backgroundColor: Colors.surfaceAlt },
  photo: { width: '100%', height: '100%' },
  photoMore: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(5,10,31,0.55)', alignItems: 'center', justifyContent: 'center' },
  photoMoreText: { color: Colors.white, fontFamily: Fonts.display, fontSize: 18 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginTop: 14 },
  budgetValue: { color: Colors.text, fontFamily: Fonts.display, fontSize: 19, letterSpacing: -0.3 },
  budgetLabel: { color: Colors.textMuted, fontFamily: Fonts.bodyMedium, fontSize: 11 },
  infoDivider: { width: 1, height: 28, backgroundColor: Colors.border, marginHorizontal: 14 },
  infoValue: { color: Colors.text, fontFamily: Fonts.display, fontSize: 19 },
  apply: { minWidth: 108, borderRadius: 14 },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#EEF2F7',
  },
  authorName: { flex: 1, color: Colors.textLight, fontFamily: Fonts.bodySemibold, fontSize: 12.5 },
});
