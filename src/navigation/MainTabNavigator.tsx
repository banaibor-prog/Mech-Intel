import React from 'react';
import { StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeNavigator from './HomeNavigator';
import ExploreNavigator from './ExploreNavigator';
import NetworkNavigator from './NetworkNavigator';
import BookingsScreen from '../screens/bookings/BookingsScreen';
import ProfileNavigator from './ProfileNavigator';
import { MainTabParamList } from './types';
import { Colors } from '../constants/Colors';
import { Fonts } from '../constants/Typography';
import AppIcon, { AppIconName } from '../components/AppIcon';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const Tab = createBottomTabNavigator<MainTabParamList>();

const ICONS: Record<keyof MainTabParamList, AppIconName> = {
  HomeTab: 'home',
  ExploreTab: 'search',
  NetworkTab: 'network',
  BookingsTab: 'calendar',
  ProfileTab: 'user',
};

export default function MainTabNavigator() {
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: Colors.accent,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: [styles.tabBar, { height: 62 + insets.bottom, paddingBottom: Math.max(4, insets.bottom) }],
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: styles.tabItem,
        tabBarIcon: ({ focused }) => (
          <AppIcon
            name={ICONS[route.name]}
            size={21}
            color={focused ? Colors.accent : Colors.textMuted}
            filled={focused}
          />
        ),
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeNavigator} options={{ title: 'Home' }} />
      <Tab.Screen name="ExploreTab" component={ExploreNavigator} options={{ title: 'Explore' }} />
      <Tab.Screen name="NetworkTab" component={NetworkNavigator} options={{ title: 'Network' }} />
      <Tab.Screen name="BookingsTab" component={BookingsScreen} options={{ title: 'Bookings' }} />
      <Tab.Screen name="ProfileTab" component={ProfileNavigator} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    shadowColor: Colors.black,
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: -3 },
    elevation: 5,
    paddingTop: 5,
  },
  tabItem: { paddingTop: 1 },
  tabLabel: { fontSize: 10.5, fontFamily: Fonts.bodySemibold, marginTop: 3 },
});
