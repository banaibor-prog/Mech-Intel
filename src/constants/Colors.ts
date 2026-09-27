export const Colors = {
  // Core neutrals — slight cool/indigo bias rather than dead grey
  background: '#F6F6FA',
  surface: '#FFFFFF',
  surfaceAlt: '#EEEEF4',

  // Text
  text: '#16161F',
  textLight: '#68697C',
  textMuted: '#9C9DB0',

  // "Light black" accents — near-black with a cool cast, used for primary actions/nav
  ink: '#1A1B26',
  inkSoft: '#2B2C3D',

  border: '#E5E5EF',
  borderStrong: '#D3D3E2',

  // Functional
  primary: '#1A1B26',
  accent: '#5B5FEF',
  accentSoft: '#EEEEFD',
  success: '#1F9D55',
  successSoft: '#E3F5EA',
  warning: '#C77B12',
  warningSoft: '#FBF0DF',
  error: '#D8433D',
  errorSoft: '#FBE8E7',

  // Overlays / gradients
  overlayLight: 'rgba(255,255,255,0.6)',
  overlayDark: 'rgba(17,17,26,0.55)',

  white: '#FFFFFF',
  black: '#0A0A10',
};

export const Gradients = {
  hero: ['#1A1B26', '#33344A', '#5B5FEF'] as const,
  card: ['#FFFFFF', '#F4F4FA'] as const,
  subtle: ['#FFFFFF', '#ECECF7'] as const,
};
