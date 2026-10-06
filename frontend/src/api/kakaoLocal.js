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

// 장소 + 주소 검색 — 카카오맵 검색창처럼 "세종대로 110" 같은 주소를 쳐도 결과가 나온다.
// 키워드 검색만으로는 정확한 지번/도로명 주소가 안 잡혀서 주소 검색을 함께 불러 주소 결과를 앞에 둔다.
export async function searchPlaces(query, { size = 8 } = {}) {
  const q = query?.trim();
  if (!q) return [];
  const [keyword, address] = await Promise.all([
    kakaoGet('/v2/local/search/keyword.json', { query: q, size }),
    // 주소 검색이 실패해도(주소가 아닌 검색어 등) 장소 결과는 보여준다
    kakaoGet('/v2/local/search/address.json', { query: q, size: 3 }).catch(() => ({ documents: [] })),
  ]);
  const addresses = (address.documents || []).map((d) => ({
    id: `addr-${d.x},${d.y}`,
    name: d.address_name,
    address: d.road_address?.address_name || d.address?.address_name || '',
    lat: Number(d.y),
    lng: Number(d.x),
  }));
  const places = (keyword.documents || []).map((d) => ({
    id: d.id,
    name: d.place_name,
    address: d.road_address_name || d.address_name,
    lat: Number(d.y),
    lng: Number(d.x),
  }));
  return [...addresses, ...places].slice(0, size);
}

// 좌표 -> 도로명/지번 주소 (현재 위치 표시용 리버스 지오코딩)
export async function coordToAddress(lat, lng) {
  const data = await kakaoGet('/v2/local/geo/coord2address.json', { x: lng, y: lat });
  const doc = data.documents?.[0];
  if (!doc) return null;
  return doc.road_address?.address_name || doc.address?.address_name || null;
}
