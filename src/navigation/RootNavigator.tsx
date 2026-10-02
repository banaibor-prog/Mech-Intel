import React from 'react';
import { View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useAppConfig } from '../context/AppConfigContext';
import NoticeScreen from '../screens/system/NoticeScreen';
import AuthNavigator from './AuthNavigator';
import MainTabNavigator from './MainTabNavigator';
import { Colors } from '../constants/Colors';
import GycLoader from '../components/GycLoader';

export default function RootNavigator() {
  const { user, profile, loading } = useAuth();
  const config = useAppConfig();

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <GycLoader size={150} label="Loading reliable local services…" />
      </View>
    );
  }

  if (user && profile?.suspended) {
    return (
      <NoticeScreen
        icon="bell"
        title="Your account is suspended"
        message={`${profile.suspendedReason || 'Your account was suspended by a moderator.'} If you think this is a mistake, contact support.`}
        supportEmail={config.supportEmail}
      />
    );
  }

  // Admins keep full access during maintenance so they can switch it back off.
  if (user && config.maintenance.enabled && !profile?.isAdmin) {
    return (
      <NoticeScreen
        icon="tool"
        title="We'll be right back"
        message={config.maintenance.message}
        supportEmail={config.supportEmail}
      />
    );
  }

  return (
    <NavigationContainer>
      {user ? <MainTabNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
});
