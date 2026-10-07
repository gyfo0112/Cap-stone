import { useEffect, useState } from 'react';
import { findRoutes } from '../data/routes';

// 경로 검색 결과 — query = { origin, destination, timeMode, nonce? }, null이면 검색하지 않는다.
// query가 바뀌면(같은 조건을 다시 누르려면 nonce를 바꾼다) 다시 검색하고, 그동안은 loading=true.
// 결과가 어떤 query의 것인지 기억해서, 이전 검색 결과가 새 검색 화면에 잠깐 비치지 않게 한다.
export function useRouteSearch(query) {
  const key = query ? JSON.stringify(query) : null;
  const [state, setState] = useState({ key: null, routes: null, error: '' });

  useEffect(() => {
    if (!key) return undefined;
    let cancelled = false;
    findRoutes(JSON.parse(key))
      .then((routes) => !cancelled && setState({ key, routes, error: '' }))
      .catch((e) => !cancelled && setState({ key, routes: null, error: e.message }));
    return () => {
      cancelled = true;
    };
  }, [key]);

  const settled = state.key === key;
  return {
    routes: settled ? state.routes : null,
    error: settled ? state.error : '',
    loading: Boolean(key) && !settled,
  };
}
