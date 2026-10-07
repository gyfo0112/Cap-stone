// 실시간 위치 공유 — 보호자(guardian, 그룹장)와 보호 대상(protected: 자녀·노약자) 계정을 연결하고,
// 기본적으로 보호자만 공유를 켜고 끌 수 있다. 보호자가 canToggle 권한을 허용한 연결에서만 보호 대상도 켜고 끌 수 있다.
// VITE_USE_BACKEND=true면 백엔드(/api/invites · /api/links · /api/location, 권한은 서버가 검사),
// 아니면 같은 브라우저의 다른 탭끼리 localStorage 이벤트로 실시간처럼 동작하는 mock.
// 화면이 쓰는 함수(createInvite · acceptInvite · setSharing · setPermission · removeLink · publishLocation)는
// 두 모드 모두 Promise를 돌려주고, 연결 항목(conn)을 받는다 — mock은 conn.otherId, 백엔드는 conn.linkId 를 쓴다.
import { USE_BACKEND, api } from '../api/http';
import { lookupAccount } from './auth';

const LINKS_KEY = 'mf-links'; // [{ guardianId, protectedId, sharing, canToggle, changedBy }]
const LOCATIONS_KEY = 'mf-live-locations'; // { [protectedId]: { lat, lng, ts } }
const INVITES_KEY = 'mf-invites'; // [{ code, protectedId, expires }]
const EVENT = 'mf-sharing-change';
export const SHARING_EVENT = EVENT; // 바뀌었으니 다시 불러오라는 신호(탭 사이·백엔드 모드 새로고침 겸용)
const INVITE_TTL = 10 * 60 * 1000; // 연결 코드는 10분 동안만 유효

// 시연용: 기본 보호자(test1234) ↔ 기본 보호 대상(child1234)은 처음부터 연결(공유는 꺼진 상태)
const DEFAULT_LINKS = [{ guardianId: 'test1234', protectedId: 'child1234', sharing: false, canToggle: false }];

const read = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
};

const write = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new Event(EVENT));
};

// useSyncExternalStore용 — 연결/위치가 바뀌면 문자열이 바뀐다(JSON은 줄바꿈이 없어 \n으로 안전하게 나눌 수 있다)
export const getSharingRaw = () => `${localStorage.getItem(LINKS_KEY) ?? ''}\n${localStorage.getItem(LOCATIONS_KEY) ?? ''}`;

export function subscribeSharing(callback) {
  window.addEventListener(EVENT, callback);
  window.addEventListener('storage', callback);
  return () => {
    window.removeEventListener(EVENT, callback);
    window.removeEventListener('storage', callback);
  };
}

export const parseSharing = (raw) => {
  const [links, locations] = raw.split('\n');
  return { links: links ? JSON.parse(links) : DEFAULT_LINKS, locations: locations ? JSON.parse(locations) : {} };
};

const readLinks = () => read(LINKS_KEY, DEFAULT_LINKS);

function requireRole(actor, role, message) {
  if (!actor || actor.role !== role) throw new Error(message);
}

// 보호 대상이 연결 코드(6자리)를 만든다 — 보호자가 이 코드를 입력하면 연결된다. 새 코드를 만들면 이전 코드는 무효.
function mockCreateInvite(actor) {
  requireRole(actor, 'protected', '보호 대상 계정만 연결 코드를 만들 수 있어요.');
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const expires = Date.now() + INVITE_TTL;
  const invites = read(INVITES_KEY, []).filter((i) => i.protectedId !== actor.userId && i.expires > Date.now());
  write(INVITES_KEY, [...invites, { code, protectedId: actor.userId, expires }]);
  return { code, expires };
}

// 보호자가 코드를 입력해 보호 대상과 연결한다. 연결 직후 공유는 꺼진 상태(보호자가 켠다).
function mockAcceptInvite(actor, code) {
  requireRole(actor, 'guardian', '보호자 계정만 연결할 수 있어요.');
  const invites = read(INVITES_KEY, []);
  const invite = invites.find((i) => i.code === code.trim());
  if (!invite) throw new Error('연결 코드가 올바르지 않거나 새 코드로 바뀌었어요. 보호 대상에게 코드를 다시 확인하세요.');
  if (invite.expires <= Date.now()) throw new Error('연결 코드가 만료됐어요(10분). 보호 대상에게 새 코드를 받아주세요.');
  const links = readLinks();
  if (links.some((l) => l.guardianId === actor.userId && l.protectedId === invite.protectedId)) {
    throw new Error('이미 연결돼 있어요.');
  }
  write(INVITES_KEY, invites.filter((i) => i !== invite && i.expires > Date.now()));
  write(LINKS_KEY, [...links, { guardianId: actor.userId, protectedId: invite.protectedId, sharing: false, canToggle: false }]);
}

// 이 연결(link)을 누가 바꾸는지 가려낸다 — actor가 보호자면 otherId는 보호 대상, 보호 대상이면 otherId는 보호자
const isMine = (actor, otherId) => (l) =>
  actor.role === 'guardian'
    ? l.guardianId === actor.userId && l.protectedId === otherId
    : l.protectedId === actor.userId && l.guardianId === otherId;

// 공유 켜기/끄기 — 보호자는 자기 연결에서 언제나 가능. 보호 대상은 보호자가 허용(canToggle)한 연결에서만 가능.
function mockSetSharing(actor, otherId, on) {
  if (!actor) throw new Error('로그인이 필요해요.');
  const links = readLinks();
  const link = links.find(isMine(actor, otherId));
  if (!link) throw new Error('연결되지 않은 계정이에요.');
  if (actor.role === 'protected' && !link.canToggle) {
    throw new Error('보호자가 허용해야 위치 공유를 켜고 끌 수 있어요.');
  }
  write(LINKS_KEY, links.map((l) => (l === link ? { ...l, sharing: on, changedBy: actor.role } : l)));
}

// 보호 대상에게 공유 켜기/끄기 권한을 주거나 거둔다 — 보호자(그룹장)만 가능. 거두면 보호 대상의 스위치가 사라진다.
function mockSetPermission(actor, protectedId, allowed) {
  requireRole(actor, 'guardian', '권한은 보호자만 줄 수 있어요.');
  const links = readLinks();
  const link = links.find(isMine(actor, protectedId));
  if (!link) throw new Error('연결되지 않은 계정이에요.');
  write(LINKS_KEY, links.map((l) => (l === link ? { ...l, canToggle: allowed } : l)));
}

// 연결 끊기 — 보호자만 가능(보호 대상이 마음대로 끊어 공유를 피하지 못하게)
function mockRemoveLink(actor, protectedId) {
  requireRole(actor, 'guardian', '연결 해제는 보호자만 할 수 있어요.');
  write(
    LINKS_KEY,
    readLinks().filter((l) => !(l.guardianId === actor.userId && l.protectedId === protectedId)),
  );
}

// 보호 대상의 기기가 현재 위치를 올린다 — 공유가 켜진 연결이 하나라도 있을 때만 저장
function mockPublishLocation(actor, lat, lng) {
  requireRole(actor, 'protected', '보호 대상 계정만 위치를 올릴 수 있어요.');
  if (!readLinks().some((l) => l.protectedId === actor.userId && l.sharing)) return;
  write(LOCATIONS_KEY, { ...read(LOCATIONS_KEY, {}), [actor.userId]: { lat, lng, ts: Date.now() } });
}

// 내 계정 기준 연결 목록 — 상대 이름/역할과 (보호자라면) 상대 위치를 붙여 돌려준다
export function describeLinks(user, { links, locations }) {
  if (!user) return [];
  const mine = user.role === 'protected' ? 'protectedId' : 'guardianId';
  const other = user.role === 'protected' ? 'guardianId' : 'protectedId';
  return links
    .filter((l) => l[mine] === user.userId)
    .map((l) => ({
      otherId: l[other],
      name: lookupAccount(l[other])?.name ?? l[other],
      sharing: l.sharing,
      canToggle: Boolean(l.canToggle),
      changedBy: l.changedBy,
      location: user.role === 'guardian' && l.sharing ? locations[l.protectedId] ?? null : null,
    }));
}

// ---- 백엔드(/api) 연결 ----
// 서버 응답(내 계정 기준 "상대" 정보) → 화면용 연결 항목. 위치는 보호자이고 공유 중일 때만 값이 온다.
export async function fetchConnections() {
  const links = await api('GET', '/api/links');
  return links.map((l) => ({
    otherId: l.user_id,
    linkId: l.link_id,
    name: l.user_name,
    sharing: l.sharing,
    canToggle: Boolean(l.can_toggle),
    changedBy: l.changed_by ?? undefined,
    location: l.latitude != null ? { lat: l.latitude, lng: l.longitude, ts: l.updated_at } : null,
  }));
}

// 서버에 바꾼 뒤에는 화면이 바로 새 상태를 다시 불러오게 신호를 보낸다
async function changed(promise) {
  const result = await promise;
  window.dispatchEvent(new Event(EVENT));
  return result;
}

// ---- 화면이 쓰는 함수: 모드에 따라 백엔드 또는 mock ----
export async function createInvite(actor) {
  if (!USE_BACKEND) return mockCreateInvite(actor);
  const r = await api('POST', '/api/invites');
  return { code: r.code, expires: r.expires_at };
}

export const acceptInvite = (actor, code) =>
  USE_BACKEND ? changed(api('POST', '/api/links/accept', { code: code.trim() })) : Promise.resolve(mockAcceptInvite(actor, code));

export const setSharing = (actor, conn, on) =>
  USE_BACKEND
    ? changed(api('PATCH', `/api/links/${conn.linkId}/sharing`, { on }))
    : Promise.resolve(mockSetSharing(actor, conn.otherId, on));

export const setPermission = (actor, conn, allowed) =>
  USE_BACKEND
    ? changed(api('PATCH', `/api/links/${conn.linkId}/permission`, { can_toggle: allowed }))
    : Promise.resolve(mockSetPermission(actor, conn.otherId, allowed));

export const removeLink = (actor, conn) =>
  USE_BACKEND ? changed(api('DELETE', `/api/links/${conn.linkId}`)) : Promise.resolve(mockRemoveLink(actor, conn.otherId));

// 보호 대상 기기가 현재 위치를 올린다(서버는 공유가 켜진 연결이 있을 때만 저장하고 saved:false 를 돌려준다)
export const publishLocation = (actor, lat, lng) =>
  USE_BACKEND
    ? api('PUT', '/api/location', { latitude: lat, longitude: lng })
    : Promise.resolve(mockPublishLocation(actor, lat, lng));
