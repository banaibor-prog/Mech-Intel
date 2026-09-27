import React, { useId } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import Svg, { Defs, G, Path, Pattern, Rect } from 'react-native-svg';
import { Colors } from '../../constants/Colors';

interface KhasiWeaveProps {
  height?: number;
  color?: string;
  opacity?: number;
  /** Thin border rules above and below the motif row, like a woven jainsem border. */
  bordered?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** A repeating band of Khasi weave motifs (diamond with cross, then an X), used as a divider/accent. */
export default function KhasiWeave({
  height = 12,
  color = Colors.accent,
  opacity = 1,
  bordered = true,
  style,
}: KhasiWeaveProps): React.JSX.Element {
  const id = `weave${useId().replace(/:/g, '')}`;
  const h = 12;
  const w = 16;
  return (
    <Svg width="100%" height={height} style={style} opacity={opacity}>
      <Defs>
        <Pattern id={id} patternUnits="userSpaceOnUse" width={(w * height) / h} height={height} viewBox={`0 0 ${w} ${h}`}>
          <G fill="none" stroke={color} strokeWidth={1.1} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M4 3 L7 6 L4 9 L1 6 Z M4 4.8 V7.2 M2.8 6 H5.2" />
            <Path d="M10.6 4.1 L13.4 7.9 M13.4 4.1 L10.6 7.9" />
          </G>
        </Pattern>
      </Defs>
      <Rect x={0} y={0} width="100%" height={height} fill={`url(#${id})`} />
      {bordered ? (
        <>
          <Rect x={0} y={0} width="100%" height={Math.max(1, height * 0.07)} fill={color} />
          <Rect x={0} y={height - Math.max(1, height * 0.07)} width="100%" height={Math.max(1, height * 0.07)} fill={color} />
        </>
      ) : null}
    </Svg>
  );
}
