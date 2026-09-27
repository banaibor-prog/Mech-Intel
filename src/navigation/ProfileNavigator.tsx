import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ProfileScreen from '../screens/profile/ProfileScreen';
import ModerationScreen from '../screens/profile/ModerationScreen';
import { ProfileStackParamList } from './types';
import { Colors } from '../constants/Colors';

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export default function ProfileNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerTintColor: Colors.text,
        headerStyle: { backgroundColor: Colors.background },
        headerShadowVisible: false,
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ headerShown: false }} />
      <Stack.Screen
        name="Moderation"
        component={ModerationScreen}
        options={{ title: 'Moderation' }}
      />
    </Stack.Navigator>
  );
}
