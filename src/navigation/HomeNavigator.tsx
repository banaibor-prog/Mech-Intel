import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import FeedScreen from '../screens/feed/FeedScreen';
import CreatePostScreen from '../screens/feed/CreatePostScreen';
import PostDetailScreen from '../screens/feed/PostDetailScreen';
import DiscoverScreen from '../screens/home/DiscoverScreen';
import ProviderDetailScreen from '../screens/home/ProviderDetailScreen';
import PublicProfileScreen from '../screens/profile/PublicProfileScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import AdminHomeScreen from '../screens/admin/AdminHomeScreen';
import AdminUsersScreen from '../screens/admin/AdminUsersScreen';
import AdminUserScreen from '../screens/admin/AdminUserScreen';
import AdminJobsScreen from '../screens/admin/AdminJobsScreen';
import AdminBookingsScreen from '../screens/admin/AdminBookingsScreen';
import AdminReportsScreen from '../screens/admin/AdminReportsScreen';
import AdminReviewsScreen from '../screens/admin/AdminReviewsScreen';
import AdminSettingsScreen from '../screens/admin/AdminSettingsScreen';
import AdminActivityScreen from '../screens/admin/AdminActivityScreen';
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
      {/* Admin console (each screen also checks isAdmin; firestore.rules is the real guard). */}
      <Stack.Screen name="AdminHome" component={AdminHomeScreen} options={{ title: 'Admin console' }} />
      <Stack.Screen name="AdminUsers" component={AdminUsersScreen} options={{ title: 'Users' }} />
      <Stack.Screen name="AdminUser" component={AdminUserScreen} options={{ title: 'User' }} />
      <Stack.Screen name="AdminJobs" component={AdminJobsScreen} options={{ title: 'Jobs' }} />
      <Stack.Screen name="AdminBookings" component={AdminBookingsScreen} options={{ title: 'Bookings' }} />
      <Stack.Screen name="AdminReports" component={AdminReportsScreen} options={{ title: 'Reports' }} />
      <Stack.Screen name="AdminReviews" component={AdminReviewsScreen} options={{ title: 'Reviews' }} />
      <Stack.Screen name="AdminSettings" component={AdminSettingsScreen} options={{ title: 'App settings' }} />
      <Stack.Screen name="AdminActivity" component={AdminActivityScreen} options={{ title: 'Activity log' }} />
    </Stack.Navigator>
  );
}
