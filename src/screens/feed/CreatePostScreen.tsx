import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  Platform,
} from 'react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { PERMISSIONS, RESULTS, check, request } from 'react-native-permissions';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Button from '../../components/Button';
import { Colors } from '../../constants/Colors';
import { Spacing } from '../../constants/Spacing';
import { Fonts } from '../../constants/Typography';
import { createPost } from '../../services/dataService';
import { uploadPostImages } from '../../services/imageService';
import { SKILL_CATEGORIES } from '../../types/models';
import { useAuth } from '../../context/AuthContext';
import { HomeStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<HomeStackParamList, 'CreatePost'>;

interface PickedPhoto {
  uri: string;
  width: number;
  height: number;
}

const MAX_PHOTOS = 6;

export default function CreatePostScreen({ navigation }: Props) {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [skill, setSkill] = useState<string | null>(null);
  const [budget, setBudget] = useState('');
  const [location, setLocation] = useState('');
  const [photos, setPhotos] = useState<PickedPhoto[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);

  const handlePickPhotos = async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      selectionLimit: MAX_PHOTOS - photos.length,
      quality: 0.7,
    });
    if (result.didCancel || !result.assets) return;
    const picked = result.assets
      .filter((a) => a.uri && a.width && a.height)
      .map((a) => ({ uri: a.uri as string, width: a.width as number, height: a.height as number }));
    setPhotos((prev) => [...prev, ...picked].slice(0, MAX_PHOTOS));
  };

  const handleTakePhoto = async () => {
    const cameraPermission = Platform.select({
      android: PERMISSIONS.ANDROID.CAMERA,
      ios: PERMISSIONS.IOS.CAMERA,
    });
    if (cameraPermission) {
      const status = await check(cameraPermission);
      if (status !== RESULTS.GRANTED) {
        const requested = await request(cameraPermission);
        if (requested !== RESULTS.GRANTED) {
          Alert.alert('Permission needed', 'Allow camera access to take a photo for your post.');
          return;
        }
      }
    }
    const result = await launchCamera({ mediaType: 'photo', quality: 0.7 });
    if (result.didCancel || !result.assets || !result.assets[0]) return;
    const a = result.assets[0];
    if (!a.uri || !a.width || !a.height) return;
    setPhotos((prev) => [...prev, { uri: a.uri as string, width: a.width as number, height: a.height as number }].slice(0, MAX_PHOTOS));
  };

  const removePhoto = (uri: string) => {
    setPhotos((prev) => prev.filter((p) => p.uri !== uri));
  };

  const handlePost = async () => {
    if (!user) return;
    if (!title.trim() || !description.trim() || !skill) {
      Alert.alert('Missing info', 'Please add a title, description, and pick a category.');
      return;
    }
    setSubmitting(true);
    try {
      let photoURLs: string[] = [];
      if (photos.length > 0) {
        setUploadingPhotos(true);
        photoURLs = await uploadPostImages(user.uid, photos);
        setUploadingPhotos(false);
      }
      await createPost({
        authorUid: user.uid,
        title: title.trim(),
        description: description.trim(),
        skill,
        ...(budget ? { budget: Number(budget) } : {}),
        ...(location.trim() ? { location: location.trim() } : {}),
        ...(photoURLs.length > 0 ? { photoURLs } : {}),
      });
      Alert.alert('Posted', 'Your job post is live on the feed.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e: any) {
      Alert.alert('Failed to post', e.message ?? 'Please try again.');
    } finally {
      setSubmitting(false);
      setUploadingPhotos(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.label}>Photos</Text>
      <View style={styles.photoRow}>
        {photos.map((photo) => (
          <View key={photo.uri} style={styles.photoThumbWrap}>
            <Image source={{ uri: photo.uri }} style={styles.photoThumb} />
            <TouchableOpacity style={styles.removeBadge} onPress={() => removePhoto(photo.uri)}>
              <Text style={styles.removeBadgeText}>✕</Text>
            </TouchableOpacity>
          </View>
        ))}
        {photos.length < MAX_PHOTOS && (
          <View style={styles.addPhotoGroup}>
            <TouchableOpacity style={styles.addPhotoButton} onPress={handlePickPhotos} activeOpacity={0.7}>
              <Text style={styles.addPhotoIcon}>🖼️</Text>
              <Text style={styles.addPhotoText}>Gallery</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.addPhotoButton} onPress={handleTakePhoto} activeOpacity={0.7}>
              <Text style={styles.addPhotoIcon}>📷</Text>
              <Text style={styles.addPhotoText}>Camera</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <Text style={styles.label}>What do you need help with?</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. Need an electrician today"
        placeholderTextColor={Colors.textMuted}
        value={title}
        onChangeText={setTitle}
      />

      <Text style={styles.label}>Category</Text>
      <View style={styles.chipGrid}>
        {SKILL_CATEGORIES.map((c) => (
          <TouchableOpacity
            key={c}
            style={[styles.chip, skill === c && styles.chipActive]}
            onPress={() => setSkill(c)}
            activeOpacity={0.7}
          >
            <Text style={[styles.chipText, skill === c && styles.chipTextActive]}>{c}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Details</Text>
      <TextInput
        style={styles.textArea}
        placeholder="Describe the job, timing, and anything providers should know..."
        placeholderTextColor={Colors.textMuted}
        multiline
        numberOfLines={5}
        value={description}
        onChangeText={setDescription}
      />

      <View style={styles.row}>
        <View style={styles.halfInput}>
          <Text style={styles.label}>Budget (₹)</Text>
          <TextInput
            style={styles.input}
            placeholder="Optional"
            placeholderTextColor={Colors.textMuted}
            keyboardType="numeric"
            value={budget}
            onChangeText={setBudget}
          />
        </View>
        <View style={styles.halfInput}>
          <Text style={styles.label}>Location</Text>
          <TextInput
            style={styles.input}
            placeholder="Optional"
            placeholderTextColor={Colors.textMuted}
            value={location}
            onChangeText={setLocation}
          />
        </View>
      </View>

      {submitting ? (
        <View style={styles.spacingTop}>
          <ActivityIndicator color={Colors.ink} />
          {uploadingPhotos && <Text style={styles.uploadingText}>Uploading photos...</Text>}
        </View>
      ) : (
        <Button title="Post to Feed" onPress={handlePost} style={styles.spacingTop} />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
    backgroundColor: Colors.background,
    flexGrow: 1,
  },
  label: {
    fontSize: 13,
    fontFamily: Fonts.bodySemibold,
    color: Colors.textLight,
    marginBottom: Spacing.xs,
    marginTop: Spacing.md,
  },
  photoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  photoThumbWrap: {
    width: 84,
    height: 84,
    borderRadius: 14,
    overflow: 'hidden',
  },
  photoThumb: {
    width: '100%',
    height: '100%',
  },
  removeBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBadgeText: {
    color: Colors.white,
    fontSize: 11,
    fontFamily: Fonts.bodyBold,
  },
  addPhotoGroup: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  addPhotoButton: {
    width: 84,
    height: 84,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPhotoIcon: {
    fontSize: 22,
  },
  addPhotoText: {
    fontSize: 11,
    fontFamily: Fonts.bodyMedium,
    color: Colors.textLight,
    marginTop: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 4,
    fontSize: 15,
    fontFamily: Fonts.body,
    color: Colors.text,
  },
  textArea: {
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: Spacing.md,
    fontSize: 14,
    fontFamily: Fonts.body,
    minHeight: 110,
    textAlignVertical: 'top',
    color: Colors.text,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: 20,
    backgroundColor: Colors.surfaceAlt,
  },
  chipActive: {
    backgroundColor: Colors.ink,
  },
  chipText: {
    color: Colors.text,
    fontSize: 13,
    fontFamily: Fonts.bodySemibold,
  },
  chipTextActive: {
    color: Colors.white,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  halfInput: {
    flex: 1,
  },
  spacingTop: {
    marginTop: Spacing.xl,
    alignItems: 'center',
  },
  uploadingText: {
    fontSize: 13,
    fontFamily: Fonts.bodyMedium,
    color: Colors.textLight,
    marginTop: Spacing.xs,
  },
});
