import { useState } from 'react';
import {
  GoogleSignin,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import { EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID } from '@env';
import { signInWithGoogleIdToken } from '../services/authService';

const webClientId = EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

if (webClientId) {
  GoogleSignin.configure({ webClientId });
}

export function useGoogleAuth(onError: (message: string) => void) {
  const [loading, setLoading] = useState(false);

  const signIn = async () => {
    if (!webClientId) {
      onError('Google sign-in needs EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID in .env.');
      return;
    }

    setLoading(true);
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const response = await GoogleSignin.signIn();
      if (!isSuccessResponse(response)) {
        return;
      }

      const idToken = response.data.idToken;
      if (!idToken) {
        throw new Error('Google did not return an ID token. Check the Web OAuth client ID.');
      }
      await signInWithGoogleIdToken(idToken);
    } catch (error) {
      if (isErrorWithCode(error) && error.code === statusCodes.IN_PROGRESS) {
        return;
      }
      if (isErrorWithCode(error) && error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        onError('This emulator needs Google Play services to sign in.');
      } else if (isErrorWithCode(error) && error.code === '10') {
        onError('Google OAuth is not configured for this Android package and signing SHA-1. Check the Firebase Android app and Web client ID.');
      } else {
        onError(error instanceof Error ? error.message : 'Google sign-in failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return { signIn, loading };
}
