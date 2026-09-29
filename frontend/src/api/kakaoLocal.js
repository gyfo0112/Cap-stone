// 카카오 로컬 REST API — 장소 검색 / 좌표→주소 변환.
// 우리 서버 없이 브라우저에서 바로 호출한다 (Kakao Developers > 앱 키 > REST API 키).
// 지도(JS) 키와는 다른 키이며, 같은 앱이면 카카오맵이 활성화돼 있는 한 함께 쓸 수 있다.

const REST_KEY = import.meta.env.VITE_KAKAO_REST_KEY;

async function kakaoGet(path, params) {
  if (!REST_KEY) throw new Error('VITE_KAKAO_REST_KEY가 설정되지 않았습니다.');

  const url = new URL(`https://dapi.kakao.com${path}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value != null) url.searchParams.set(key, value);
  });

  const res = await fetch(url, { headers: { Authorization: `KakaoAK ${REST_KEY}` } });
  if (!res.ok) throw new Error(`Kakao Local API ${res.status}`);
  return res.json();
}

export function hasKakaoRestKey() {
  return Boolean(REST_KEY);
}

// 키워드로 장소 검색 (카카오맵 검색과 동일한 결과)
export async function searchPlaces(query, { size = 8 } = {}) {
  const q = query?.trim();
  if (!q) return [];
  const data = await kakaoGet('/v2/local/search/keyword.json', { query: q, size });
  return (data.documents || []).map((d) => ({
    id: d.id,
    name: d.place_name,
    address: d.road_address_name || d.address_name,
    lat: Number(d.y),
    lng: Number(d.x),
  }));
}

// 좌표 -> 도로명/지번 주소 (현재 위치 표시용 리버스 지오코딩)
export async function coordToAddress(lat, lng) {
  const data = await kakaoGet('/v2/local/geo/coord2address.json', { x: lng, y: lat });
  const doc = data.documents?.[0];
  if (!doc) return null;
  return doc.road_address?.address_name || doc.address?.address_name || null;
}
