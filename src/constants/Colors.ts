// Brand palette from the GYC identity, grounded in Meghalaya — "the abode of clouds":
// sky blue and community violet from the logo gradient, misty cloud-white surfaces,
// forest green for success and a bamboo tan for warm craft accents.
export const Palette = {
  sky: '#3B82F6',
  community: '#7C3AED',
  friendly: '#22D3EE',
  strength: '#0F172A',
  clean: '#E5E7EB',
  forest: '#15803D',
  moss: '#4D7C0F',
  bamboo: '#B08D57',
  mist: '#F4F7FB',
};

export const Colors = {
  background: Palette.mist,
  surface: '#FFFFFF',
  surfaceAlt: '#EAF0F8',

  text: Palette.strength,
  textLight: '#475569',
  textMuted: '#94A3B8',

  ink: Palette.strength,
  inkSoft: '#1E293B',

  border: Palette.clean,
  borderStrong: '#CBD5E1',

  primary: Palette.strength,
  accent: Palette.sky,
  accentSoft: '#E6EFFE',
  community: Palette.community,
  communitySoft: '#F1EAFE',
  friendly: Palette.friendly,
  friendlySoft: '#DDF8FD',
  bamboo: Palette.bamboo,
  bambooSoft: '#F5EEE2',

  success: Palette.forest,
  successSoft: '#E3F4E8',
  warning: '#B7791F',
  warningSoft: '#FBF1DD',
  error: '#DC2626',
  errorSoft: '#FDE8E8',

  overlayLight: 'rgba(255,255,255,0.7)',
  overlayDark: 'rgba(15,23,42,0.55)',

  white: '#FFFFFF',
  black: '#020617',
};

export const Gradients = {
  brand: [Palette.sky, '#4C62F2', Palette.community] as const,
  hero: ['#0F172A', '#1E3A8A', Palette.sky] as const,
  sky: ['#DCEBFF', '#EEF4FC', Palette.mist] as const,
  card: ['#FFFFFF', '#F6F9FD'] as const,
  subtle: ['#FFFFFF', '#EEF3FA'] as const,
};
