import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import ImageResizer from '@bam.tech/react-native-image-resizer';
import { storage } from '../config/firebase';

export interface UploadableImage {
  uri: string;
  width: number;
  height: number;
}

// Caps upload size/bandwidth per photo — plenty for a full-screen feed card
// while keeping Storage costs and transfer time bounded as post volume grows.
const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 70;

async function resizeForUpload(image: UploadableImage): Promise<string> {
  const alreadySmall = Math.max(image.width, image.height) <= MAX_DIMENSION;
  if (alreadySmall) {
    return image.uri;
  }

  const isPortrait = image.height >= image.width;
  const scale = MAX_DIMENSION / Math.max(image.width, image.height);
  const targetWidth = isPortrait ? Math.round(image.width * scale) : MAX_DIMENSION;
  const targetHeight = isPortrait ? MAX_DIMENSION : Math.round(image.height * scale);

  const resized = await ImageResizer.createResizedImage(
    image.uri,
    targetWidth,
    targetHeight,
    'JPEG',
    JPEG_QUALITY
  );
  return resized.uri;
}

export async function uploadPostImage(uid: string, image: UploadableImage): Promise<string> {
  const resizedUri = await resizeForUpload(image);
  const response = await fetch(resizedUri);
  const blob = await response.blob();
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
  const storageRef = ref(storage, `posts/${uid}/${filename}`);
  await uploadBytes(storageRef, blob);
  return getDownloadURL(storageRef);
}

export async function uploadPostImages(uid: string, images: UploadableImage[]): Promise<string[]> {
  return Promise.all(images.map((image) => uploadPostImage(uid, image)));
}

export async function uploadProfileImage(uid: string, image: UploadableImage): Promise<string> {
  const resizedUri = await resizeForUpload(image);
  const response = await fetch(resizedUri);
  const blob = await response.blob();
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
  const storageRef = ref(storage, `profiles/${uid}/${filename}`);
  await uploadBytes(storageRef, blob);
  return getDownloadURL(storageRef);
}
