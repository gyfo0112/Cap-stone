import { useEffect, useState } from 'react';

// useState와 같지만 값을 localStorage에 저장해서 새로고침해도 유지된다 (설정값용).
export function useStoredState(key, initial) {
  const [value, setValue] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(key)) ?? initial;
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // 저장소를 못 쓰는 환경(사생활 보호 모드 등)이면 이번 세션에서만 유지
    }
  }, [key, value]);

  return [value, setValue];
}
