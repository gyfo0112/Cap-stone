// 즐겨찾기 로컬 저장 — 백엔드 Favorite(+Marker) 스키마와 필드명을 맞춰뒀다.
// 실제 좌표가 있는 카카오 검색 결과만 즐겨찾기할 수 있게 해서(마커는 위경도가
// NOT NULL) 나중에 등록 API가 생기면 이 파일만 fetch 기반으로 바꾸면 된다.
const STORAGE_KEY = 'mf-favorites';

export function getFavorites() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function save(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  return list;
}

export function addFavorite({ marker_name, latitude, longitude }) {
  if (getFavorites().some((f) => f.marker_name === marker_name)) return getFavorites();
  const favorite = {
    marker_uuid: crypto.randomUUID(),
    marker_name,
    marker_type: 'PLACE',
    latitude,
    longitude,
    fav_name: marker_name,
  };
  return save([...getFavorites(), favorite]);
}

export function removeFavoriteByName(marker_name) {
  return save(getFavorites().filter((f) => f.marker_name !== marker_name));
}
