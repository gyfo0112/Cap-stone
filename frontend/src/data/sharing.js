// 실시간 위치 공유 mock — 보호자(guardian, 그룹장)와 보호 대상(protected: 자녀·노약자) 계정을 연결하고,
// 기본적으로 보호자만 공유를 켜고 끌 수 있다. 보호자가 canToggle 권한을 허용한 연결에서만 보호 대상도 켜고 끌 수 있다.
// 같은 브라우저의 다른 탭끼리는 localStorage 이벤트로 실시간처럼 동작한다.
// 서버가 생기면 아래 함수 본문을 API(+WebSocket/SSE)로 바꾸고, 화면은 그대로 쓴다.
import { lookupAccount } from './auth';

const LINKS_KEY = 'mf-links'; // [{ guardianId, protectedId, sharing, canToggle, changedBy }]
const LOCATIONS_KEY = 'mf-live-locations'; // { [protectedId]: { lat, lng, ts } }
const INVITES_KEY = 'mf-invites'; // [{ code, protectedId, expires }]
const EVENT = 'mf-sharing-change';
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
export function createInvite(actor) {
  requireRole(actor, 'protected', '보호 대상 계정만 연결 코드를 만들 수 있어요.');
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const expires = Date.now() + INVITE_TTL;
  const invites = read(INVITES_KEY, []).filter((i) => i.protectedId !== actor.userId && i.expires > Date.now());
  write(INVITES_KEY, [...invites, { code, protectedId: actor.userId, expires }]);
  return { code, expires };
}

// 보호자가 코드를 입력해 보호 대상과 연결한다. 연결 직후 공유는 꺼진 상태(보호자가 켠다).
export function acceptInvite(actor, code) {
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
export function setSharing(actor, otherId, on) {
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
export function setPermission(actor, protectedId, allowed) {
  requireRole(actor, 'guardian', '권한은 보호자만 줄 수 있어요.');
  const links = readLinks();
  const link = links.find(isMine(actor, protectedId));
  if (!link) throw new Error('연결되지 않은 계정이에요.');
  write(LINKS_KEY, links.map((l) => (l === link ? { ...l, canToggle: allowed } : l)));
}

// 연결 끊기 — 보호자만 가능(보호 대상이 마음대로 끊어 공유를 피하지 못하게)
export function removeLink(actor, protectedId) {
  requireRole(actor, 'guardian', '연결 해제는 보호자만 할 수 있어요.');
  write(
    LINKS_KEY,
    readLinks().filter((l) => !(l.guardianId === actor.userId && l.protectedId === protectedId)),
  );
}

// 보호 대상의 기기가 현재 위치를 올린다 — 공유가 켜진 연결이 하나라도 있을 때만 저장
export function publishLocation(actor, lat, lng) {
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
