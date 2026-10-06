import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { USE_BACKEND } from '../api/http';
import {
  SHARING_EVENT,
  describeLinks,
  fetchConnections,
  getSharingRaw,
  parseSharing,
  publishLocation,
  subscribeSharing,
} from '../data/sharing';

const NO_CONNECTIONS = [];
const POLL_MS = 5000; // 백엔드 모드: 연결 목록(보호자는 상대 위치 포함)을 5초마다 다시 불러온다

// 연결 목록에서 화면이 쓰는 값들을 뽑는다
function summarize(user, connections) {
  const liveFriends = connections
    .filter((c) => c.location)
    .map((c) => ({ id: c.otherId, name: c.name, ...c.location }));
  // 보호 대상 계정: 지금 내 위치를 받고 있는 보호자 이름들(공유 중 표시에 쓴다)
  const sharingWith = user?.role === 'protected' ? connections.filter((c) => c.sharing).map((c) => c.name) : [];
  return { connections, liveFriends, sharingWith, shared: connections.some((c) => c.sharing) };
}

// mock: 같은 브라우저의 저장소(탭끼리 이벤트로 알림)
function useMockSharing(user) {
  const raw = useSyncExternalStore(subscribeSharing, getSharingRaw);
  return useMemo(() => summarize(user, describeLinks(user, parseSharing(raw))), [raw, user]);
}

// 백엔드: GET /api/links 를 주기적으로 불러온다. 바꾸는 동작 뒤에는 SHARING_EVENT 로 바로 다시 불러온다.
function useLiveSharing(user) {
  const [state, setState] = useState({ userId: null, connections: [] });
  const userId = user?.userId;

  useEffect(() => {
    if (!USE_BACKEND || !userId) return undefined;
    let cancelled = false;
    const load = () =>
      fetchConnections()
        .then((connections) => !cancelled && setState({ userId, connections }))
        .catch(() => {}); // 일시적으로 못 불러오면 직전 값을 유지한다
    load();
    const timer = setInterval(load, POLL_MS);
    window.addEventListener(SHARING_EVENT, load);
    return () => {
      cancelled = true;
      clearInterval(timer);
      window.removeEventListener(SHARING_EVENT, load);
    };
  }, [userId]);

  const connections = userId && state.userId === userId ? state.connections : NO_CONNECTIONS;
  return useMemo(() => summarize(user, connections), [user, connections]);
}

// 내 계정의 위치 공유 연결 목록(connections)과, 보호자라면 지도에 그릴 보호 대상 위치(liveFriends)
export function useSharing(user) {
  const mock = useMockSharing(user);
  const live = useLiveSharing(user);
  return USE_BACKEND ? live : mock;
}

// 보호 대상 기기: 보호자가 공유를 켜 둔 동안만 GPS를 따라가며 위치를 올린다.
// 움직일 때는 3초에 한 번까지, 가만히 있어도 15초마다 마지막 위치를 다시 올려서 "아직 공유 중"임을 알린다
// (이게 끊기면 보호자 화면에 "위치가 오래 갱신되지 않았어요"가 뜬다).
export function useLocationBroadcast(user, active) {
  const enabled = active && user?.role === 'protected' && Boolean(navigator.geolocation);
  useEffect(() => {
    if (!enabled) return undefined;
    let lastSent = 0;
    let latest = null;
    const send = () => {
      if (!latest) return;
      lastSent = Date.now();
      publishLocation(user, latest.lat, latest.lng).catch(() => {}); // 일시적 실패는 다음 주기에 다시 올린다
    };
    const watchId = navigator.geolocation.watchPosition(
      ({ coords }) => {
        latest = { lat: coords.latitude, lng: coords.longitude };
        if (Date.now() - lastSent >= 3000) send();
      },
      () => {},
      { enableHighAccuracy: true },
    );
    const heartbeat = setInterval(send, 15000);
    return () => {
      navigator.geolocation.clearWatch(watchId);
      clearInterval(heartbeat);
    };
  }, [enabled, user]);
}
