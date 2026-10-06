// 경로설정 "최근 검색" 로컬 저장. 백엔드 테이블이 없는 기기 로컬 기록이라 localStorage로 충분하다.
import { USE_BACKEND } from '../api/http';

const STORAGE_KEY = 'mf-recents';
const MAX = 10;

// 처음 실행 시 보여줄 예시 — 저장소에 들어가니 개별/전체 삭제 가능.
// 점수는 예시 모드에서만 보여준다 — 백엔드 모드에서는 가짜 점수를 내지 않는다.
const SAMPLE_RECENTS = [
  { name: '연남동 501-9', sub: '서울 마포구 연남로', score: 82 },
  { name: '홍대입구역 2번출구', sub: '서울 마포구 양화로', score: 76 },
  { name: '망원동 396-12 (집)', sub: '즐겨찾기', score: 84 },
  { name: '상수동 골목시장', sub: '서울 마포구 와우산로', score: 58 },
];
const DEFAULT_RECENTS = USE_BACKEND ? SAMPLE_RECENTS.map((r) => ({ name: r.name, sub: r.sub })) : SAMPLE_RECENTS;

export function getRecents() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? DEFAULT_RECENTS;
  } catch {
    return DEFAULT_RECENTS;
  }
}

function save(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  return list;
}

// 같은 장소를 다시 고르면 맨 위로 올린다. 주소 없이 다시 검색해도(직접 입력+Enter)
// 예전에 저장된 주소·점수는 유지한다.
export function addRecent({ name, sub = '', lat, lng }) {
  const list = getRecents();
  const prev = list.find((r) => r.name === name);
  const rest = list.filter((r) => r.name !== name);
  // 좌표도 같이 남겨 두면 다음에 누를 때 이름을 다시 검색하지 않고 바로 길찾기 한다
  const coord = lat != null ? { lat, lng } : {};
  return save([{ ...prev, name, sub: sub || prev?.sub || '', ...coord }, ...rest].slice(0, MAX));
}

export function removeRecent(name) {
  return save(getRecents().filter((r) => r.name !== name));
}

export function clearRecents() {
  return save([]);
}
