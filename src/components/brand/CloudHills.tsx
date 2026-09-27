import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import Svg, { Defs, Ellipse, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

interface CloudHillsProps {
  height?: number;
  /** 'day' = misty light header; 'dusk' = deep brand-blue hero. */
  tone?: 'day' | 'dusk';
  animated?: boolean;
  style?: StyleProp<ViewStyle>;
}

const TONES = {
  day: {
    sky: ['#D9E8FF', '#EEF4FC'],
    far: '#CFDDF6',
    mid: '#B3C8F0',
    near: '#8FAEE6',
    cloud: '#FFFFFF',
    fall: '#FFFFFF',
  },
  dusk: {
    sky: ['#0F172A', '#1E3A8A'],
    far: '#2A3F86',
    mid: '#314FB0',
    near: '#3B64D4',
    cloud: '#DCE8FF',
    fall: '#DCE8FF',
  },
};

/**
 * Meghalaya backdrop — layered East Khasi hills with a Nohkalikai-style falls and
 * low clouds drifting through the valleys. Fills the width of its container.
 */
export default function CloudHills({
  height = 180,
  tone = 'day',
  animated = true,
  style,
}: CloudHillsProps): React.JSX.Element {
  const t = TONES[tone];
  const drift = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!animated) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(drift, { toValue: 1, duration: 9000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(drift, { toValue: 0, duration: 9000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [animated, drift]);

  const nearShift = drift.interpolate({ inputRange: [0, 1], outputRange: [-10, 14] });
  const farShift = drift.interpolate({ inputRange: [0, 1], outputRange: [8, -8] });

  return (
    <View style={[{ height, overflow: 'hidden' }, style]} pointerEvents="none">
      <Svg width="100%" height={height} viewBox="0 0 400 180" preserveAspectRatio="xMidYMax slice">
        <Defs>
          <LinearGradient id="chSky" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={t.sky[0]} />
            <Stop offset="1" stopColor={t.sky[1]} />
          </LinearGradient>
        </Defs>
        <Rect width="400" height="180" fill="url(#chSky)" />
        <Path d="M0 118 C40 92 70 96 104 82 C140 66 170 90 210 76 C250 62 290 70 330 58 C360 50 385 62 400 56 V180 H0 Z" fill={t.far} />
        <Path d="M0 138 C36 120 66 124 98 110 C130 96 150 116 188 106 C222 97 244 84 282 92 C318 100 350 86 400 96 V180 H0 Z" fill={t.mid} />
        <Path d="M247 97 C246 112 247 124 246.5 136" stroke={t.fall} strokeWidth={2.4} strokeLinecap="round" opacity={0.85} fill="none" />
        <Path d="M0 158 C44 140 80 146 120 136 C160 126 196 146 236 140 C276 134 312 124 350 132 C372 136 390 132 400 128 V180 H0 Z" fill={t.near} />
      </Svg>
      <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateX: farShift }] }]}>
        <Svg width="100%" height={height} viewBox="0 0 400 180" preserveAspectRatio="xMidYMax slice">
          <G fill={t.cloud} opacity={0.75}>
            <Ellipse cx="70" cy="104" rx="46" ry="9" />
            <Ellipse cx="96" cy="98" rx="26" ry="8" />
            <Ellipse cx="300" cy="86" rx="54" ry="9" />
            <Ellipse cx="328" cy="80" rx="24" ry="7" />
          </G>
        </Svg>
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateX: nearShift }] }]}>
        <Svg width="100%" height={height} viewBox="0 0 400 180" preserveAspectRatio="xMidYMax slice">
          <G fill={t.cloud} opacity={0.9}>
            <Ellipse cx="180" cy="134" rx="70" ry="10" />
            <Ellipse cx="206" cy="127" rx="30" ry="9" />
            <Ellipse cx="160" cy="129" rx="22" ry="7" />
            <Ellipse cx="380" cy="146" rx="50" ry="8" />
          </G>
        </Svg>
      </Animated.View>
    </View>
  );
}
