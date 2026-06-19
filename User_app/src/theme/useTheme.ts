
import { useTheme as useThemeContext } from './ThemeProvider';

export const useTheme = () => {
  const { theme, mode, setMode } = useThemeContext();
  return { theme, mode, setMode };
};
