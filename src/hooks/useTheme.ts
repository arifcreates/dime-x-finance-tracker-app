import { useState, useEffect } from 'react';

export type Theme = 'light' | 'dark' | 'auto';

export const useTheme = () => {
  const [theme, setTheme] = useState<Theme>(() => {
    // Get theme from user preferences or default to 'light'
    const user = localStorage.getItem('user');
    if (user) {
      const userData = JSON.parse(user);
      return userData.preferences?.theme || 'light';
    }
    return 'light';
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
    const user = localStorage.getItem('user');
    if (user) {
      const userData = JSON.parse(user);
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