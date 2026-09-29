import { useEffect, useRef } from 'react';
import { MARKER_LAYERS, fetchMarkers } from './markersApi';

// 백엔드는 화면 사각형 안의 마커를 개수 제한 없이 전부 돌려준다. 너무 넓게 보면
// (레벨이 크면) 한 번에 수만 건이 오므로 이 레벨까지 확대했을 때만 요청한다.
// 카카오맵 레벨: 1(가장 확대) ~ 14. 기본 화면이 5.
const MAX_LEVEL = 5;
// ponytail: 한 레이어당 최대 3000개만 그린다. 더 필요하면 서버 쪽 개수 제한/격자 집계로.
const MAX_MARKERS = 3000;

// 서버 없이 뜬 경우(Vercel 데모)에도 CCTV는 보이도록 기존 서울 CCTV 파일로 대체
let localCctv = null;
function loadLocalCctv() {
  if (!localCctv) {
    localCctv = fetch('/data/cctv-seoul.json')
      .then((r) => {
        if (!r.ok) throw new Error(`cctv-seoul.json ${r.status}`);
        return r.json(); // [경도, 위도] 배열
      })
      .catch((err) => {
        localCctv = null;
        throw err;
      });
  }
  return localCctv;
}

function dotImage(kakao, color) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"><circle cx="8" cy="8" r="6" fill="${color}" stroke="white" stroke-width="2"/></svg>`;
  return new kakao.maps.MarkerImage(
    `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
    new kakao.maps.Size(16, 16),
    { offset: new kakao.maps.Point(8, 8) },
  );
}

function clusterStyle(color) {
  return {
    width: '34px',
    height: '34px',
    lineHeight: '30px',
    borderRadius: '17px',
    border: '2px solid rgba(255,255,255,0.85)',
    background: color,
    color: '#fff',
    textAlign: 'center',
    fontSize: '12px',
    fontWeight: '700',
  };
}

// layers: { cctv: true, streetlight: false, ... }
// onStatus(key, 'ok' | 'fallback' | 'empty' | 'zoom' | 'error') — 패널/칩에 안내 문구를 띄우는 용도
export function useMarkerLayers(map, layers, onStatus) {
  const onStatusRef = useRef(onStatus);
  useEffect(() => {
    onStatusRef.current = onStatus;
  });

  // 켜진 레이어 목록이 실제로 바뀔 때만 다시 그리도록 문자열 키로 비교
  const enabledKey = MARKER_LAYERS.filter((l) => layers?.[l.key])
    .map((l) => l.key)
    .join(',');

  useEffect(() => {
    if (!map || !enabledKey) return undefined;
    const { kakao } = window;
    const enabled = enabledKey.split(',');
    const active = MARKER_LAYERS.filter((l) => enabled.includes(l.key)).map((l) => ({
      ...l,
      image: dotImage(kakao, l.color),
      clusterer: new kakao.maps.MarkerClusterer({
        map,
        averageCenter: true,
        minLevel: 4,
        styles: [clusterStyle(l.color)],
      }),
    }));
    const report = (key, status) => onStatusRef.current?.(key, status);
    let controller = null;

    const loadLayer = async (layer, box, signal) => {
      try {
        const list = await fetchMarkers(box, layer.type, signal);
        return { status: 'ok', points: list.map((m) => ({ lat: m.latitude, lng: m.longitude, name: m.marker_name })) };
      } catch (err) {
        if (signal.aborted || layer.key !== 'cctv') throw err;
        const all = await loadLocalCctv();
        const points = all
          .filter(([lng, lat]) => lat >= box.minLat && lat <= box.maxLat && lng >= box.minLng && lng <= box.maxLng)
          .map(([lng, lat]) => ({ lat, lng, name: 'CCTV' }));
        return { status: 'fallback', points };
      }
    };

    const render = () => {
      controller?.abort();
      controller = new AbortController();
      const { signal } = controller;

      if (map.getLevel() > MAX_LEVEL) {
        active.forEach((l) => {
          l.clusterer.clear();
          report(l.key, 'zoom');
        });
        return;
      }

      const bounds = map.getBounds();
      const sw = bounds.getSouthWest();
      const ne = bounds.getNorthEast();
      const box = { minLat: sw.getLat(), maxLat: ne.getLat(), minLng: sw.getLng(), maxLng: ne.getLng() };

      active.forEach((layer) => {
        loadLayer(layer, box, signal)
          .then(({ status, points }) => {
            if (signal.aborted) return;
            const markers = points.slice(0, MAX_MARKERS).map(
              (p) => new kakao.maps.Marker({ position: new kakao.maps.LatLng(p.lat, p.lng), image: layer.image, title: p.name }),
            );
            layer.clusterer.clear();
            layer.clusterer.addMarkers(markers);
            report(layer.key, markers.length === 0 ? 'empty' : status);
          })
          .catch((err) => {
            if (signal.aborted) return;
            console.warn(`${layer.label} 마커를 불러오지 못했습니다:`, err);
            layer.clusterer.clear();
            report(layer.key, 'error');
          });
      });
    };

    render();
    kakao.maps.event.addListener(map, 'idle', render);

    return () => {
      controller?.abort();
      kakao.maps.event.removeListener(map, 'idle', render);
      active.forEach((l) => {
        l.clusterer.clear();
        l.clusterer.setMap(null);
      });
    };
  }, [map, enabledKey]);
}
