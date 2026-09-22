// 보호자 연락처 로컬 저장 — 백엔드 UserTel 엔티티(tel_uuid/tel_num/tel_name/tel_type)와
// 필드명을 맞춰뒀다. 나중에 등록 API가 생기면 이 파일만 fetch 기반으로 바꾸면 된다.
const STORAGE_KEY = 'mf-contacts';

export function getContacts() {
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

export function addContact({ tel_name, tel_num, tel_type }) {
  const contact = { tel_uuid: crypto.randomUUID(), tel_name, tel_num, tel_type };
  return save([...getContacts(), contact]);
}

export function removeContact(tel_uuid) {
  return save(getContacts().filter((c) => c.tel_uuid !== tel_uuid));
}
