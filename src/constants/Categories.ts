import { AppIconName } from '../components/AppIcon';

export interface CategoryStyle {
  color: string;
  soft: string;
  icon: AppIconName;
}

// One distinct hue per kind of work so map pins and chips read at a glance.
export const CATEGORY_STYLES: Record<string, CategoryStyle> = {
  Electrician: { color: '#F59E0B', soft: '#FEF3C7', icon: 'bolt' },
  Plumber: { color: '#0EA5E9', soft: '#E0F2FE', icon: 'droplet' },
  'House Cleaner': { color: '#14B8A6', soft: '#CCFBF1', icon: 'broom' },
  Helper: { color: '#64748B', soft: '#E2E8F0', icon: 'hand' },
  Carpenter: { color: '#B08D57', soft: '#F5EEE2', icon: 'hammer' },
  Painter: { color: '#EC4899', soft: '#FCE7F3', icon: 'brush' },
  Mechanic: { color: '#EF4444', soft: '#FEE2E2', icon: 'tool' },
  Gardener: { color: '#22C55E', soft: '#DCFCE7', icon: 'leaf' },
  Cook: { color: '#F97316', soft: '#FFEDD5', icon: 'pot' },
  Artist: { color: '#D946EF', soft: '#FAE8FF', icon: 'palette' },
  Musician: { color: '#8B5CF6', soft: '#EDE9FE', icon: 'music' },
  Photographer: { color: '#6366F1', soft: '#E0E7FF', icon: 'camera' },
  Tutor: { color: '#2563EB', soft: '#DBEAFE', icon: 'book' },
  'Freelance Writer': { color: '#A16207', soft: '#FEF9C3', icon: 'pen' },
  'Freelance Designer': { color: '#E11D48', soft: '#FFE4E6', icon: 'sparkles' },
  'Freelance Developer': { color: '#06B6D4', soft: '#CFFAFE', icon: 'code' },
  Other: { color: '#94A3B8', soft: '#F1F5F9', icon: 'briefcase' },
};

export function categoryStyle(skill?: string): CategoryStyle {
  return (skill && CATEGORY_STYLES[skill]) || CATEGORY_STYLES.Other;
}
