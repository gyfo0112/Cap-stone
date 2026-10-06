// 즐겨찾기 — VITE_USE_BACKEND=true면 백엔드 /api/favorites(로그인 필요), 아니면 브라우저 저장소 mock.
// 필드명은 백엔드 Favorite(+Marker) 응답과 같다. 실제 좌표가 있는 카카오 검색 결과만 즐겨찾기할 수 있다
// (마커는 위경도가 NOT NULL). 백엔드는 같은 이름·좌표의 PLACE 마커를 재사용한다.
import { USE_BACKEND, api } from '../api/http';

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

// 화면이 쓰는 함수 — 담기/해제 뒤에는 최신 목록을 돌려준다 (실패하면 서버 메시지를 담은 Error)
export async function listFavorites() {
  return USE_BACKEND ? api('GET', '/api/favorites') : getFavorites();
}

export async function addFavorite({ marker_name, latitude, longitude }) {
  if (USE_BACKEND) {
    try {
      await api('POST', '/api/favorites', { marker_name, latitude, longitude, fav_name: marker_name });
    } catch (e) {
      if (e.status !== 409) throw e; // 409 = 이미 담음 → 그대로 목록만 새로 받는다
    }
    return listFavorites();
  }
  if (getFavorites().some((f) => f.marker_name === marker_name)) return getFavorites();
  return save([
    ...getFavorites(),
    { marker_uuid: crypto.randomUUID(), marker_name, marker_type: 'PLACE', latitude, longitude, fav_name: marker_name },
  ]);
}

export async function removeFavorite(marker_uuid) {
  if (USE_BACKEND) {
    await api('DELETE', `/api/favorites/${marker_uuid}`);
    return listFavorites();
  }
  return save(getFavorites().filter((f) => f.marker_uuid !== marker_uuid));
}
