/**
 * ThemeToggle Component
 * =====================
 * 
 * A simple toggle button for switching between light and dark themes.
 * Uses next-themes for theme management.
 * 
 * Features:
 * - Sun icon for light mode
 * - Moon icon for dark mode
 * - Smooth transition animation
 * - Accessible with aria labels
 */

'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render until mounted to avoid hydration mismatch
  if (!mounted) {
    return (
      <button
        className="
          p-2
          rounded-md
          border border-[var(--border)]
          bg-[var(--card-bg)]
          text-[var(--text-secondary)]
        "
        aria-label="Toggle theme"
      >
        <div className="w-5 h-5" />
      </button>
    );
  }

  const isDark = theme === 'dark';

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="
        p-2
        rounded-md
        border border-[var(--border)]
        bg-[var(--card-bg)]
        text-[var(--text-secondary)]
        hover:bg-[var(--card-bg-alt)]
        hover:border-[var(--border-hover)]
        hover:text-[var(--text-primary)]
        transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2
      "
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? (
        <Sun className="w-5 h-5" />
      ) : (
        <Moon className="w-5 h-5" />
      )}
    </button>
  );
}
