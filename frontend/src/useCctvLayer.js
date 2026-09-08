import { useEffect } from 'react';

// 서울 CCTV 좌표 [경도, 위도] 배열. 한 번 받아서 모듈 스코프에 캐시.
let cache = null;

function loadPoints() {
  if (!cache) {
    cache = fetch('/data/cctv-seoul.json')
      .then((r) => {
        if (!r.ok) throw new Error(`cctv-seoul.json ${r.status}`);
        return r.json();
      })
      .catch((err) => {
        cache = null; // 실패 시 다음 시도에서 재요청
        throw err;
      });
  }
  return cache;
}

// ponytail: 화면 범위 안의 점을 매 idle마다 최대 5000개만 그린다.
// 서울 전역(레벨 9+)에서는 표본만 보여 클러스터 수치가 실제보다 작다.
// 정확한 밀도가 필요해지면 bbox 백엔드 API 또는 사전 클러스터 타일로 교체.
const MAX_MARKERS = 5000;

export function useCctvLayer(map, enabled) {
  useEffect(() => {
    if (!map || !enabled) return undefined;

    const { kakao } = window;
    let cancelled = false;
    const clusterer = new kakao.maps.MarkerClusterer({
      map,
      averageCenter: true,
      minLevel: 4,
    });

    const render = async () => {
      let points;
      try {
        points = await loadPoints();
      } catch (err) {
        console.warn('CCTV 데이터 로드 실패:', err);
        return;
      }
      if (cancelled) return;

      const bounds = map.getBounds();
      const sw = bounds.getSouthWest();
      const ne = bounds.getNorthEast();
      const [latMin, latMax] = [sw.getLat(), ne.getLat()];
      const [lngMin, lngMax] = [sw.getLng(), ne.getLng()];

      const markers = [];
      for (let i = 0; i < points.length && markers.length < MAX_MARKERS; i += 1) {
        const [lng, lat] = points[i];
        if (lat >= latMin && lat <= latMax && lng >= lngMin && lng <= lngMax) {
          markers.push(new kakao.maps.Marker({ position: new kakao.maps.LatLng(lat, lng) }));
        }
      }

      clusterer.clear();
      clusterer.addMarkers(markers);
    };

    render();
    kakao.maps.event.addListener(map, 'idle', render);

    return () => {
      cancelled = true;
      kakao.maps.event.removeListener(map, 'idle', render);
      clusterer.clear();
      clusterer.setMap(null);
    };
  }, [map, enabled]);
}
