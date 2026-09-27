import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BottomTabBarProps, createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import HomeNavigator from './HomeNavigator';
import ExploreNavigator from './ExploreNavigator';
import NetworkNavigator from './NetworkNavigator';
import BookingsScreen from '../screens/bookings/BookingsScreen';
import ProfileNavigator from './ProfileNavigator';
import { MainTabParamList } from './types';
import { Colors, Gradients } from '../constants/Colors';
import { Fonts } from '../constants/Typography';
import AppIcon, { AppIconName } from '../components/AppIcon';
import KhasiWeave from '../components/brand/KhasiWeave';
import { useLocationRecorder } from '../hooks/useLocationRecorder';

const Tab = createBottomTabNavigator<MainTabParamList>();

const TABS: Record<keyof MainTabParamList, { icon: AppIconName; label: string }> = {
  HomeTab: { icon: 'home', label: 'Home' },
  ExploreTab: { icon: 'map', label: 'Explore' },
  NetworkTab: { icon: 'network', label: 'Network' },
  BookingsTab: { icon: 'calendar', label: 'Bookings' },
  ProfileTab: { icon: 'user', label: 'Profile' },
};

// The bar only shows on each tab's root screen; detail screens get the full height.
const ROOT_SCREENS = new Set(['Feed', 'Explore', 'Network', 'Profile']);

/** Floating pill tab bar; root screens reserve TAB_BAR_SPACE (+ bottom inset) beneath their content. */
function FloatingTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const focusedRoute = state.routes[state.index];
  const nested = getFocusedRouteNameFromRoute(focusedRoute);
  if (nested && !ROOT_SCREENS.has(nested)) return null;
  return (
    <View style={[styles.wrap, { bottom: Math.max(10, insets.bottom + 6) }]} pointerEvents="box-none">
      <View style={styles.bar}>
        <KhasiWeave height={5} opacity={0.35} bordered={false} style={styles.weave} />
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const tab = TABS[route.name as keyof MainTabParamList];
          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) navigation.navigate(route.name, route.params);
          };
          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              activeOpacity={0.8}
              style={styles.item}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={tab.label}>
              {focused ? (
                <LinearGradient colors={[...Gradients.brand]} start={{ x: 0, y: 1 }} end={{ x: 1, y: 0 }} style={styles.bubble}>
                  <AppIcon name={tab.icon} size={20} color={Colors.white} />
                </LinearGradient>
              ) : (
                <View style={styles.bubbleIdle}>
                  <AppIcon name={tab.icon} size={21} color={Colors.textMuted} />
                </View>
              )}
              <Text style={[styles.label, focused && styles.labelActive]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export default function MainTabNavigator() {
  useLocationRecorder();
  return (
    <Tab.Navigator tabBar={(props) => <FloatingTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tab.Screen name="HomeTab" component={HomeNavigator} />
      <Tab.Screen name="ExploreTab" component={ExploreNavigator} />
      <Tab.Screen name="NetworkTab" component={NetworkNavigator} />
      <Tab.Screen name="BookingsTab" component={BookingsScreen} />
      <Tab.Screen name="ProfileTab" component={ProfileNavigator} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 12, right: 12 },
  bar: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 26,
    paddingTop: 9,
    paddingBottom: 8,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    shadowColor: '#1E3A8A',
    shadowOpacity: 0.16,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  weave: { position: 'absolute', top: 0, left: 0, right: 0 },
  item: { flex: 1, alignItems: 'center' },
  bubble: { width: 40, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  bubbleIdle: { width: 40, height: 32, alignItems: 'center', justifyContent: 'center' },
  label: { fontFamily: Fonts.bodySemibold, fontSize: 10.5, color: Colors.textMuted, marginTop: 3 },
  labelActive: { color: Colors.text },
});
