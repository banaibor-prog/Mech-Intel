import React, { useEffect, useId, useRef } from 'react';
import { Animated, Easing, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

interface MeghalayaSkyProps {
  /** Omit to fill the parent (with an absolute-fill style). */
  height?: number;
  animated?: boolean;
  style?: StyleProp<ViewStyle>;
}

// Deterministic "random" so the star field is identical on every render.
function seeded(n: number) {
  const x = Math.sin(n * 91.7) * 43758.5453;
  return x - Math.floor(x);
}

const STARS = Array.from({ length: 46 }, (_, i) => ({
  x: seeded(i + 1) * 400,
  y: seeded(i + 101) * 150,
  r: 0.4 + seeded(i + 201) * 1.1,
  o: 0.25 + seeded(i + 301) * 0.6,
}));

/**
 * Dusk over the Khasi hills: a deep indigo sky with a violet and cyan glow, a quiet
 * star field, and layered ridgelines wrapped in drifting cloud — "the abode of clouds".
 * Fills its container width; the art is anchored to the bottom edge.
 */
export default function MeghalayaSky({ height, animated = true, style }: MeghalayaSkyProps) {
  const uid = useId().replace(/:/g, '');
  const drift = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!animated) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(drift, { toValue: 1, duration: 16000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(drift, { toValue: 0, duration: 16000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [animated, drift]);

  const near = drift.interpolate({ inputRange: [0, 1], outputRange: [-18, 18] });
  const far = drift.interpolate({ inputRange: [0, 1], outputRange: [14, -14] });

  return (
    <View style={[styles.wrap, { height }, style]} pointerEvents="none">
      <Svg width="100%" height="100%" viewBox="0 0 400 320" preserveAspectRatio="xMidYMax slice" style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id={`sky${uid}`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#050A1F" />
            <Stop offset="0.45" stopColor="#101E57" />
            <Stop offset="1" stopColor="#2B45B5" />
          </LinearGradient>
          <RadialGradient id={`violet${uid}`} cx="330" cy="70" r="190" gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor="#8B5CF6" stopOpacity="0.55" />
            <Stop offset="1" stopColor="#8B5CF6" stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id={`cyan${uid}`} cx="40" cy="230" r="170" gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor="#22D3EE" stopOpacity="0.32" />
            <Stop offset="1" stopColor="#22D3EE" stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id={`moon${uid}`} cx="318" cy="64" r="34" gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.9" />
            <Stop offset="0.35" stopColor="#E0E7FF" stopOpacity="0.55" />
            <Stop offset="1" stopColor="#E0E7FF" stopOpacity="0" />
          </RadialGradient>
          <LinearGradient id={`ridge1${uid}`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#4863D4" stopOpacity="0.9" />
            <Stop offset="1" stopColor="#1E2F86" stopOpacity="0.9" />
          </LinearGradient>
          <LinearGradient id={`ridge2${uid}`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#1F2F80" />
            <Stop offset="1" stopColor="#15225F" />
          </LinearGradient>
          <LinearGradient id={`ridge3${uid}`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#111B4E" />
            <Stop offset="1" stopColor="#0B133A" />
          </LinearGradient>
          <RadialGradient id={`mist${uid}`} cx="0.5" cy="0.5" r="0.5">
            <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.22" />
            <Stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
          </RadialGradient>
        </Defs>

        <Rect x="0" y="0" width="400" height="320" fill={`url(#sky${uid})`} />
        <Rect x="0" y="0" width="400" height="320" fill={`url(#violet${uid})`} />
        <Rect x="0" y="0" width="400" height="320" fill={`url(#cyan${uid})`} />

        <G>
          {STARS.map((s, i) => (
            <Circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#FFFFFF" opacity={s.o} />
          ))}
        </G>
        <Circle cx="318" cy="64" r="34" fill={`url(#moon${uid})`} />
        <Circle cx="318" cy="64" r="9" fill="#F8FAFF" opacity="0.95" />

        {/* Far ridge with a veil of cloud resting in its valleys */}
        <Path
          d="M0 250 C 30 238, 58 232, 86 238 C 112 244, 128 226, 160 222 C 190 218, 214 234, 240 233 C 270 232, 292 214, 324 213 C 356 212, 378 226, 400 223 L 400 320 L 0 320 Z"
          fill={`url(#ridge1${uid})`}
        />
        <Ellipse cx="110" cy="248" rx="130" ry="16" fill={`url(#mist${uid})`} />
        <Ellipse cx="320" cy="236" rx="120" ry="14" fill={`url(#mist${uid})`} />

        <Path
          d="M0 274 C 36 262, 70 257, 104 264 C 136 271, 162 252, 200 250 C 236 248, 256 266, 290 265 C 326 264, 356 246, 400 249 L 400 320 L 0 320 Z"
          fill={`url(#ridge2${uid})`}
        />
        <Ellipse cx="230" cy="270" rx="160" ry="14" fill={`url(#mist${uid})`} />

        {/* Near ridge, pines along the crest at the edges */}
        <Path
          d="M0 296 C 40 286, 76 283, 116 289 C 150 294, 180 280, 220 280 C 262 280, 290 293, 330 290 C 362 288, 384 279, 400 277 L 400 320 L 0 320 Z"
          fill={`url(#ridge3${uid})`}
        />
        <G fill="#0B133A">
          {[18, 28, 38, 362, 372, 384].map((x, i) => {
            const base = x < 100 ? 292 : 284;
            const h = 10 + (i % 3) * 4;
            return <Path key={x} d={`M${x} ${base - h} L ${x - 4.5} ${base} L ${x + 4.5} ${base} Z`} />;
          })}
        </G>
      </Svg>

      <Animated.View style={[styles.cloudLayer, { transform: [{ translateX: far }] }]}>
        <Svg width="100%" height="100%" viewBox="0 0 400 320" preserveAspectRatio="xMidYMax slice">
          <Defs>
            <RadialGradient id={`cloudA${uid}`} cx="0.5" cy="0.5" r="0.5">
              <Stop offset="0" stopColor="#C7D2FE" stopOpacity="0.16" />
              <Stop offset="1" stopColor="#C7D2FE" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Ellipse cx="90" cy="150" rx="120" ry="22" fill={`url(#cloudA${uid})`} />
          <Ellipse cx="300" cy="190" rx="130" ry="20" fill={`url(#cloudA${uid})`} />
        </Svg>
      </Animated.View>
      <Animated.View style={[styles.cloudLayer, { transform: [{ translateX: near }] }]}>
        <Svg width="100%" height="100%" viewBox="0 0 400 320" preserveAspectRatio="xMidYMax slice">
          <Defs>
            <RadialGradient id={`cloudB${uid}`} cx="0.5" cy="0.5" r="0.5">
              <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.2" />
              <Stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Ellipse cx="310" cy="258" rx="120" ry="18" fill={`url(#cloudB${uid})`} />
          <Ellipse cx="60" cy="282" rx="130" ry="18" fill={`url(#cloudB${uid})`} />
        </Svg>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { overflow: 'hidden', backgroundColor: '#0B153F' },
  cloudLayer: { position: 'absolute', top: 0, left: -20, right: -20, bottom: 0 },
});
