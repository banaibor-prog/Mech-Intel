import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import FeedScreen from '../screens/feed/FeedScreen';
import CreatePostScreen from '../screens/feed/CreatePostScreen';
import PostDetailScreen from '../screens/feed/PostDetailScreen';
import DiscoverScreen from '../screens/home/DiscoverScreen';
import ProviderDetailScreen from '../screens/home/ProviderDetailScreen';
import PublicProfileScreen from '../screens/profile/PublicProfileScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import ModerationScreen from '../screens/profile/ModerationScreen';
import { HomeStackParamList } from './types';
import { stackScreenOptions } from './stackOptions';

const Stack = createNativeStackNavigator<HomeStackParamList>();

export default function HomeNavigator() {
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen name="Feed" component={FeedScreen} options={{ headerShown: false }} />
      <Stack.Screen
        name="CreatePost"
        component={CreatePostScreen}
        options={{ title: 'Post a job' }}
      />
      <Stack.Screen
        name="PostDetail"
        component={PostDetailScreen}
        options={{ title: 'Job details' }}
      />
      <Stack.Screen
        name="Discover"
        component={DiscoverScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ProviderDetail"
        component={ProviderDetailScreen}
        options={{ title: 'Provider' }}
      />
      <Stack.Screen
        name="PublicProfile"
        component={PublicProfileScreen}
        options={{ title: 'Profile' }}
      />
      {/* Your own profile opens from the avatar on Home rather than a tab. */}
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Moderation" component={ModerationScreen} options={{ title: 'Moderation' }} />
    </Stack.Navigator>
  );
}
