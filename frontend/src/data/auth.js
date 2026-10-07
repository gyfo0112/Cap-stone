// 로그인·회원가입 — VITE_USE_BACKEND=true면 백엔드 /api/users API(세션 쿠키 방식), 아니면 mock.
// mock은 계정을 이 브라우저 localStorage에 저장한다(비밀번호는 SHA-256 해시로만). 화면은 둘 다 같은 함수를 쓴다.
// 백엔드 모드에서도 로그인 표시(useAuth)는 브라우저에 사본을 두고, 새로 열 때 restoreSession()이 서버에 확인한다.
import { USE_BACKEND, api, setUnauthorizedHandler } from '../api/http';

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

async function hash(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

const sameId = (a, b) => a.userId.toLowerCase() === b.toLowerCase();

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

async function mockSignup({ userId, password, name, phone, role = 'guardian' }) {
  const accounts = readAccounts();
  if (accounts.some((a) => sameId(a, userId))) throw new Error('이미 사용 중인 아이디예요.');
  writeAccounts([...accounts.filter((a) => !DEMO_ACCOUNTS.includes(a)), { userId, name: name.trim(), phone, role, pwHash: await hash(password) }]);
}

async function mockLogin(userId, password, keep) {
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

function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(SESSION_KEY);
  window.dispatchEvent(new Event(SESSION_EVENT));
}

setUnauthorizedHandler(clearSession);

// ---- 백엔드(/api/users) 연결 ----
// 백엔드 회원 응답(UserPublicDto) → 프론트 세션. 휴대폰 번호는 백엔드의 info 컬럼에 들어 있다.
// 백엔드에 role 컬럼이 없어 지금은 모두 보호자로 다룬다(있으면 서버 값을 쓴다).
const toSession = (u) => ({ userId: u.user_id, name: u.user_name, phone: u.info ?? '', role: u.role ?? 'guardian', userUuid: u.user_uuid });

function writeSession(session, keep) {
  sessionStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(SESSION_KEY);
  (keep ? localStorage : sessionStorage).setItem(SESSION_KEY, JSON.stringify(session));
  window.dispatchEvent(new Event(SESSION_EVENT));
}

// 연락처·비밀번호 변경 API가 주소에 내 user_uuid를 요구한다. 로그인할 때 /api/users/me 로 받아 세션에 둔다.
export function getUserUuid() {
  let uuid = null;
  try {
    uuid = JSON.parse(getSessionRaw())?.userUuid;
  } catch {
    /* 세션 표시가 깨졌으면 없는 것으로 */
  }
  if (!uuid) throw new Error('내 계정 정보를 불러오지 못했어요. 다시 로그인해주세요.');
  return uuid;
}

async function apiSignup({ userId, password, name, phone }) {
  await api('POST', '/api/users/signup', { user_id: userId, user_pw: password, user_name: name.trim(), info: phone });
}

// 스프링 formLogin: 폼으로 POST /login → 성공이면 /, 실패면 /login?error 로 리다이렉트(http.js가 해석)
async function apiLogin(userId, password, keep) {
  await api('POST', '/login', new URLSearchParams({ user_id: userId, user_pw: password }));
  let session = { userId, name: userId, phone: '', role: 'guardian', userUuid: null };
  try {
    session = toSession(await api('GET', '/api/users/me'));
  } catch {
    /* /api/users/me 가 아직 없거나 실패하면 아이디만으로 로그인 표시 — userUuid가 필요한 기능은 안내 후 막힌다 */
  }
  writeSession(session, keep);
}

async function apiLogout() {
  try {
    await api('POST', '/logout');
  } catch {
    /* 서버에 못 닿아도 이 브라우저의 로그인 표시는 지운다 */
  }
  clearSession();
}

// 새로 열 때 서버 세션이 아직 살아 있는지 확인 — 만료됐으면 401 → 로그인 표시가 지워진다
export async function restoreSession() {
  if (!USE_BACKEND) return;
  const raw = getSessionRaw();
  if (!raw) return;
  try {
    const user = await api('GET', '/api/users/me');
    const session = JSON.stringify(toSession(user));
    if (session !== raw) {
      const store = sessionStorage.getItem(SESSION_KEY) ? sessionStorage : localStorage;
      store.setItem(SESSION_KEY, session);
      window.dispatchEvent(new Event(SESSION_EVENT));
    }
  } catch {
    /* 401이면 http.js가 로그인 표시를 지웠고, 서버가 꺼져 있으면 그대로 둔다 */
  }
}

// ---- 화면이 쓰는 함수: 모드에 따라 백엔드 또는 mock ----
export const signup = (form) => (USE_BACKEND ? apiSignup(form) : mockSignup(form));
export const login = (userId, password, keep) =>
  USE_BACKEND ? apiLogin(userId, password, keep) : mockLogin(userId, password, keep);
export const logout = () => (USE_BACKEND ? apiLogout() : clearSession());
// 비밀번호 변경 — 백엔드는 PATCH /api/users/me/password/{내 uuid} (현재·새·새 확인). 틀리면 400 + 글자 메시지
async function mockChangePassword(userId, oldPassword, newPassword) {
  const accounts = readAccounts();
  const account = accounts.find((a) => sameId(a, userId));
  if (!account || account.pwHash !== (await hash(oldPassword))) throw new Error('현재 비밀번호가 일치하지 않습니다.');
  const pwHash = await hash(newPassword);
  writeAccounts(accounts.map((a) => (a === account ? { ...a, pwHash } : a)));
}

export const changePassword = (userId, { oldPassword, newPassword, confirmNewPassword }) =>
  USE_BACKEND
    ? api('PATCH', `/api/users/me/password/${getUserUuid()}`, { oldPassword, newPassword, confirmNewPassword })
    : mockChangePassword(userId, oldPassword, newPassword);
