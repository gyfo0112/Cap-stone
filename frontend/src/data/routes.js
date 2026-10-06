// 길찾기·안전점수 — VITE_USE_BACKEND=true면 백엔드 /api/routes · /api/safety-score(TMAP 보행자 경로 + 주변 안전시설 점수),
// 아니면 화면 확인용 예시(routeData.js). 화면은 둘 다 같은 모양의 경로 객체를 쓴다:
//   { id: 'safe'|'shortest', name, score(null이면 계산 불가), note, duration(분), distance(km), path([[위도,경도]…] | null), segments, source }
import { USE_BACKEND, api } from '../api/http';
import { searchPlaces } from '../api/kakaoLocal';
import { ROUTE_OPTIONS, SEGMENTS } from './routeData';

// 장소 이름 → 좌표. 좌표를 이미 아는 곳(카카오 검색 결과·즐겨찾기·내 위치)은 그대로 쓰고, 이름만 있으면 카카오로 찾는다.
const coordCache = new Map();

export async function resolvePlace({ name, lat, lng }) {
  if (lat != null && lng != null) {
    coordCache.set(name, { lat, lng });
    return { lat, lng };
  }
  if (!name || name === '현재 위치') {
    throw new Error('현재 위치를 확인할 수 없어요. 위치 권한을 허용하거나 출발지를 직접 입력해주세요.');
  }
  if (coordCache.has(name)) return coordCache.get(name);
  const [first] = await searchPlaces(name, { size: 1 });
  if (!first) throw new Error(`'${name}' 위치를 찾지 못했어요. 검색 결과에서 장소를 골라주세요.`);
  const coord = { lat: first.lat, lng: first.lng };
  coordCache.set(name, coord);
  return coord;
}

const toRoute = (r) => ({
  id: r.route_id,
  name: r.name,
  score: r.score_available ? r.score : null,
  note: r.note,
  duration: r.duration_min,
  distance: r.distance_km,
  path: r.path,
  segments: r.segments,
  source: r.source,
});

const MOCK_DELAY_MS = 550; // 예시 모드에서도 "계산 중" 화면이 잠깐 보이게

// origin/destination: { name, lat?, lng? }, timeMode: 'now' | 'night' → 경로 배열 [안전 우선, 최단 거리]
export async function findRoutes({ origin, destination, timeMode }) {
  if (!USE_BACKEND) {
    await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY_MS));
    return ROUTE_OPTIONS.map((r) => ({ ...r, path: null, segments: SEGMENTS, source: 'mock' }));
  }
  const [from, to] = await Promise.all([resolvePlace(origin), resolvePlace(destination)]);
  const params = new URLSearchParams({
    origin_latitude: from.lat,
    origin_longitude: from.lng,
    destination_latitude: to.lat,
    destination_longitude: to.lng,
    time: timeMode === 'night' ? 'night' : 'now',
  });
  return (await api('GET', `/api/routes?${params}`)).map(toRoute);
}

// 장소 한 곳의 안전점수 { score(null이면 계산 불가), grade, note } — 홈 카드의 현재 위치 점수
export async function fetchPlaceScore(lat, lng) {
  const r = await api('GET', `/api/safety-score?latitude=${lat}&longitude=${lng}`);
  return { score: r.score_available ? r.score : null, note: r.note };
}
