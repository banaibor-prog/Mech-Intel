import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import Svg, { G, Path } from 'react-native-svg';
import { Colors } from '../constants/Colors';
import { Fonts } from '../constants/Typography';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedG = Animated.createAnimatedComponent(G);

const LOOP_MS = 2400;
const STROKE = 4;

// Track arc over the mark: half circle centred at (50, 70), r = 42. A short indigo
// segment travels along it each loop, like an indeterminate progress bar.
const RING = 'M8 70 A42 42 0 0 1 92 70';
const RING_LEN = 132;
const SEGMENT_LEN = 46;
// Indigo tint that stays visible on Colors.background (accentSoft is too faint there).
const TRACK_COLOR = '#DCDDFB';

// The GYC brand mark (umbrella with a check under it). `len` is each path's measured
// length, used to draw it on with dash offsets.
const MARK = {
  canopy: { d: 'M18.8 69.8 C18.8 53 33.2 41.8 50 41.8 C66.8 41.8 81.2 53 81.2 69.8', len: 94 },
  ribLeft: { d: 'M46 42.6 C36.4 47.4 28.4 56.2 25.2 65', len: 32 },
  ribRight: { d: 'M55.6 42.6 C62 49 64.4 57 64.8 66.2', len: 26 },
  hem: { d: 'M18.8 69.8 Q21.2 63.4 25.2 65 C34 59.4 54 57.8 64.8 66.2 Q74 61.8 81.2 69.8', len: 69 },
  check: { d: 'M40.4 74.6 L47.2 82.2 L64.8 66.2', len: 34 },
};

interface GycLoaderProps {
  size?: number;
  color?: string;
  trackColor?: string;
  label?: string;
  style?: StyleProp<ViewStyle>;
}

export default function GycLoader({
  size = 64,
  color = Colors.accent,
  trackColor = TRACK_COLOR,
  label,
  style,
}: GycLoaderProps): React.JSX.Element {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(progress, {
        toValue: 1,
        duration: LOOP_MS,
        easing: Easing.linear,
        // SVG attributes (strokeDashoffset, opacity on G) can't run on the native driver.
        useNativeDriver: false,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [progress]);

  const at = (input: number[], output: number[], easing?: (t: number) => number) =>
    progress.interpolate({ inputRange: input, outputRange: output, easing, extrapolate: 'clamp' });

  const drawOn = (part: keyof typeof MARK, from: number, to: number, easing = Easing.inOut(Easing.cubic)) => {
    const { d, len } = MARK[part];
    return (
      <AnimatedPath
        d={d}
        stroke={color}
        strokeWidth={STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        strokeDasharray={`${len} ${len}`}
        strokeDashoffset={at([from, to], [len, 0], easing)}
      />
    );
  };

  return (
    <View
      style={[styles.container, style]}
      accessibilityRole="progressbar"
      accessibilityLabel={label ?? 'Loading'}>
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Path d={RING} stroke={trackColor} strokeWidth={STROKE} strokeLinecap="round" fill="none" />
        <AnimatedPath
          d={RING}
          stroke={color}
          strokeWidth={STROKE}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${SEGMENT_LEN} ${RING_LEN}`}
          strokeDashoffset={at([0, 1], [SEGMENT_LEN, -RING_LEN], Easing.inOut(Easing.cubic))}
        />

        <AnimatedG opacity={at([0, 0.03, 0.88, 1], [0, 1, 1, 0])}>
          {drawOn('canopy', 0.02, 0.22, Easing.out(Easing.cubic))}
          {drawOn('ribLeft', 0.14, 0.3)}
          {drawOn('ribRight', 0.16, 0.32)}
          {drawOn('hem', 0.3, 0.46)}
          {drawOn('check', 0.44, 0.58, Easing.out(Easing.quad))}
        </AnimatedG>
      </Svg>
      {label ? <Text style={styles.label}>{label}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    marginTop: 12,
    fontSize: 15,
    fontFamily: Fonts.bodyMedium,
    color: Colors.text,
    textAlign: 'center',
  },
});
