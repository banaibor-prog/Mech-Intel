import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeNavigator from './HomeNavigator';
import ExploreNavigator from './ExploreNavigator';
import NetworkNavigator from './NetworkNavigator';
import BookingsScreen from '../screens/bookings/BookingsScreen';
import ProfileNavigator from './ProfileNavigator';
import { MainTabParamList } from './types';
import FloatingTabBar from './FloatingTabBar';
import { useLocationRecorder } from '../hooks/useLocationRecorder';

const Tab = createBottomTabNavigator<MainTabParamList>();

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
