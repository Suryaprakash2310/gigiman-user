import { BaseTheme, radius, shadow, spacing, typography, zIndex } from './base';

export type AppTheme = BaseTheme & {
  colors: {
    background: string;
    surface: string;
    primary: string;
    primaryDark: string;
    accent: string;
    text: string;
    textMuted: string;
    border: string;
    success: string;
    danger: string;
    cardShadow: string;
    splashColor: string;
    button:string;
  };
  dark: boolean;
};

// Premium, Attractive, Psychological Light Theme
export const lightTheme: AppTheme = {
  spacing,
  radius,
  typography,
  zIndex,
  shadow,
  dark: false,
  colors: {
    background: '#F9FAFB',    //'#F9FAFB',
    surface: '#FFFFFF',
    primary: '#1d1145',              //'#285B5B',       // soft teal
    primaryDark: '#07533B',
    accent: '#F59E0B',        // warm orange – action, excitement
    text: '#0F172A',
    textMuted: '#64748B',
    border: '#E2E8F0',
    success: '#10B981',
    danger: '#EF4444',
    cardShadow: 'rgba(0,0,0,0.06)',
    splashColor: '#285B5B',
    button:'#c02bffff'
  },
};

// Premium Dark Theme (not too black, psychological comfort)
export const darkTheme: AppTheme = {
  spacing,
  radius,
  typography,
  zIndex,
  shadow,
  dark: true,
  colors: {
    background: '#0B1220',
    surface: '#101826',
    primary: '#285B5B',        // dark teal
    primaryDark: '#1DB184',
    accent: '#FBBF24',         // warm highlight
    text: '#E6EEF3',
    textMuted: '#94A3B8',  //#94A3B8
    border: '#1E293B',
    success: '#22D3EE',
    danger: '#F87171',
    cardShadow: 'rgba(0,0,0,0.55)',
    splashColor: '#285B5B',
    button:'#c02bffff'
  },
};


// const { setMode } = useTheme();

// // switch to dark
// setMode('dark');

// // switch to light
// setMode('light');

// // follow system theme
// setMode('system');

// <Button title="Dark Mode" onPress={() => setMode('dark')} />
// <Button title="Light Mode" onPress={() => setMode('light')} />
// <Button title="System" onPress={() => setMode('system')} />
