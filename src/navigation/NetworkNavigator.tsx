import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import NetworkScreen from '../screens/network/NetworkScreen';
import ProviderDetailScreen from '../screens/home/ProviderDetailScreen';
import PublicProfileScreen from '../screens/profile/PublicProfileScreen';
import { NetworkStackParamList } from './types';
import { Colors } from '../constants/Colors';

const Stack = createNativeStackNavigator<NetworkStackParamList>();

export default function NetworkNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerTintColor: Colors.text,
        headerStyle: { backgroundColor: Colors.background },
        headerShadowVisible: false,
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Stack.Screen name="Network" component={NetworkScreen} options={{ headerShown: false }} />
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
