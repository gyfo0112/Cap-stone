import { useEffect, useRef, useState } from 'react';
import { MapPin } from 'lucide-react';
import { useMarkerLayers } from '../hooks/useMarkerLayers';

// App.jsx의 메인 지도 + SosPage.jsx의 SOS 화면 지도가 함께 쓰는 카카오맵 컴포넌트.
// 두 화면이 동시에 마운트되는 일이 없어(SOS는 전체화면 전환) id="map" 중복 걱정은 없다.
const SEOUL_CENTER = { lat: 37.5665, lng: 126.978 };
const NO_FRIENDS = [];

function MapPlaceholder({ text }) {
  return (
    <div className="mapPlaceholder">
      <MapPin size={42} />
      <strong>카카오맵</strong>
      <span>{text}</span>
    </div>
  );
}

export function MapView({ layers, location, liveFriends, pickMode, onCenterIdle, onLayerStatus }) {
  const apiKey = import.meta.env.VITE_KAKAO_MAP_KEY;
  if (!apiKey) {
    return <MapPlaceholder text=".env.local 파일에 VITE_KAKAO_MAP_KEY를 설정하세요." />;
  }
  return (
    <KakaoMap
      apiKey={apiKey}
      layers={layers}
      location={location}
      liveFriends={liveFriends}
      pickMode={pickMode}
      onCenterIdle={onCenterIdle}
      onLayerStatus={onLayerStatus}
    />
  );
}

function KakaoMap({ apiKey, layers, location, liveFriends = NO_FRIENDS, pickMode, onCenterIdle, onLayerStatus }) {
  const boxRef = useRef(null);
  const [error, setError] = useState('');
  const [map, setMap] = useState(null);
  const meOverlayRef = useRef(null);
  const friendOverlaysRef = useRef(new Map()); // 보호 대상 id → 지도 위 표시

  // 지도 영역 크기가 바뀌면(PC 정보 패널 접기/펴기, 창 크기 변경) 카카오맵은 스스로 다시 그리지
  // 않아 빈 공간이 생긴다 — 크기 변화를 감지해 relayout 해준다.
  useEffect(() => {
    if (!map || !boxRef.current) return undefined;
    const observer = new ResizeObserver(() => map.relayout());
    observer.observe(boxRef.current);
    return () => observer.disconnect();
  }, [map]);

  useMarkerLayers(map, layers, onLayerStatus);

  // 지도에서 찍기 모드: 지도를 움직여 멈출 때마다(idle) 중심 좌표를 위로 올려준다.
  useEffect(() => {
    if (!map || !pickMode) return undefined;
    const { kakao } = window;
    const reportCenter = () => {
      const center = map.getCenter();
      onCenterIdle?.({ lat: center.getLat(), lng: center.getLng() });
    };
    kakao.maps.event.addListener(map, 'idle', reportCenter);
    reportCenter();
    return () => kakao.maps.event.removeListener(map, 'idle', reportCenter);
  }, [map, pickMode, onCenterIdle]);

  // 실제 GPS 좌표가 들어오면 지도를 그쪽으로 이동하고 "내 위치" 점을 찍는다.
  useEffect(() => {
    if (!map || location?.lat == null) return;
    const { kakao } = window;
    const pos = new kakao.maps.LatLng(location.lat, location.lng);
    map.panTo(pos);

    if (!meOverlayRef.current) {
      const content = document.createElement('div');
      content.className = 'kakaoMeDot';
      meOverlayRef.current = new kakao.maps.CustomOverlay({ position: pos, content, zIndex: 10 });
      meOverlayRef.current.setMap(map);
    } else {
      meOverlayRef.current.setPosition(pos);
    }
  }, [map, location]);

  // 위치 공유 중인 보호 대상(보호자 화면) — 이름표 달린 초록 점. 처음 나타날 때만 그쪽으로 지도를 옮긴다.
  useEffect(() => {
    if (!map) return;
    const { kakao } = window;
    const overlays = friendOverlaysRef.current;
    const seen = new Set();
    liveFriends.forEach((f) => {
      seen.add(f.id);
      const pos = new kakao.maps.LatLng(f.lat, f.lng);
      const existing = overlays.get(f.id);
      if (existing) {
        existing.setPosition(pos);
        return;
      }
      const el = document.createElement('div');
      el.className = 'kakaoFriend';
      const label = document.createElement('span');
      label.textContent = f.name;
      el.append(label, document.createElement('i'));
      const overlay = new kakao.maps.CustomOverlay({ position: pos, content: el, zIndex: 9 });
      overlay.setMap(map);
      overlays.set(f.id, overlay);
      map.panTo(pos);
    });
    overlays.forEach((overlay, id) => {
      if (!seen.has(id)) {
        overlay.setMap(null);
        overlays.delete(id);
      }
    });
  }, [map, liveFriends]);

  useEffect(() => {
    let cancelled = false;

    const draw = () => {
      if (cancelled || !boxRef.current) return;
      window.kakao.maps.load(() => {
        if (cancelled || !boxRef.current) return;
        setMap(
          new window.kakao.maps.Map(boxRef.current, {
            center: new window.kakao.maps.LatLng(SEOUL_CENTER.lat, SEOUL_CENTER.lng),
            level: 5,
          }),
        );
      });
    };

    if (window.kakao?.maps) {
      draw();
      return () => {
        cancelled = true;
      };
    }

    let script = document.getElementById('kakao-map-sdk');
    if (!script) {
      script = document.createElement('script');
      script.id = 'kakao-map-sdk';
      script.async = true;
      script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${apiKey}&autoload=false&libraries=clusterer`;
      document.head.appendChild(script);
    }

    const onError = () => {
      if (!cancelled) {
        setError(
          '카카오맵 SDK를 불러오지 못했습니다. Kakao Developers에서 카카오맵 활성화, 비즈월렛 연결, Web 플랫폼 도메인 등록을 확인하세요.',
        );
      }
    };
    script.addEventListener('load', draw);
    script.addEventListener('error', onError);

    return () => {
      cancelled = true;
      script.removeEventListener('load', draw);
      script.removeEventListener('error', onError);
    };
  }, [apiKey]);

  if (error) return <MapPlaceholder text={error} />;

  return <div ref={boxRef} id="map" className="kakaoMap" />;
}
