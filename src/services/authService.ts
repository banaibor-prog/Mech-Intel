import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  GoogleAuthProvider,
  signInWithCredential,
  User,
} from '@firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { auth, db } from '../config/firebase';
import { UserProfile } from '../types/models';

async function ensureUserDocument(user: User) {
  const ref = doc(db, 'users', user.uid);
  const existing = await getDoc(ref);
  if (!existing.exists()) {
    // Firestore rejects `undefined` values, so photoURL is only included when
    // the provider actually supplied one (Google accounts without an avatar
    // return null here).
    const profile: UserProfile = {
      uid: user.uid,
      displayName: user.displayName ?? 'New User',
      email: user.email ?? '',
      isProvider: false,
      createdAt: Date.now(),
      ...(user.photoURL ? { photoURL: user.photoURL } : {}),
    };
    await setDoc(ref, profile);
  }
}

export async function signUpWithEmail(name: string, email: string, password: string) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(cred.user, { displayName: name });
  await ensureUserDocument(cred.user);
  return cred.user;
}

export async function signInWithEmail(email: string, password: string) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  await ensureUserDocument(cred.user);
  return cred.user;
}

export async function signInWithGoogleIdToken(idToken: string) {
  const credential = GoogleAuthProvider.credential(idToken);
  const cred = await signInWithCredential(auth, credential);
  await ensureUserDocument(cred.user);
  return cred.user;
}

export async function signOut() {
  await firebaseSignOut(auth);
  if (GoogleSignin.hasPreviousSignIn()) {
    try {
      await GoogleSignin.signOut();
    } catch (error) {
      console.warn('Google account session could not be cleared', error);
    }
  }
}
