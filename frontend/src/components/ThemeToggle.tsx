import React, { useEffect, useMemo, useState } from 'react';

type ThemeMode = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'theme-mode';

const ThemeToggle: React.FC = () => {
  const [mode, setMode] = useState<ThemeMode>('system');

  const mediaQuery = useMemo(() =>
    window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)'),
  []);

  const applyTheme = (m: ThemeMode) => {
    const root = document.documentElement;
    if (m === 'dark') {
      root.setAttribute('data-theme', 'dark');
    } else if (m === 'light') {
      root.removeAttribute('data-theme');
    } else {
      const prefersDark = mediaQuery?.matches;
      if (prefersDark) {
        root.setAttribute('data-theme', 'dark');
      } else {
        root.removeAttribute('data-theme');
      }
    }
  };

  useEffect(() => {
    const saved = (localStorage.getItem(STORAGE_KEY) as ThemeMode) || 'system';
    setMode(saved);
    applyTheme(saved);

    if (!mediaQuery) return;
    const handler = (e: MediaQueryListEvent) => {
      if (mode === 'system') {
        const root = document.documentElement;
        if (e.matches) {
          root.setAttribute('data-theme', 'dark');
        } else {
          root.removeAttribute('data-theme');
        }
      }
    };
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const onChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as ThemeMode;
    setMode(value);
    localStorage.setItem(STORAGE_KEY, value);
    applyTheme(value);
  };

  return (
    <div className="theme-toggle" aria-label="主题切换">
      <span>主题</span>
      <select value={mode} onChange={onChange} aria-label="选择主题模式">
        <option value="light">亮</option>
        <option value="dark">暗</option>
        <option value="system">跟随系统</option>
      </select>
    </div>
  );
};

export default ThemeToggle;
