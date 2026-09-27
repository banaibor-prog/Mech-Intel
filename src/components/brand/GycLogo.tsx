import React, { useId } from 'react';
import Svg, { Defs, G, LinearGradient, Path, Stop } from 'react-native-svg';
import {
  BRAND_GRADIENT,
  BRAND_GRADIENT_VECTOR,
  LOGO_ARMS,
  LOGO_ASPECT,
  LOGO_HEAD,
  LOGO_RIBS,
  LOGO_VIEWBOX,
  LOGO_WEAVE,
  LOGO_WINGS,
} from './logoPaths';

interface GycLogoProps {
  /** Width in pixels; height follows the mark's aspect ratio. */
  size?: number;
  /** Solid colour instead of the brand gradient (e.g. white on dark headers). */
  color?: string;
}

export default function GycLogo({ size = 64, color }: GycLogoProps): React.JSX.Element {
  const gradientId = `gyc${useId().replace(/:/g, '')}`;
  const paint = color ?? `url(#${gradientId})`;

  return (
    <Svg width={size} height={size * LOGO_ASPECT} viewBox={LOGO_VIEWBOX}>
      {color ? null : (
        <Defs>
          <LinearGradient id={gradientId} gradientUnits="userSpaceOnUse" {...BRAND_GRADIENT_VECTOR}>
            {BRAND_GRADIENT.map((s) => (
              <Stop key={s.offset} offset={s.offset} stopColor={s.color} />
            ))}
          </LinearGradient>
        </Defs>
      )}
      <G fill={paint}>
        {LOGO_WINGS.map((d) => (
          <Path key={d} d={d} />
        ))}
        {LOGO_RIBS.map((d) => (
          <Path key={d} d={d} />
        ))}
        <Path d={LOGO_WEAVE} fillRule="evenodd" />
        <Path d={LOGO_HEAD} />
        <Path d={LOGO_ARMS} />
      </G>
    </Svg>
  );
}
