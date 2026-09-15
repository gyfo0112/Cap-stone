import { useCallback, useEffect, useMemo, useState } from 'react';
import { coordToAddress } from './kakaoLocal';

// 실제 GPS 위치 + (REST 키가 있으면) 주소까지 가져오는 훅.
// 권한 거부/미지원/REST 키 없음 등 어떤 이유로 실패해도 status만 바뀌고
// 화면은 항상 기존 mock 값으로 대체 표시할 수 있게 좌표 없이 반환한다.
// refresh()로 "현재 위치로 이동" 버튼 등에서 다시 조회할 수 있다.
export function useCurrentLocation() {
  const [state, setState] = useState(() => ({
    status: navigator.geolocation ? 'loading' : 'unsupported',
    lat: null,
    lng: null,
    address: '',
  }));
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        let address = '';
        try {
          address = (await coordToAddress(lat, lng)) || '';
        } catch {
          /* REST 키가 없거나 조회 실패 — 좌표만이라도 사용 */
        }
        setState({ status: 'ready', lat, lng, address });
      },
      () => setState((s) => ({ ...s, status: 'denied' })),
      { enableHighAccuracy: true, timeout: 8000 },
    );
    // nonce가 바뀔 때만 재조회 — refresh() 호출용
  }, [nonce]);

  // setNonce 자체가 안정적인 참조라 refresh도 매 렌더 새로 만들 필요 없음
  const refresh = useCallback(() => setNonce((n) => n + 1), []);

  // state가 실제로 바뀔 때만 새 객체를 만들어 반환 — KakaoMap의
  // useEffect([map, location]) 의존성이 매 렌더마다 재발화하지 않게 함
  return useMemo(() => ({ ...state, refresh }), [state, refresh]);
}
