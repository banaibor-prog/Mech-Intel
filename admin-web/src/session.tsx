import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from './firebase';
import { UserProfile } from '../../src/types/models';
import { AdminActor } from './services/admin';

type Session =
  | { status: 'loading' }
  | { status: 'signedOut' }
  | { status: 'denied'; user: User }
  | { status: 'admin'; user: User; profile: UserProfile; actor: AdminActor };

const SessionContext = createContext<Session>({ status: 'loading' });

/** Signed-in Firebase user plus their live users/{uid} doc; only isAdmin profiles get in. */
export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session>({ status: 'loading' });

  useEffect(() => {
    let stopProfile: (() => void) | undefined;
    const stopAuth = onAuthStateChanged(auth, (user) => {
      stopProfile?.();
      if (!user) {
        setSession({ status: 'signedOut' });
        return;
      }
      setSession({ status: 'loading' });
      stopProfile = onSnapshot(
        doc(db, 'users', user.uid),
        (snap) => {
          const profile = snap.exists() ? ({ ...(snap.data() as UserProfile), uid: user.uid }) : null;
          if (profile?.isAdmin) {
            setSession({
              status: 'admin',
              user,
              profile,
              actor: { uid: user.uid, name: profile.displayName || user.email || 'Admin' },
            });
          } else {
            setSession({ status: 'denied', user });
          }
        },
        () => setSession({ status: 'denied', user }),
      );
    });
    return () => {
      stopAuth();
      stopProfile?.();
    };
  }, []);

  return <SessionContext.Provider value={session}>{children}</SessionContext.Provider>;
}

export function useSession() {
  return useContext(SessionContext);
}

/** For pages rendered inside the admin shell, where the session is always an admin. */
export function useAdmin() {
  const s = useSession();
  if (s.status !== 'admin') throw new Error('Admin session required');
  return s;
}
