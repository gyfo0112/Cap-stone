// 백엔드 지도 마커 API (backend 브랜치 MarkerController, API_marker_favorite.md 1번).
// 같은 서버(스프링 static)로 뜨면 상대경로 그대로, 개발 중엔 vite.config의 /api 프록시가 8080으로 넘긴다.
// 다른 주소의 서버를 쓰려면 VITE_API_BASE_URL(예: http://localhost:8080)을 지정.
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';

// 지도 레이어 = 백엔드 marker_type 하나. type 값은 실제 적재 코드(MarkerImportService) 기준 —
// API 문서의 LAMP와 다르니 백엔드와 확정되면 여기만 고치면 된다.
export const MARKER_LAYERS = [
  { key: 'cctv', type: 'CCTV', label: 'CCTV', color: '#2f6fe0' },
  { key: 'streetlight', type: 'SECURITY_LIGHT', label: '보안등', color: '#d99a00' },
  { key: 'safeHouse', type: 'SAFE_HOUSE', label: '안심지킴이집', color: '#1f9d6b' },
  { key: 'safetyBell', type: 'EMERGENCY_BELL', label: '안심벨', color: '#e5484d' },
];

// useMarkerLayers가 알려주는 레이어 상태 → 패널/칩 아래 안내 문구
export const LAYER_STATUS_TEXT = {
  ok: '표시 중',
  fallback: '표시 중 · 서버 연결 전이라 서울 예시 데이터',
  empty: '이 지역에는 등록된 데이터가 없어요',
  zoom: '지도를 더 확대하면 표시돼요',
  error: '서버에 연결하지 못해 표시할 수 없어요',
};

// 지금 보이는 지도 사각형 안의 마커 목록 → [{ marker_uuid, marker_name, marker_type, latitude, longitude }]
export async function fetchMarkers({ minLat, maxLat, minLng, maxLng }, markerType, signal) {
  const params = new URLSearchParams({
    min_latitude: minLat,
    max_latitude: maxLat,
    min_longitude: minLng,
    max_longitude: maxLng,
    marker_type: markerType,
  });
  const res = await fetch(`${API_BASE}/api/markers?${params}`, { signal });
  // 서버가 없으면(예: Vercel) index.html이 200으로 올 수 있어 JSON인지까지 확인
  if (!res.ok || !res.headers.get('content-type')?.includes('application/json')) {
    throw new Error(`마커 API 응답 오류 (${res.status})`);
  }
  return res.json();
}

// 서버 없이 뜬 경우(Vercel 데모)에도 CCTV는 보이도록 쓰는 서울 CCTV 파일 — [경도, 위도] 배열
let localCctv = null;
export function loadLocalCctv() {
  if (!localCctv) {
    localCctv = fetch('/data/cctv-seoul.json')
      .then((r) => {
        if (!r.ok) throw new Error(`cctv-seoul.json ${r.status}`);
        return r.json();
      })
      .catch((err) => {
        localCctv = null;
        throw err;
      });
  }
  return localCctv;
}

// 서울 CCTV 파일이 커버하는 범위 — 이 밖에서 그 파일로 세면 0이 나와 오해를 주므로 쓰지 않는다
const inSeoul = (lat, lng) => lat >= 37.41 && lat <= 37.72 && lng >= 126.76 && lng <= 127.19;

function distanceM(lat1, lng1, lat2, lng2) {
  const rad = Math.PI / 180;
  const a =
    Math.sin(((lat2 - lat1) * rad) / 2) ** 2 +
    Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(((lng2 - lng1) * rad) / 2) ** 2;
  return 6371000 * 2 * Math.asin(Math.sqrt(a));
}

// 내 위치 반경 radiusM 안의 CCTV·보안등 개수 → { cctv, streetlight } (못 센 항목은 null)
export async function countNearby(lat, lng, signal, radiusM = 500) {
  const dLat = radiusM / 111320;
  const dLng = dLat / Math.cos((lat * Math.PI) / 180);
  const box = { minLat: lat - dLat, maxLat: lat + dLat, minLng: lng - dLng, maxLng: lng + dLng };
  const within = (pLat, pLng) => distanceM(lat, lng, pLat, pLng) <= radiusM;
  const count = async (type) =>
    (await fetchMarkers(box, type, signal)).filter((m) => within(m.latitude, m.longitude)).length;

  const cctv = count('CCTV').catch(async (err) => {
    if (signal?.aborted || !inSeoul(lat, lng)) throw err;
    return (await loadLocalCctv()).filter(([pLng, pLat]) => within(pLat, pLng)).length;
  });
  const [c, s] = await Promise.allSettled([cctv, count('SECURITY_LIGHT')]);
  return {
    cctv: c.status === 'fulfilled' ? c.value : null,
    streetlight: s.status === 'fulfilled' ? s.value : null,
  };
}
