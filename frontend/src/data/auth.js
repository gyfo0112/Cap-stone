// 로그인·회원가입 mock — 계정을 이 브라우저 localStorage에 저장한다(비밀번호는 SHA-256 해시로만).
// 서버 로그인 API가 생기면 이 파일의 함수 본문만 fetch로 바꾸면 화면은 그대로 쓴다.
const ACCOUNTS_KEY = 'mf-accounts';
const SESSION_KEY = 'mf-session';
const SESSION_EVENT = 'mf-session-change';

const digits = (v) => v.replace(/\D/g, '');

async function hash(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function readAccounts() {
  try {
    return JSON.parse(localStorage.getItem(ACCOUNTS_KEY)) || [];
  } catch {
    return [];
  }
}

const writeAccounts = (list) => localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(list));
const sameId = (a, b) => a.userId.toLowerCase() === b.toLowerCase();
const matches = (a, { name, phone }) => a.name === name.trim() && digits(a.phone) === digits(phone);

// 로그인 유지를 켜면 localStorage, 끄면 sessionStorage(탭을 닫으면 로그아웃)
export const getSessionRaw = () => sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(SESSION_KEY);

export function subscribeSession(callback) {
  window.addEventListener(SESSION_EVENT, callback);
  window.addEventListener('storage', callback);
  return () => {
    window.removeEventListener(SESSION_EVENT, callback);
    window.removeEventListener('storage', callback);
  };
}

export async function signup({ userId, password, name, phone }) {
  const accounts = readAccounts();
  if (accounts.some((a) => sameId(a, userId))) throw new Error('이미 사용 중인 아이디예요.');
  writeAccounts([...accounts, { userId, name: name.trim(), phone, pwHash: await hash(password) }]);
}

export async function login(userId, password, keep) {
  const account = readAccounts().find((a) => sameId(a, userId));
  if (!account || account.pwHash !== (await hash(password))) {
    throw new Error('아이디 또는 비밀번호가 올바르지 않아요.');
  }
  const session = JSON.stringify({ userId: account.userId, name: account.name, phone: account.phone });
  sessionStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(SESSION_KEY);
  (keep ? localStorage : sessionStorage).setItem(SESSION_KEY, session);
  window.dispatchEvent(new Event(SESSION_EVENT));
}

export function logout() {
  sessionStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(SESSION_KEY);
  window.dispatchEvent(new Event(SESSION_EVENT));
}

// 이름+휴대폰이 같은 계정의 아이디를 가려서(ab****) 돌려준다. 없으면 빈 배열.
export function findIds(info) {
  return readAccounts()
    .filter((a) => matches(a, info))
    .map((a) => a.userId.slice(0, 2) + '*'.repeat(Math.max(a.userId.length - 2, 2)));
}

export const verifyAccount = (info) => readAccounts().some((a) => sameId(a, info.userId) && matches(a, info));

export async function resetPassword(info, newPassword) {
  if (!verifyAccount(info)) throw new Error('일치하는 계정을 찾을 수 없어요.');
  const pwHash = await hash(newPassword);
  writeAccounts(readAccounts().map((a) => (sameId(a, info.userId) ? { ...a, pwHash } : a)));
}
