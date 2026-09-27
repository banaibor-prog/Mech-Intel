import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import FeedScreen from '../screens/feed/FeedScreen';
import CreatePostScreen from '../screens/feed/CreatePostScreen';
import PostDetailScreen from '../screens/feed/PostDetailScreen';
import DiscoverScreen from '../screens/home/DiscoverScreen';
import ProviderDetailScreen from '../screens/home/ProviderDetailScreen';
import PublicProfileScreen from '../screens/profile/PublicProfileScreen';
import { HomeStackParamList } from './types';
import { Colors } from '../constants/Colors';

const Stack = createNativeStackNavigator<HomeStackParamList>();

export default function HomeNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerTintColor: Colors.text,
        headerStyle: { backgroundColor: Colors.background },
        headerShadowVisible: false,
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Stack.Screen name="Feed" component={FeedScreen} options={{ headerShown: false }} />
      <Stack.Screen
        name="CreatePost"
        component={CreatePostScreen}
        options={{ title: 'New Job Post' }}
      />
      <Stack.Screen
        name="PostDetail"
        component={PostDetailScreen}
        options={{ title: 'Job Post' }}
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
    </Stack.Navigator>
  );
}
