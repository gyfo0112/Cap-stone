import { useEffect, useMemo, useSyncExternalStore } from 'react';
import { describeLinks, getSharingRaw, parseSharing, publishLocation, subscribeSharing } from '../data/sharing';

// 내 계정의 위치 공유 연결 목록(connections)과, 보호자라면 지도에 그릴 보호 대상 위치(liveFriends)
export function useSharing(user) {
  const raw = useSyncExternalStore(subscribeSharing, getSharingRaw);
  return useMemo(() => {
    const connections = describeLinks(user, parseSharing(raw));
    const liveFriends = connections
      .filter((c) => c.location)
      .map((c) => ({ id: c.otherId, name: c.name, ...c.location }));
    // 보호 대상 계정: 지금 내 위치를 받고 있는 보호자 이름들(공유 중 표시에 쓴다)
    const sharingWith = user?.role === 'protected' ? connections.filter((c) => c.sharing).map((c) => c.name) : [];
    return { connections, liveFriends, sharingWith, shared: connections.some((c) => c.sharing) };
  }, [raw, user]);
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
      publishLocation(user, latest.lat, latest.lng);
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
