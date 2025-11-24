import React, { createContext, useContext, useMemo, useState, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { lightTheme, darkTheme, AppTheme } from './index';

type ThemeContextType = {
  theme: AppTheme;
  mode: 'light' | 'dark' | 'system';
  setMode: (mode: 'light' | 'dark' | 'system') => void;
};

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemColorScheme = useColorScheme(); // "light" | "dark" | null
  const [mode, setMode] = useState<'light' | 'dark' | 'system'>('system');

  const theme = useMemo<AppTheme>(() => {
    const activeMode = mode === 'system' ? systemColorScheme || 'light' : mode;
    return activeMode === 'dark' ? darkTheme : lightTheme;
  }, [mode, systemColorScheme]);

  return (
    <ThemeContext.Provider value={{ theme, mode, setMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used inside ThemeProvider');
  return context;
}
