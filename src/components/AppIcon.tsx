import React from 'react';
import Svg, { Circle, Line, Path, Polyline, Rect } from 'react-native-svg';

export type AppIconName =
  | 'home'
  | 'search'
  | 'network'
  | 'calendar'
  | 'user'
  | 'bell'
  | 'filter'
  | 'plus'
  | 'briefcase'
  | 'bookmark'
  | 'location'
  | 'clock'
  | 'chevronDown'
  | 'arrowRight'
  | 'star'
  | 'verified'
  | 'users'
  | 'bolt'
  | 'tool'
  | 'droplet'
  | 'sparkles'
  | 'monitor'
  | 'camera'
  | 'book'
  | 'hammer'
  | 'broom'
  | 'hand'
  | 'brush'
  | 'leaf'
  | 'pot'
  | 'palette'
  | 'music'
  | 'pen'
  | 'code'
  | 'layers'
  | 'locate'
  | 'fire'
  | 'minus'
  | 'close'
  | 'map'
  | 'list';

interface Props {
  name: AppIconName;
  size?: number;
  color?: string;
  filled?: boolean;
}

export default function AppIcon({ name, size = 20, color = '#0F172A', filled = false }: Props) {
  const common = { stroke: color, strokeWidth: 1.9, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" accessibilityElementsHidden>
      {name === 'home' ? <><Path d="M3 10.8 12 3l9 7.8" {...common} /><Path d="M5.5 9.7V21h13V9.7M9.5 21v-6h5v6" {...common} fill={filled ? color : 'none'} /></> : null}
      {name === 'search' ? <><Circle cx="10.8" cy="10.8" r="6.6" {...common} /><Line x1="16" y1="16" x2="21" y2="21" {...common} /></> : null}
      {name === 'network' ? <><Circle cx="7" cy="12" r="3" {...common} /><Circle cx="17" cy="7" r="3" {...common} /><Circle cx="17" cy="17" r="3" {...common} /><Line x1="9.7" y1="10.6" x2="14.3" y2="8.4" {...common} /><Line x1="9.7" y1="13.4" x2="14.3" y2="15.6" {...common} /></> : null}
      {name === 'calendar' ? <><Rect x="3" y="5" width="18" height="16" rx="2.5" {...common} /><Line x1="7" y1="3" x2="7" y2="7" {...common} /><Line x1="17" y1="3" x2="17" y2="7" {...common} /><Line x1="3" y1="10" x2="21" y2="10" {...common} /></> : null}
      {name === 'user' ? <><Circle cx="12" cy="8" r="4" {...common} fill={filled ? color : 'none'} /><Path d="M4.5 21c.7-4.2 3.2-6.4 7.5-6.4s6.8 2.2 7.5 6.4" {...common} fill={filled ? color : 'none'} /></> : null}
      {name === 'bell' ? <><Path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" {...common} /><Path d="M10 21h4" {...common} /></> : null}
      {name === 'filter' ? <><Line x1="4" y1="6" x2="20" y2="6" {...common} /><Circle cx="9" cy="6" r="2" fill={color} /><Line x1="4" y1="18" x2="20" y2="18" {...common} /><Circle cx="15" cy="18" r="2" fill={color} /></> : null}
      {name === 'plus' ? <><Line x1="12" y1="5" x2="12" y2="19" {...common} /><Line x1="5" y1="12" x2="19" y2="12" {...common} /></> : null}
      {name === 'briefcase' ? <><Rect x="3" y="7" width="18" height="13" rx="2.5" {...common} /><Path d="M9 7V4h6v3M3 12h18M10 12v2h4v-2" {...common} /></> : null}
      {name === 'bookmark' ? <Path d="M6 3.5h12v17L12 17l-6 3.5z" {...common} fill={filled ? color : 'none'} /> : null}
      {name === 'location' ? <><Path d="M20 10c0 5.5-8 11-8 11S4 15.5 4 10a8 8 0 1 1 16 0Z" {...common} /><Circle cx="12" cy="10" r="2.5" {...common} /></> : null}
      {name === 'clock' ? <><Circle cx="12" cy="12" r="9" {...common} /><Polyline points="12,7 12,12 15.5,14" {...common} /></> : null}
      {name === 'chevronDown' ? <Polyline points="6,9 12,15 18,9" {...common} /> : null}
      {name === 'arrowRight' ? <><Line x1="5" y1="12" x2="19" y2="12" {...common} /><Polyline points="14,7 19,12 14,17" {...common} /></> : null}
      {name === 'star' ? <Path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" {...common} fill={filled ? color : 'none'} /> : null}
      {name === 'verified' ? <><Circle cx="12" cy="12" r="9" {...common} fill={filled ? color : 'none'} /><Polyline points="8,12.2 10.8,15 16.5,9" {...common} stroke={filled ? '#FFFFFF' : color} /></> : null}
      {name === 'users' ? <><Circle cx="9" cy="9" r="3" {...common} /><Path d="M3.5 20c.5-4 2.3-6 5.5-6s5 2 5.5 6" {...common} /><Circle cx="17" cy="10" r="2.3" {...common} /><Path d="M15.5 15.5c3.1-.4 4.7 1.1 5 4.5" {...common} /></> : null}
      {name === 'bolt' ? <Path d="m13.5 2-8 12h6l-1 8 8-12h-6z" {...common} fill={filled ? color : 'none'} /> : null}
      {name === 'tool' ? <Path d="M14.5 6.5a4.5 4.5 0 0 0-5.7 5.7L3 18l3 3 5.8-5.8a4.5 4.5 0 0 0 5.7-5.7l-2.8 2.8-3-3z" {...common} /> : null}
      {name === 'droplet' ? <Path d="M12 3s6 6.6 6 11a6 6 0 0 1-12 0c0-4.4 6-11 6-11Z" {...common} fill={filled ? color : 'none'} /> : null}
      {name === 'sparkles' ? <><Path d="m12 3 1.2 4.3L17 9l-3.8 1.7L12 15l-1.2-4.3L7 9l3.8-1.7z" {...common} /><Path d="m19 15 .6 2.1 1.9.9-1.9.9L19 21l-.6-2.1-1.9-.9 1.9-.9z" {...common} /></> : null}
      {name === 'monitor' ? <><Rect x="3" y="4" width="18" height="13" rx="2" {...common} /><Line x1="8" y1="21" x2="16" y2="21" {...common} /><Line x1="12" y1="17" x2="12" y2="21" {...common} /></> : null}
      {name === 'camera' ? <><Rect x="3" y="6" width="18" height="14" rx="2.5" {...common} /><Path d="M8 6 9.5 3.5h5L16 6" {...common} /><Circle cx="12" cy="13" r="3.5" {...common} /></> : null}
      {name === 'book' ? <><Path d="M4 4.5h6.2c1 0 1.8.8 1.8 1.8V20c0-1.1-.9-2-2-2H4z" {...common} /><Path d="M20 4.5h-6.2c-1 0-1.8.8-1.8 1.8V20c0-1.1.9-2 2-2h6z" {...common} /></> : null}
      {name === 'hammer' ? <><Path d="M14 4.5 19.5 10 17 12.5 11.5 7z" {...common} fill={filled ? color : 'none'} /><Path d="M11.5 7 9.5 5l2-2 5 1.5M13 10.5 4 19.5 5.5 21l9-9" {...common} /></> : null}
      {name === 'broom' ? <><Path d="M20 3 12.5 10.5" {...common} /><Path d="M11 9.5c-2.5 0-4.5 1-5.5 3L3 20l7.5-2.5c2-1 3-3 3-5.5z" {...common} fill={filled ? color : 'none'} /><Path d="M7 16.5 5 18.5" {...common} /></> : null}
      {name === 'hand' ? <Path d="M8 13V5.5a1.5 1.5 0 0 1 3 0V11m0-6.5V4a1.5 1.5 0 0 1 3 0v7m0-5.5a1.5 1.5 0 0 1 3 0V12m0-3.5a1.5 1.5 0 0 1 3 0V15a6 6 0 0 1-6 6h-1.5a6 6 0 0 1-4.8-2.4L4.6 15.8a1.6 1.6 0 0 1 2.4-2.1L8 14.8" {...common} /> : null}
      {name === 'brush' ? <><Path d="M20 4 11 13" {...common} /><Path d="M10.5 12.5c-2.5-.5-5 1-5 4 0 1.5-1 2.5-2.5 3 3 1.5 8 1 8.5-3.5z" {...common} fill={filled ? color : 'none'} /></> : null}
      {name === 'leaf' ? <><Path d="M5 19C4 11 9 4.5 20 4c.5 11-6 16-14 15" {...common} fill={filled ? color : 'none'} /><Path d="M4 20 13 11" {...common} /></> : null}
      {name === 'pot' ? <><Path d="M4 10h16v6a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4z" {...common} fill={filled ? color : 'none'} /><Path d="M2 10h2m16 0h2M9 7c0-1 1-1.5 1-2.5M14 7c0-1 1-1.5 1-2.5" {...common} /></> : null}
      {name === 'palette' ? <><Path d="M12 3a9 9 0 1 0 0 18c1.4 0 2-1 1.5-2.2-.6-1.4.4-2.8 1.9-2.8H18a3 3 0 0 0 3-3c0-5.5-4-10-9-10Z" {...common} /><Circle cx="7.5" cy="11" r="1.2" fill={color} /><Circle cx="10.5" cy="7" r="1.2" fill={color} /><Circle cx="15" cy="7.5" r="1.2" fill={color} /></> : null}
      {name === 'music' ? <><Path d="M9 18V5l11-2v13" {...common} /><Circle cx="6.5" cy="18" r="2.5" {...common} fill={filled ? color : 'none'} /><Circle cx="17.5" cy="16" r="2.5" {...common} fill={filled ? color : 'none'} /></> : null}
      {name === 'pen' ? <><Path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4z" {...common} fill={filled ? color : 'none'} /><Line x1="14" y1="6" x2="17" y2="9" {...common} /></> : null}
      {name === 'code' ? <><Polyline points="8,7 3,12 8,17" {...common} /><Polyline points="16,7 21,12 16,17" {...common} /><Line x1="13.5" y1="4.5" x2="10.5" y2="19.5" {...common} /></> : null}
      {name === 'layers' ? <><Path d="M12 3 2.5 8 12 13l9.5-5z" {...common} fill={filled ? color : 'none'} /><Path d="m2.5 12.5 9.5 5 9.5-5M2.5 17l9.5 5 9.5-5" {...common} /></> : null}
      {name === 'locate' ? <><Circle cx="12" cy="12" r="7" {...common} /><Circle cx="12" cy="12" r="2.5" fill={color} /><Path d="M12 2v3M12 19v3M2 12h3M19 12h3" {...common} /></> : null}
      {name === 'fire' ? <Path d="M12 22c4 0 7-2.7 7-7 0-4-3-6.5-4-9.5-1 2-2 3-3.5 3.5C11 6 10 3.5 8.5 2 8 6 5 8.5 5 13.5 5 19 8.5 22 12 22Z" {...common} fill={filled ? color : 'none'} /> : null}
      {name === 'minus' ? <Line x1="5" y1="12" x2="19" y2="12" {...common} /> : null}
      {name === 'close' ? <><Line x1="6" y1="6" x2="18" y2="18" {...common} /><Line x1="18" y1="6" x2="6" y2="18" {...common} /></> : null}
      {name === 'map' ? <><Path d="M9 4 3 6.5v13.5L9 17.5l6 2.5 6-2.5V4L15 6.5z" {...common} fill={filled ? color : 'none'} /><Line x1="9" y1="4" x2="9" y2="17.5" {...common} /><Line x1="15" y1="6.5" x2="15" y2="20" {...common} /></> : null}
      {name === 'list' ? <><Line x1="9" y1="6" x2="20" y2="6" {...common} /><Line x1="9" y1="12" x2="20" y2="12" {...common} /><Line x1="9" y1="18" x2="20" y2="18" {...common} /><Circle cx="4.5" cy="6" r="1.2" fill={color} /><Circle cx="4.5" cy="12" r="1.2" fill={color} /><Circle cx="4.5" cy="18" r="1.2" fill={color} /></> : null}
    </Svg>
  );
}
