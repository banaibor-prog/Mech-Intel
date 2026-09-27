import { useEffect } from 'react';
import { AppState } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { recordUserLocation } from '../services/locationService';

/** Records the signed-in user's approximate location on launch and whenever the app returns to the foreground. */
export function useLocationRecorder() {
  const { user, profile } = useAuth();
  const uid = user?.uid;
  const isProvider = !!profile?.isProvider;

  useEffect(() => {
    if (!uid) return;
    const record = () => {
      recordUserLocation(uid, isProvider).catch((error) => console.warn('Location not recorded', error));
    };
    record();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') record();
    });
    return () => sub.remove();
  }, [uid, isProvider]);
}
