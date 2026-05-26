import React, { createContext, useContext, useState, useEffect } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LightColors, DarkColors, ColorScheme } from '../constants/colors';

function enableWebTransitions() {
  if (Platform.OS !== 'web') return;
  try {
    const doc = (global as any).document;
    if (!doc?.head) return;
    let style = doc.getElementById('riv-theme-style') as any;
    if (!style) {
      style = doc.createElement('style');
      style.id = 'riv-theme-style';
      doc.head.appendChild(style);
    }
    style.textContent =
      '* { transition: background-color 300ms ease, color 300ms ease, border-color 300ms ease !important; }';
  } catch (_) {}
}

function disableWebTransitions() {
  if (Platform.OS !== 'web') return;
  try {
    const doc = (global as any).document;
    const style = doc?.getElementById?.('riv-theme-style') as any;
    if (style) style.textContent = '';
  } catch (_) {}
}

interface ThemeContextType {
  isDark: boolean;
  colors: ColorScheme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  isDark: false,
  colors: LightColors,
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('riv_dark_mode').then(val => {
      if (val === 'true') setIsDark(true);
    });
  }, []);

  const toggleTheme = async () => {
    enableWebTransitions();
    const next = !isDark;
    setIsDark(next);
    await AsyncStorage.setItem('riv_dark_mode', String(next));
    setTimeout(disableWebTransitions, 350);
  };

  return (
    <ThemeContext.Provider value={{ isDark, colors: isDark ? DarkColors : LightColors, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
