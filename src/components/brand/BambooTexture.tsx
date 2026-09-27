import React, { useId } from 'react';
import { StyleProp, StyleSheet, ViewStyle } from 'react-native';
import Svg, { Defs, G, Path, Pattern, Rect } from 'react-native-svg';
import { Colors } from '../../constants/Colors';

interface BambooTextureProps {
  color?: string;
  opacity?: number;
  style?: StyleProp<ViewStyle>;
}

/** Faint vertical bamboo stalks with nodes; fills its parent as a background texture. */
export default function BambooTexture({
  color = Colors.bamboo,
  opacity = 0.12,
  style,
}: BambooTextureProps): React.JSX.Element {
  const id = `bamboo${useId().replace(/:/g, '')}`;
  return (
    <Svg style={[StyleSheet.absoluteFill, style]} opacity={opacity} pointerEvents="none">
      <Defs>
        <Pattern id={id} patternUnits="userSpaceOnUse" width={28} height={96}>
          <G fill="none" stroke={color} strokeLinecap="round">
            <Path d="M7 0 V96" strokeWidth={5} />
            <Path d="M4 30 Q7 27 10 30 M4 78 Q7 75 10 78" strokeWidth={1.6} />
            <Path d="M21 -8 V104" strokeWidth={3.4} />
            <Path d="M18.8 8 Q21 6 23.2 8 M18.8 54 Q21 52 23.2 54" strokeWidth={1.3} />
            <Path d="M10 30 Q15 26 17 20" strokeWidth={1} />
          </G>
        </Pattern>
      </Defs>
      <Rect width="100%" height="100%" fill={`url(#${id})`} />
    </Svg>
  );
}
