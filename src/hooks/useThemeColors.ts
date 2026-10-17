import { useColorScheme } from 'react-native';
import { Colors } from '../constants/theme';

export type ThemeColors = typeof Colors.light;

export function useThemeColors(): ThemeColors {
  const scheme = useColorScheme();
  return Colors[scheme === 'dark' ? 'dark' : 'light'];
}
