import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ProfileScreen from '../screens/profile/ProfileScreen';
import ModerationScreen from '../screens/profile/ModerationScreen';
import PublicProfileScreen from '../screens/profile/PublicProfileScreen';
import ProviderDetailScreen from '../screens/home/ProviderDetailScreen';
import { ProfileStackParamList } from './types';
import { stackScreenOptions } from './stackOptions';

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export default function ProfileNavigator() {
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ headerShown: false }} />
      <Stack.Screen
        name="Moderation"
        component={ModerationScreen}
        options={{ title: 'Moderation' }}
      />
      <Stack.Screen name="PublicProfile" component={PublicProfileScreen} options={{ title: 'Public profile' }} />
      <Stack.Screen name="ProviderDetail" component={ProviderDetailScreen} options={{ title: 'Provider' }} />
    </Stack.Navigator>
  );
}
