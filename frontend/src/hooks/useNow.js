import { useEffect, useState } from 'react';

// 지금 시각(ms) — intervalMs마다 갱신해서 "n초 전" 같은 문구가 저절로 바뀌게 한다. null이면 갱신하지 않는다.
export function useNow(intervalMs) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!intervalMs) return undefined;
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}
