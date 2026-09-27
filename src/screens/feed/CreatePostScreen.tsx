import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  Platform,
} from 'react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { PERMISSIONS, RESULTS, check, request } from 'react-native-permissions';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Button from '../../components/Button';
import AppIcon from '../../components/AppIcon';
import Card from '../../components/ui/Card';
import Chip from '../../components/ui/Chip';
import TextField from '../../components/ui/TextField';
import KhasiWeave from '../../components/brand/KhasiWeave';
import { Colors } from '../../constants/Colors';
import { Spacing } from '../../constants/Spacing';
import { Fonts } from '../../constants/Typography';
import { categoryStyle } from '../../constants/Categories';
import { createPost } from '../../services/dataService';
import { uploadPostImages } from '../../services/imageService';
import { approximate, getCurrentCoords } from '../../services/locationService';
import { zoneForPoint } from '../../data/meghalayaZones';
import { GeoPoint, SKILL_CATEGORIES } from '../../types/models';
import { useAuth } from '../../context/AuthContext';
import { HomeStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<HomeStackParamList, 'CreatePost'>;

interface PickedPhoto {
  uri: string;
  width: number;
  height: number;
}

type LocationState = { status: 'locating' } | { status: 'found'; coords: GeoPoint; place?: string } | { status: 'failed' };

const MAX_PHOTOS = 6;

export default function CreatePostScreen({ navigation }: Props) {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [skill, setSkill] = useState<string | null>(null);
  const [budget, setBudget] = useState('');
  const [locationLabel, setLocationLabel] = useState('');
  const [where, setWhere] = useState<LocationState>({ status: 'locating' });
  const [photos, setPhotos] = useState<PickedPhoto[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);

  const locate = useCallback(async () => {
    setWhere({ status: 'locating' });
    const coords = await getCurrentCoords();
    if (!coords) {
      setWhere({ status: 'failed' });
      return;
    }
    const point = approximate(coords);
    const zone = zoneForPoint(point);
    const place = zone ? `${zone.name}, ${zone.area}` : undefined;
    setWhere({ status: 'found', coords: point, place });
    if (place) setLocationLabel((current) => current || place);
  }, []);

  useEffect(() => {
    locate();
  }, [locate]);

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
    if (where.status !== 'found') {
      Alert.alert(
        'Location needed',
        'Jobs are shown on the Explore map so nearby providers can find them. Turn on location and try again.',
        [{ text: 'Try again', onPress: locate }, { text: 'Cancel', style: 'cancel' }],
      );
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
        coords: where.coords,
        ...(budget ? { budget: Number(budget) } : {}),
        ...(locationLabel.trim() ? { location: locationLabel.trim() } : {}),
        ...(photoURLs.length > 0 ? { photoURLs } : {}),
      });
      Alert.alert('Posted', 'Your job is live on the feed and the Explore map.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e: any) {
      Alert.alert('Failed to post', e.message ?? 'Please try again.');
    } finally {
      setSubmitting(false);
      setUploadingPhotos(false);
    }
  };

  const selected = skill ? categoryStyle(skill) : null;

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.intro}>Tell nearby pros what you need. Your job appears on the feed and on the Explore map.</Text>
      <KhasiWeave height={10} opacity={0.35} style={styles.weave} />

      <Card style={styles.section}>
        <TextField label="What do you need help with?" placeholder="e.g. Need an electrician today" value={title} onChangeText={setTitle} />
        <Text style={[styles.label, styles.gapTop]}>Category</Text>
        <View style={styles.chipGrid}>
          {SKILL_CATEGORIES.map((c) => {
            const cat = categoryStyle(c);
            return <Chip key={c} label={c} icon={cat.icon} color={cat.color} active={skill === c} onPress={() => setSkill(c)} />;
          })}
        </View>
        <TextField
          label="Details"
          containerStyle={styles.gapTop}
          placeholder="Describe the job, timing, and anything providers should know..."
          multiline
          numberOfLines={5}
          value={description}
          onChangeText={setDescription}
        />
        <TextField
          label="Budget (₹)"
          containerStyle={styles.gapTop}
          placeholder="Optional"
          keyboardType="numeric"
          value={budget}
          onChangeText={setBudget}
        />
      </Card>

      <Card style={styles.section} accent={selected?.color ?? Colors.accent}>
        <View style={styles.locationRow}>
          <View style={[styles.pinBadge, { backgroundColor: selected?.soft ?? Colors.accentSoft }]}>
            <AppIcon name="location" size={20} color={selected?.color ?? Colors.accent} />
          </View>
          <View style={styles.flex}>
            <Text style={styles.locationTitle}>
              {where.status === 'locating'
                ? 'Finding your location…'
                : where.status === 'failed'
                  ? 'Location is off'
                  : where.place
                    ? `Pinned near ${where.place}`
                    : 'Pinned to your current location'}
            </Text>
            <Text style={styles.locationSub}>
              {where.status === 'failed'
                ? 'Needed so providers nearby can find this job on the map.'
                : 'Only an approximate spot (~100 m) is shown, never your exact address.'}
            </Text>
          </View>
          {where.status !== 'locating' ? (
            <TouchableOpacity onPress={locate} hitSlop={10}>
              <Text style={styles.retry}>{where.status === 'failed' ? 'Retry' : 'Refresh'}</Text>
            </TouchableOpacity>
          ) : null}
        </View>
        <TextField
          label="Area name (shown on the post)"
          containerStyle={styles.gapTop}
          placeholder="e.g. Laitumkhrah, Shillong"
          value={locationLabel}
          onChangeText={setLocationLabel}
        />
      </Card>

      <Card style={styles.section}>
        <Text style={styles.label}>Photos</Text>
        <View style={styles.photoRow}>
          {photos.map((photo) => (
            <View key={photo.uri} style={styles.photoThumbWrap}>
              <Image source={{ uri: photo.uri }} style={styles.photoThumb} />
              <TouchableOpacity style={styles.removeBadge} onPress={() => removePhoto(photo.uri)}>
                <AppIcon name="close" size={12} color={Colors.white} />
              </TouchableOpacity>
            </View>
          ))}
          {photos.length < MAX_PHOTOS && (
            <>
              <TouchableOpacity style={styles.addPhotoButton} onPress={handlePickPhotos} activeOpacity={0.7}>
                <AppIcon name="layers" size={22} color={Colors.accent} />
                <Text style={styles.addPhotoText}>Gallery</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.addPhotoButton} onPress={handleTakePhoto} activeOpacity={0.7}>
                <AppIcon name="camera" size={22} color={Colors.accent} />
                <Text style={styles.addPhotoText}>Camera</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </Card>

      <Button
        title={uploadingPhotos ? 'Uploading photos…' : 'Post job'}
        icon="arrowRight"
        onPress={handlePost}
        loading={submitting && !uploadingPhotos}
        disabled={submitting}
        style={styles.submit}
      />
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
  intro: { fontFamily: Fonts.body, fontSize: 14, lineHeight: 20, color: Colors.textLight },
  weave: { marginTop: Spacing.sm, marginBottom: Spacing.xs },
  section: { marginTop: Spacing.md },
  flex: { flex: 1 },
  label: {
    fontSize: 13,
    fontFamily: Fonts.bodySemibold,
    color: Colors.textLight,
    marginBottom: 8,
  },
  gapTop: { marginTop: Spacing.md },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  locationRow: { flexDirection: 'row', alignItems: 'center' },
  pinBadge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  locationTitle: { fontFamily: Fonts.bodyBold, fontSize: 14.5, color: Colors.text },
  locationSub: { fontFamily: Fonts.body, fontSize: 12, lineHeight: 17, color: Colors.textLight, marginTop: 2 },
  retry: { fontFamily: Fonts.bodySemibold, fontSize: 13, color: Colors.accent, marginLeft: 8 },
  photoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  photoThumbWrap: { width: 84, height: 84, borderRadius: 14, overflow: 'hidden' },
  photoThumb: { width: '100%', height: '100%' },
  removeBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(15,23,42,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPhotoButton: {
    width: 84,
    height: 84,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.accentSoft,
    borderStyle: 'dashed',
    backgroundColor: '#F7FAFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPhotoText: { fontSize: 11.5, fontFamily: Fonts.bodyMedium, color: Colors.textLight, marginTop: 5 },
  submit: { marginTop: Spacing.xl },
});
