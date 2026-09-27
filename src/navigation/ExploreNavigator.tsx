import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ExploreScreen from '../screens/explore/ExploreScreen';
import ProviderDetailScreen from '../screens/home/ProviderDetailScreen';
import PostDetailScreen from '../screens/feed/PostDetailScreen';
import PublicProfileScreen from '../screens/profile/PublicProfileScreen';
import { ExploreStackParamList } from './types';
import { stackScreenOptions } from './stackOptions';

const Stack = createNativeStackNavigator<ExploreStackParamList>();

export default function ExploreNavigator() {
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen name="Explore" component={ExploreScreen} options={{ headerShown: false }} />
      <Stack.Screen
        name="ProviderDetail"
        component={ProviderDetailScreen}
        options={{ title: 'Provider' }}
      />
      <Stack.Screen name="PostDetail" component={PostDetailScreen} options={{ title: 'Job details' }} />
      <Stack.Screen
        name="PublicProfile"
        component={PublicProfileScreen}
        options={{ title: 'Profile' }}
      />
    </Stack.Navigator>
  );
}
