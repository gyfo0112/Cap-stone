import { useMemo, useSyncExternalStore } from 'react';
import { getSessionRaw, logout, subscribeSession } from '../data/auth';

// 현재 로그인한 사용자({ userId, name, phone }) — 로그인 전이면 user가 null
export function useAuth() {
  const raw = useSyncExternalStore(subscribeSession, getSessionRaw);
  const user = useMemo(() => (raw ? JSON.parse(raw) : null), [raw]);
  return { user, logout };
}
