import { useEffect, useState } from 'react';
import { coordToAddress } from './kakaoLocal';

// 실제 GPS 위치 + (REST 키가 있으면) 주소까지 가져오는 훅.
// 권한 거부/미지원/REST 키 없음 등 어떤 이유로 실패해도 status만 바뀌고
// 화면은 항상 기존 mock 값으로 대체 표시할 수 있게 좌표 없이 반환한다.
export function useCurrentLocation() {
  const [state, setState] = useState(() => ({
    status: navigator.geolocation ? 'loading' : 'unsupported',
    lat: null,
    lng: null,
    address: '',
  }));

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
  }, []);

  return state;
}
