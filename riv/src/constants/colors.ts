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
  primary: '#3D5AFE',
  primaryLight: '#E8ECFF',
  background: '#F5F6FA',
  card: '#FFFFFF',
  textPrimary: '#1A1A2E',
  textSecondary: '#6B7280',
  textHint: '#9CA3AF',
  border: '#E5E7EB',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  white: '#FFFFFF',
  black: '#000000',
  aiMessage: '#EEF2FF',
  userMessage: '#3D5AFE',
};

export const DarkColors: ColorScheme = {
  primary: '#6B8AFF',
  primaryLight: '#1A2260',
  background: '#0F0F1A',
  card: '#1C1C2E',
  textPrimary: '#E8E8F5',
  textSecondary: '#9090A8',
  textHint: '#5A5A70',
  border: '#2A2A3E',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  white: '#FFFFFF',
  black: '#000000',
  aiMessage: '#1A2260',
  userMessage: '#3D5AFE',
};

export const Colors = LightColors;
