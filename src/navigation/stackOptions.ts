import type { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { Colors } from '../constants/Colors';
import { Fonts } from '../constants/Typography';

export const stackScreenOptions: NativeStackNavigationOptions = {
  headerTintColor: Colors.accent,
  headerStyle: { backgroundColor: Colors.background },
  headerShadowVisible: false,
  headerTitleStyle: { fontFamily: Fonts.display, fontSize: 18, color: Colors.text },
  contentStyle: { backgroundColor: Colors.background },
  animation: 'slide_from_right',
};
