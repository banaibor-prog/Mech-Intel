import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Height of the floating tab bar plus its margin; tab root screens pad their content by this. */
export const TAB_BAR_SPACE = 84;

export function useTabBarSpace(): number {
  return useSafeAreaInsets().bottom + TAB_BAR_SPACE;
}
