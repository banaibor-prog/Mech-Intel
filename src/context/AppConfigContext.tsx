import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { DEFAULT_APP_CONFIG, subscribeToAppConfig } from '../services/appConfigService';
import { AppConfig } from '../types/models';

const AppConfigContext = createContext<AppConfig>(DEFAULT_APP_CONFIG);

/** Live app-wide settings (maintenance mode, announcement, feature switches). */
export function AppConfigProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [config, setConfig] = useState<AppConfig>(DEFAULT_APP_CONFIG);

  useEffect(() => {
    if (!user) return;
    return subscribeToAppConfig(setConfig);
  }, [user]);

  return <AppConfigContext.Provider value={config}>{children}</AppConfigContext.Provider>;
}

export function useAppConfig() {
  return useContext(AppConfigContext);
}
