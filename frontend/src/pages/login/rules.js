// 010-1234-5678 형태로 숫자만 걸러 하이픈을 넣는다
export function formatPhone(value) {
  const d = value.replace(/\D/g, '').slice(0, 11);
  if (d.length < 4) return d;
  if (d.length < 8) return `${d.slice(0, 3)}-${d.slice(3)}`;
  return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
}

export const PHONE_RE = /^01\d-\d{3,4}-\d{4}$/;

// 백엔드 user_pw 컬럼이 30자라 최대 30자로 맞춘다
export const PW_MIN = 8;
export const PW_MAX = 30;
export const ID_RE = /^[a-zA-Z0-9]{4,20}$/;
