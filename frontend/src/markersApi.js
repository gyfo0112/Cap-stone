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
