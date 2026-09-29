import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'mf-theme';
const DARK_QUERY = '(prefers-color-scheme: dark)';

function resolve(theme) {
  if (theme === 'system') {
    return window.matchMedia(DARK_QUERY).matches ? 'dark' : 'light';
  }
  return theme;
}

// 설정 화면의 라이트/다크/시스템 선택을 실제 document에 반영하고 localStorage에 저장.
// 'system'이면 OS 설정 변경도 실시간으로 따라간다.
export function useTheme() {
  const [theme, setThemeState] = useState(
    () => localStorage.getItem(STORAGE_KEY) || 'light',
  );

  useEffect(() => {
    document.documentElement.dataset.theme = resolve(theme);

    if (theme !== 'system') return;
    const mq = window.matchMedia(DARK_QUERY);
    const onChange = () => {
      document.documentElement.dataset.theme = resolve('system');
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [theme]);

  const setTheme = useCallback((next) => {
    localStorage.setItem(STORAGE_KEY, next);
    setThemeState(next);
  }, []);

  return [theme, setTheme];
}
