// 보호자 연락처 로컬 저장 — 백엔드 UserTel 엔티티(tel_uuid/tel_num/tel_name/tel_type)와
// 필드명을 맞춰뒀다. 나중에 등록 API가 생기면 이 파일만 fetch 기반으로 바꾸면 된다.
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

export function addContact({ tel_name, tel_num, tel_type }) {
  const contact = { tel_uuid: crypto.randomUUID(), tel_name, tel_num, tel_type };
  return save([...getContacts(), contact]);
}

export function removeContact(tel_uuid) {
  return save(getContacts().filter((c) => c.tel_uuid !== tel_uuid));
}
