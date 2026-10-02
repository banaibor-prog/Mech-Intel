import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { AppConfig } from '../types/models';

export const DEFAULT_APP_CONFIG: AppConfig = {
  maintenance: { enabled: false, message: 'We are making some improvements and will be back shortly.' },
  announcement: { active: false, title: '', message: '', tone: 'info' },
  allowNewPosts: true,
  showDemoContent: true,
};

const configRef = () => doc(db, 'config', 'app');

// The latest config, kept in module scope so data helpers (e.g. whether to mix in
// demo content) can read it without threading React context through every call.
let current: AppConfig = DEFAULT_APP_CONFIG;

export function getAppConfig(): AppConfig {
  return current;
}

function withDefaults(data: Partial<AppConfig> | undefined): AppConfig {
  return {
    ...DEFAULT_APP_CONFIG,
    ...data,
    maintenance: { ...DEFAULT_APP_CONFIG.maintenance, ...data?.maintenance },
    announcement: { ...DEFAULT_APP_CONFIG.announcement, ...data?.announcement },
  };
}

export function subscribeToAppConfig(callback: (config: AppConfig) => void) {
  return onSnapshot(
    configRef(),
    (snap) => {
      current = withDefaults(snap.exists() ? (snap.data() as Partial<AppConfig>) : undefined);
      callback(current);
    },
    () => callback(current),
  );
}

/** Admin only (enforced by firestore.rules). Merges the given fields into config/app. */
export async function saveAppConfig(patch: Partial<AppConfig>, actorUid: string) {
  await setDoc(configRef(), { ...patch, updatedAt: Date.now(), updatedBy: actorUid }, { merge: true });
}
