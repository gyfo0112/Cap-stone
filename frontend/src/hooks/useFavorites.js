import { useEffect, useState } from 'react';
import { USE_BACKEND } from '../api/http';
import { addFavorite, getFavorites, listFavorites, removeFavorite } from '../data/favorites';
import { useAuth } from './useAuth';

// 즐겨찾기 목록 + 별표 토글 — PC 경로 패널과 모바일 경로 입력 화면 공용. 백엔드 모드에선 로그인해야 저장된다.
export function useFavorites() {
  const { user } = useAuth();
  const needLogin = USE_BACKEND && !user;
  const [loaded, setLoaded] = useState(() => (USE_BACKEND ? [] : getFavorites()));
  const [error, setError] = useState('');
  const userId = user?.userId;

  useEffect(() => {
    if (!USE_BACKEND || !userId) return;
    let cancelled = false;
    listFavorites()
      .then((list) => !cancelled && setLoaded(list))
      .catch((e) => !cancelled && setError(e.message));
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const favorites = needLogin ? [] : loaded;
  const run = async (action) => {
    if (needLogin) {
      setError('로그인하면 즐겨찾기를 저장할 수 있어요.');
      return;
    }
    try {
      setLoaded(await action());
      setError('');
    } catch (e) {
      setError(e.message);
    }
  };

  const found = (name) => favorites.find((f) => f.marker_name === name);
  return {
    favorites,
    needLogin,
    error,
    isFavorite: (name) => Boolean(found(name)),
    // place: { name, lat, lng } (카카오 검색 결과) — 이미 담겨 있으면 해제, 아니면 담기
    toggle: (place) =>
      run(() =>
        found(place.name)
          ? removeFavorite(found(place.name).marker_uuid)
          : addFavorite({ marker_name: place.name, latitude: place.lat, longitude: place.lng }),
      ),
    remove: (marker_uuid) => run(() => removeFavorite(marker_uuid)),
  };
}
