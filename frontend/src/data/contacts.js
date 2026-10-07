// 보호자 연락처 — VITE_USE_BACKEND=true면 백엔드 /api/users/me/tels(로그인 필요, 목록은 주소에 내 uuid), 아니면 브라우저 저장소 mock.
// 필드명은 백엔드 UserTel(tel_uuid/tel_num/tel_name/tel_type)과 같다.
import { USE_BACKEND, api } from '../api/http';
import { getUserUuid } from './auth';

const STORAGE_KEY = 'mf-contacts';

// 처음 실행 시 보여줄 예시 보호자 — 저장소에 넣어두니 사용자가 지울 수도 있다.
// relation은 아바타에 쓰는 표시용(백엔드 컬럼 아님).
const DEFAULT_CONTACTS = [
  { tel_uuid: 'default-mom', relation: '엄마', tel_name: '김서연', tel_num: '010-2841-XXXX', tel_type: '기본' },
  { tel_uuid: 'default-friend', relation: '친구', tel_name: '이지훈', tel_num: '010-7745-XXXX', tel_type: '보조' },
];

export function getContacts() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? DEFAULT_CONTACTS;
  } catch {
    return DEFAULT_CONTACTS;
  }
}

function save(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  return list;
}

// 화면이 쓰는 함수 — 추가/삭제 뒤에는 최신 목록을 돌려준다 (실패하면 서버 메시지를 담은 Error)
export async function listContacts() {
  // 백엔드 목록 응답은 Slice({ content: [...] })
  return USE_BACKEND ? (await api('GET', `/api/users/me/tels/${getUserUuid()}`)).content : getContacts();
}

export async function addContact({ tel_name, tel_num, tel_type }) {
  if (USE_BACKEND) {
    await api('POST', '/api/users/me/tels', { tel_name, tel_num, tel_type });
    return listContacts();
  }
  return save([...getContacts(), { tel_uuid: crypto.randomUUID(), tel_name, tel_num, tel_type }]);
}

export async function removeContact(tel_uuid) {
  if (USE_BACKEND) {
    await api('DELETE', `/api/users/me/tels/${tel_uuid}`);
    return listContacts();
  }
  return save(getContacts().filter((c) => c.tel_uuid !== tel_uuid));
}
