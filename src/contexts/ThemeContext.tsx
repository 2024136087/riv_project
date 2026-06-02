import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DARK_KEY = 'riv_dark_mode';

export const lightColors = {
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

export const darkColors = {
  primary: '#6B8AFF',
  primaryLight: '#1C2560',
  background: '#0F0F13',
  card: '#1A1A24',
  textPrimary: '#EAEAF0',
  textSecondary: '#8A8A9A',
  textHint: '#5A5A6A',
  border: '#2A2A38',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  white: '#FFFFFF',
  black: '#000000',
  aiMessage: '#1C2560',
  userMessage: '#6B8AFF',
};

export type ColorScheme = typeof lightColors;

interface ThemeContextType {
  isDark: boolean;
  colors: ColorScheme;
  toggleDark: (value: boolean) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType>({
  isDark: false,
  colors: lightColors,
  toggleDark: async () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    AsyncStorage.getItem(DARK_KEY).then(val => {
      if (val === 'true') setIsDark(true);
    });
  }, []);

  const toggleDark = useCallback(async (value: boolean) => {
    fadeAnim.stopAnimation();
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 160,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (!finished) return;
      setIsDark(value);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });
    await AsyncStorage.setItem(DARK_KEY, String(value));
  }, [fadeAnim]);

  return (
    <ThemeContext.Provider value={{ isDark, colors: isDark ? darkColors : lightColors, toggleDark }}>
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        {children}
      </Animated.View>
    </ThemeContext.Provider>
  );
}

export function useColors(): ColorScheme {
  return useContext(ThemeContext).colors;
}

export function useTheme(): ThemeContextType {
  return useContext(ThemeContext);
}
