import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import Svg, { Circle, G, Line, Path } from 'react-native-svg';
import { Colors } from '../constants/Colors';
import { Fonts } from '../constants/Typography';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedLine = Animated.createAnimatedComponent(Line);
const AnimatedG = Animated.createAnimatedComponent(G);

const LOOP_MS = 2800;
const STROKE = 5;

// The GYC brand mark (umbrella with a check under it), sitting low in the box so rain has room
// to fall onto it. `len` is each path's measured length, used to draw it on with dash offsets.
const MARK = {
  canopy: { d: 'M11 69 C11 48 29 34 50 34 C71 34 89 48 89 69', len: 117 },
  ribLeft: { d: 'M45 35 C33 41 23 52 19 63', len: 40 },
  ribRight: { d: 'M57 35 C65 43 68 53 68.5 64.5', len: 33 },
  hem: { d: 'M11 69 Q14 61 19 63 C30 56 55 54 68.5 64.5 Q80 59 89 69', len: 87 },
  check: { d: 'M38 75 L46.5 84.5 L68.5 64.5', len: 43 },
};

// Each streak stops on the canopy's outer edge and splashes: whoever is under it stays dry.
const RAIN = [
  { x: 50, landY: 31.5, start: 0.28 },
  { x: 30, landY: 36.2, start: 0.34 },
  { x: 70, landY: 36.2, start: 0.4 },
];
const RAIN_FALL = 0.11;
const RAIN_LEN = 8;
const SPLASH = 0.1;

interface GycLoaderProps {
  size?: number;
  color?: string;
  rainColor?: string;
  label?: string;
  style?: StyleProp<ViewStyle>;
}

export default function GycLoader({
  size = 64,
  color = Colors.accent,
  rainColor = Colors.textMuted,
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
        // SVG attributes (strokeDashoffset, r, y1/y2) can't run on the native driver.
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
        <AnimatedG opacity={at([0, 0.03, 0.9, 1], [0, 1, 1, 0])}>
          {RAIN.map(({ x, landY, start }) => {
            const land = start + RAIN_FALL;
            const tip = at([start, land], [4, landY], Easing.in(Easing.quad));
            return (
              <G key={x}>
                <AnimatedLine
                  x1={x}
                  x2={x}
                  y1={Animated.subtract(tip, RAIN_LEN)}
                  y2={tip}
                  stroke={rainColor}
                  strokeWidth={2.4}
                  strokeLinecap="round"
                  opacity={at([start, start + 0.02, land - 0.005, land], [0, 1, 1, 0])}
                />
                <AnimatedCircle
                  cx={x}
                  cy={landY}
                  r={at([land, land + SPLASH], [1, 7], Easing.out(Easing.quad))}
                  fill="none"
                  stroke={rainColor}
                  strokeWidth={1.8}
                  opacity={at([land, land + 0.01, land + SPLASH], [0, 0.9, 0])}
                />
              </G>
            );
          })}

          {drawOn('canopy', 0.02, 0.24, Easing.out(Easing.cubic))}
          {drawOn('ribLeft', 0.16, 0.32)}
          {drawOn('ribRight', 0.18, 0.34)}
          {drawOn('hem', 0.44, 0.62)}
          {drawOn('check', 0.6, 0.74, Easing.out(Easing.quad))}
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
    marginTop: 8,
    fontSize: 14,
    fontFamily: Fonts.bodyMedium,
    color: Colors.textLight,
  },
});
