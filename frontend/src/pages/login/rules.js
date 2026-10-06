// 010-1234-5678 형태로 숫자만 걸러 하이픈을 넣는다
export function formatPhone(value) {
  const d = value.replace(/\D/g, '').slice(0, 11);
  if (d.length < 4) return d;
  if (d.length < 8) return `${d.slice(0, 3)}-${d.slice(3)}`;
  return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
}

export const PHONE_RE = /^01\d-\d{3,4}-\d{4}$/;

// 백엔드는 4~50자를 받는다(암호화해서 저장). 화면은 8자 이상으로 더 엄격하게 받는다
export const PW_MIN = 8;
export const PW_MAX = 50;
export const ID_RE = /^[a-zA-Z0-9]{4,20}$/;
