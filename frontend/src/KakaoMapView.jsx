import { useEffect, useRef, useState } from 'react';
import { MapPin } from 'lucide-react';
import { useCctvLayer } from './useCctvLayer';

// App.jsx의 메인 지도 + SosPage.jsx의 SOS 화면 지도가 함께 쓰는 카카오맵 컴포넌트.
// 두 화면이 동시에 마운트되는 일이 없어(SOS는 전체화면 전환) id="map" 중복 걱정은 없다.
const SEOUL_CENTER = { lat: 37.5665, lng: 126.978 };

function MapPlaceholder({ text }) {
  return (
    <div className="mapPlaceholder">
      <MapPin size={42} />
      <strong>카카오맵</strong>
      <span>{text}</span>
    </div>
  );
}

export function MapView({ layers, location, pickMode, onCenterIdle }) {
  const apiKey = import.meta.env.VITE_KAKAO_MAP_KEY;
  if (!apiKey) {
    return <MapPlaceholder text=".env.local 파일에 VITE_KAKAO_MAP_KEY를 설정하세요." />;
  }
  return (
    <KakaoMap
      apiKey={apiKey}
      layers={layers}
      location={location}
      pickMode={pickMode}
      onCenterIdle={onCenterIdle}
    />
  );
}

function KakaoMap({ apiKey, layers, location, pickMode, onCenterIdle }) {
  const boxRef = useRef(null);
  const [error, setError] = useState('');
  const [map, setMap] = useState(null);
  const meOverlayRef = useRef(null);

  useCctvLayer(map, layers.cctv);

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
