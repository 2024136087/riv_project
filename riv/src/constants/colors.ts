export type ColorScheme = {
  primary: string;
  primaryLight: string;
  background: string;
  card: string;
  textPrimary: string;
  textSecondary: string;
  textHint: string;
  border: string;
  success: string;
  warning: string;
  error: string;
  white: string;
  black: string;
  aiMessage: string;
  userMessage: string;
};

export const LightColors: ColorScheme = {
  primary: '#4361EE',
  primaryLight: '#EEF1FF',
  background: '#F6F7FB',
  card: '#FFFFFF',
  textPrimary: '#1C1D2E',
  textSecondary: '#6B7285',
  textHint: '#9CA3B0',
  border: '#E8EBF2',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  white: '#FFFFFF',
  black: '#000000',
  aiMessage: '#EEF1FF',
  userMessage: '#4361EE',
};

export const DarkColors: ColorScheme = {
  primary: '#7B93FF',
  primaryLight: '#1A2260',
  background: '#0E0E1B',
  card: '#17172A',
  textPrimary: '#E4E6F0',
  textSecondary: '#8890AA',
  textHint: '#545C76',
  border: '#22223A',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  white: '#FFFFFF',
  black: '#000000',
  aiMessage: '#1A2260',
  userMessage: '#4361EE',
};

export const Colors = LightColors;
