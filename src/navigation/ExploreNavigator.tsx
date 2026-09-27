import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ExploreScreen from '../screens/explore/ExploreScreen';
import ProviderDetailScreen from '../screens/home/ProviderDetailScreen';
import PostDetailScreen from '../screens/feed/PostDetailScreen';
import PublicProfileScreen from '../screens/profile/PublicProfileScreen';
import { ExploreStackParamList } from './types';
import { Colors } from '../constants/Colors';

const Stack = createNativeStackNavigator<ExploreStackParamList>();

export default function ExploreNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerTintColor: Colors.text,
        headerStyle: { backgroundColor: Colors.background },
        headerShadowVisible: false,
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Stack.Screen name="Explore" component={ExploreScreen} options={{ headerShown: false }} />
      <Stack.Screen
        name="ProviderDetail"
        component={ProviderDetailScreen}
        options={{ title: 'Provider' }}
      />
      <Stack.Screen name="PostDetail" component={PostDetailScreen} options={{ title: 'Job Post' }} />
      <Stack.Screen
        name="PublicProfile"
        component={PublicProfileScreen}
        options={{ title: 'Profile' }}
      />
    </Stack.Navigator>
  );
}
