import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';
import { AppMode } from '../types/models';

// Home's own feed (FeedTabs + a mixed jobs/providers list) covers hiring vs.
// working without a hard switch, so this context is intentionally lightweight
// now — its one live consumer is ExploreScreen, which uses `mode` to pick a
// sensible initial Providers/Jobs segment while still letting the user flip
// it from the segmented control on screen.
const STORAGE_KEY = 'gyc:mode';

interface ModeContextValue {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  toggleMode: () => void;
  /** False until the persisted choice has been read, so callers can avoid a flash. */
  ready: boolean;
}

const ModeContext = createContext<ModeContextValue>({
  mode: 'hiring',
  setMode: () => {},
  toggleMode: () => {},
  ready: false,
});

export function ModeProvider({ children }: { children: React.ReactNode }) {
  const { profile } = useAuth();
  const [mode, setModeState] = useState<AppMode>('hiring');
  const [ready, setReady] = useState(false);
  // A stored choice always wins over the isProvider-derived default, so we only
  // seed from the profile when the user has never picked a mode themselves.
  const hasStoredChoice = useRef(false);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (cancelled) return;
        if (stored === 'hiring' || stored === 'working') {
          hasStoredChoice.current = true;
          setModeState(stored);
        }
      })
      .catch(() => {
        // A missing/unreadable preference just means we fall back to the default.
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!ready || hasStoredChoice.current || !profile) return;
    setModeState(profile.isProvider ? 'working' : 'hiring');
  }, [ready, profile]);

  const setMode = useCallback((next: AppMode) => {
    hasStoredChoice.current = true;
    setModeState(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {
      // Persistence is best-effort; the in-memory value is still correct.
    });
  }, []);

  const toggleMode = useCallback(() => {
    setMode(mode === 'hiring' ? 'working' : 'hiring');
  }, [mode, setMode]);

  return (
    <ModeContext.Provider value={{ mode, setMode, toggleMode, ready }}>
      {children}
    </ModeContext.Provider>
  );
}

export function useMode() {
  return useContext(ModeContext);
}
