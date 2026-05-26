import { useState, useEffect } from 'react';

export type Theme = 'light' | 'dark' | 'auto';

const isTheme = (value: unknown): value is Theme => {
  return value === 'light' || value === 'dark' || value === 'auto';
};

const getStoredUser = () => {
  try {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  } catch (error) {
    console.warn('Ignoring invalid saved user preferences:', error);
    localStorage.removeItem('user');
    return null;
  }
};

export const useTheme = () => {
  const [theme, setTheme] = useState<Theme>(() => {
    const storedTheme = getStoredUser()?.preferences?.theme;
    return isTheme(storedTheme) ? storedTheme : 'light';
  });

  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const updateResolvedTheme = () => {
      if (theme === 'auto') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setResolvedTheme(prefersDark ? 'dark' : 'light');
      } else {
        setResolvedTheme(theme);
      }
    };

    updateResolvedTheme();

    if (theme === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', updateResolvedTheme);
      return () => mediaQuery.removeEventListener('change', updateResolvedTheme);
    }
  }, [theme]);

  useEffect(() => {
    // Apply theme to document
    const root = document.documentElement;
    if (resolvedTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [resolvedTheme]);

  const updateTheme = (newTheme: Theme) => {
    setTheme(newTheme);
    
    // Update user preferences
    const userData = getStoredUser();
    if (userData) {
      userData.preferences = {
        ...userData.preferences,
        theme: newTheme
      };
      localStorage.setItem('user', JSON.stringify(userData));
    }
  };

  return {
    theme,
    resolvedTheme,
    setTheme: updateTheme,
    isDark: resolvedTheme === 'dark'
  };
};
