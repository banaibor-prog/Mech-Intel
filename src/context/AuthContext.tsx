import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from '@firebase/auth';
import { doc, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { getUserProfile } from '../services/dataService';
import { UserProfile } from '../types/models';

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  profile: null,
  loading: true,
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async (uid: string) => {
    const p = await getUserProfile(uid);
    setProfile(p);
  };

  useEffect(() => {
    let unsubscribeProfile: Unsubscribe | undefined;
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      unsubscribeProfile?.();
      setUser(firebaseUser);
      if (firebaseUser) {
        unsubscribeProfile = onSnapshot(
          doc(db, 'users', firebaseUser.uid),
          (snapshot) => setProfile(snapshot.exists() ? (snapshot.data() as UserProfile) : null),
          (error) => {
            console.warn('Unable to load user profile', error);
            setProfile(null);
          }
        );
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return () => {
      unsubscribe();
      unsubscribeProfile?.();
    };
  }, []);

  const refreshProfile = async () => {
    if (user) {
      await loadProfile(user.uid);
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
