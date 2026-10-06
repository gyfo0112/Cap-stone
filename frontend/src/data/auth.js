// 로그인·회원가입 mock — 계정을 이 브라우저 localStorage에 저장한다(비밀번호는 SHA-256 해시로만).
// 서버 로그인 API가 생기면 이 파일의 함수 본문만 fetch로 바꾸면 화면은 그대로 쓴다.
const ACCOUNTS_KEY = 'mf-accounts';
const SESSION_KEY = 'mf-session';
const SESSION_EVENT = 'mf-session-change';

// role: 'guardian'(보호자) | 'protected'(보호 대상: 자녀·노약자). 위치 공유를 켜고 끌 수 있는 건 보호자뿐이다.
export const ROLES = { guardian: '보호자', protected: '보호 대상' };

// 시연·테스트용 기본 계정 — 보호자 test1234 / test1234, 보호 대상 child1234 / child1234 (해시는 SHA-256)
const DEMO_ACCOUNTS = [
  { userId: 'test1234', name: '테스트', phone: '010-0000-0000', role: 'guardian', pwHash: '937e8d5fbb48bd4949536cd65b8d35c426b80d2f830c5c308e2cdec422ae2244' },
  { userId: 'child1234', name: '보호대상', phone: '010-0000-0001', role: 'protected', pwHash: '29ca52f6df0ebd54ca5eb81e019f76bc2c5bc2719a7c7b5ea7d59f37a4d8cbec' },
];

const digits = (v) => v.replace(/\D/g, '');

async function hash(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

const sameId = (a, b) => a.userId.toLowerCase() === b.toLowerCase();
const matches = (a, { name, phone }) => a.name === name.trim() && digits(a.phone) === digits(phone);

function readAccounts() {
  let stored = [];
  try {
    stored = JSON.parse(localStorage.getItem(ACCOUNTS_KEY)) || [];
  } catch {
    /* 저장소를 못 읽으면 기본 계정만 */
  }
  // 비밀번호 재설정 등으로 이미 저장돼 있으면 저장된 쪽을 쓴다
  const demos = DEMO_ACCOUNTS.filter((d) => !stored.some((a) => sameId(a, d.userId)));
  return [...demos, ...stored];
}

const writeAccounts = (list) => localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(list));

// 다른 계정의 이름·역할 조회(위치 공유 목록 표시용). 비밀번호 해시는 내보내지 않는다.
export function lookupAccount(userId) {
  const a = readAccounts().find((acc) => sameId(acc, userId));
  return a ? { userId: a.userId, name: a.name, role: a.role ?? 'guardian' } : null;
}

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

export async function signup({ userId, password, name, phone, role = 'guardian' }) {
  const accounts = readAccounts();
  if (accounts.some((a) => sameId(a, userId))) throw new Error('이미 사용 중인 아이디예요.');
  writeAccounts([...accounts.filter((a) => !DEMO_ACCOUNTS.includes(a)), { userId, name: name.trim(), phone, role, pwHash: await hash(password) }]);
}

export async function login(userId, password, keep) {
  const account = readAccounts().find((a) => sameId(a, userId));
  if (!account || account.pwHash !== (await hash(password))) {
    throw new Error('아이디 또는 비밀번호가 올바르지 않아요.');
  }
  const session = JSON.stringify({
    userId: account.userId,
    name: account.name,
    phone: account.phone,
    role: account.role ?? 'guardian',
  });
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
