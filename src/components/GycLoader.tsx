import React, { useEffect, useId, useRef } from 'react';
import { Animated, Easing, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import Svg, { Defs, G, LinearGradient, Path, Stop } from 'react-native-svg';
import { Colors } from '../constants/Colors';
import { Fonts } from '../constants/Typography';
import {
  BRAND_GRADIENT,
  BRAND_GRADIENT_VECTOR,
  LOGO_ARMS,
  LOGO_HEAD,
  LOGO_RIBS,
  LOGO_WEAVE,
  LOGO_WINGS,
} from './brand/logoPaths';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedG = Animated.createAnimatedComponent(G);

const LOOP_MS = 2600;

// Sky arc over the knup: half circle centred at (50, 62), r = 44. A short gradient
// segment travels along it each loop, like an indeterminate progress bar.
const RING = 'M6 62 A44 44 0 0 1 94 62';
const RING_LEN = 139;
const SEGMENT_LEN = 44;
const RING_STROKE = 3.6;
const TRACK_COLOR = '#DCE6FB';

// The logo (content x 5–95, y 10–61) scaled to sit under the arc.
const MARK_TRANSFORM = 'translate(14 26.8) scale(0.72)';

interface GycLoaderProps {
  size?: number;
  label?: string;
  style?: StyleProp<ViewStyle>;
}

export default function GycLoader({ size = 64, label, style }: GycLoaderProps): React.JSX.Element {
  const progress = useRef(new Animated.Value(0)).current;
  const gradientId = `gycl${useId().replace(/:/g, '')}`;
  const brand = `url(#${gradientId})`;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(progress, {
        toValue: 1,
        duration: LOOP_MS,
        easing: Easing.linear,
        // SVG attributes (strokeDashoffset, opacity, r) can't run on the native driver.
        useNativeDriver: false,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [progress]);

  const at = (input: number[], output: number[], easing?: (t: number) => number) =>
    progress.interpolate({ inputRange: input, outputRange: output, easing, extrapolate: 'clamp' });
  const fadeIn = (from: number, to: number) => at([from, to], [0, 1], Easing.out(Easing.quad));

  return (
    <View
      style={[styles.container, style]}
      accessibilityRole="progressbar"
      accessibilityLabel={label ?? 'Loading'}>
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Defs>
          <LinearGradient id={gradientId} gradientUnits="userSpaceOnUse" {...BRAND_GRADIENT_VECTOR}>
            {BRAND_GRADIENT.map((s) => (
              <Stop key={s.offset} offset={s.offset} stopColor={s.color} />
            ))}
          </LinearGradient>
        </Defs>

        <Path d={RING} stroke={TRACK_COLOR} strokeWidth={RING_STROKE} strokeLinecap="round" fill="none" />
        <AnimatedPath
          d={RING}
          stroke={brand}
          strokeWidth={RING_STROKE}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${SEGMENT_LEN} ${RING_LEN}`}
          strokeDashoffset={at([0, 1], [SEGMENT_LEN, -RING_LEN], Easing.inOut(Easing.cubic))}
        />

        <AnimatedG opacity={at([0, 0.03, 0.9, 1], [0, 1, 1, 0])}>
          <G transform={MARK_TRANSFORM}>
            {/* The shelter goes up: wings, then ribs, then the weave; then the person appears under it. */}
            {LOGO_WINGS.map((d) => (
              <AnimatedPath key={d} d={d} fill={brand} opacity={fadeIn(0.02, 0.16)} />
            ))}
            {LOGO_RIBS.map((d) => (
              <AnimatedPath key={d} d={d} fill={brand} opacity={fadeIn(0.12, 0.26)} />
            ))}
            <AnimatedPath d={LOGO_WEAVE} fillRule="evenodd" fill={brand} opacity={fadeIn(0.24, 0.4)} />
            <AnimatedPath d={LOGO_HEAD} fill={brand} opacity={fadeIn(0.42, 0.5)} />
            <AnimatedPath d={LOGO_ARMS} fill={brand} opacity={fadeIn(0.5, 0.66)} />
          </G>
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
