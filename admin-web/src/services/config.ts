import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { AppConfig } from '../../../src/types/models';

// Mirrors src/services/appConfigService.ts in the mobile app (same config/app document).
export const DEFAULT_APP_CONFIG: AppConfig = {
  maintenance: { enabled: false, message: 'We are making some improvements and will be back shortly.' },
  announcement: { active: false, title: '', message: '', tone: 'info' },
  allowNewPosts: true,
  showDemoContent: true,
};

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
    doc(db, 'config', 'app'),
    (snap) => callback(withDefaults(snap.exists() ? (snap.data() as Partial<AppConfig>) : undefined)),
    () => callback(DEFAULT_APP_CONFIG),
  );
}

export async function saveAppConfig(patch: Partial<AppConfig>, actorUid: string) {
  await setDoc(doc(db, 'config', 'app'), { ...patch, updatedAt: Date.now(), updatedBy: actorUid }, { merge: true });
}
