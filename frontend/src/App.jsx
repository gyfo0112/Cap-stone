import { useCallback, useEffect, useRef, useState } from 'react';
import {
  MapPin,
  Bell,
  ShieldCheck,
  UserRound,
  Search,
  ArrowUpDown,
  Clock3,
  PersonStanding,
  Camera,
  Lightbulb,
  Siren,
} from 'lucide-react';
import './App.css';
import logo from './images/logo.png';
import { useCctvLayer } from './useCctvLayer';
import { useIsMobile } from './useIsMobile';
import { useCurrentLocation } from './useCurrentLocation';
import { useTheme } from './useTheme';
import {
  Onboarding,
  MainMapCard,
  MapSearchOverlay,
  MapControls,
  MobileTabBar,
  RouteInputScreen,
  RouteResultScreen,
  RouteDetailScreen,
  MapPickScreen,
  CrimeLayerScreen,
  SettingsScreen,
  SosFab,
  SosOverlay,
} from './MobileFlow';

function App() {
  const [theme, setTheme] = useTheme();
  const [menu, setMenu] = useState('route');
  const [layers, setLayers] = useState({ cctv: false });
  const toggleLayer = (key) => setLayers((s) => ({ ...s, [key]: !s[key] }));

  const isMobile = useIsMobile();
  // 실제 GPS 위치 + (REST 키 있으면) 주소. 실패해도 각 화면이 알아서 mock으로 대체.
  const myLocation = useCurrentLocation();

  const [onboardingDone, setOnboardingDone] = useState(() => {
    try {
      return localStorage.getItem('safemap_onboarded') === '1';
    } catch {
      return false;
    }
  });
  const finishOnboarding = () => {
    try {
      localStorage.setItem('safemap_onboarded', '1');
    } catch {
      /* 저장 실패해도 화면은 넘어가야 함 */
    }
    setOnboardingDone(true);
  };

  // 모바일 하단 탭: 지도 / 경로 / 도움요청 / 설정 (SOS는 탭이 아니라 중앙 FAB)
  const [mobileTab, setMobileTab] = useState('map');
  // 경로 탭 안에서의 하위 흐름: 지도 하단시트 -> 경로입력 -> 경로결과 -> 경로상세
  const [mobileScreen, setMobileScreen] = useState(null); // null | 'input' | 'result' | 'detail'
  const [sosOpen, setSosOpen] = useState(false);
  const [crimeLayerOpen, setCrimeLayerOpen] = useState(false);
  const [destination, setDestination] = useState('');
  const [safetyWeight, setSafetyWeight] = useState(62);
  // 일몰 이후 진입하면 기본값을 '야간'으로 시작 (README 스펙)
  const [timeMode, setTimeMode] = useState(() => {
    const hour = new Date().getHours();
    return hour >= 19 || hour < 6 ? 'night' : 'now';
  });
  const [selectedRouteId, setSelectedRouteId] = useState('safe');
  const [mapPickerOpen, setMapPickerOpen] = useState(false);
  const [pickCenter, setPickCenter] = useState(null);
  const onCenterIdle = useCallback((coord) => setPickCenter(coord), []);

  // 범죄주의구간/SOS/지도찍기 오버레이는 탭·화면 상태와 별개라, 화면을 옮길 때 같이 닫아준다
  const closeOverlays = () => {
    setCrimeLayerOpen(false);
    setSosOpen(false);
    setMapPickerOpen(false);
  };

  const openMapPicker = () => {
    setPickCenter(null);
    setMapPickerOpen(true);
  };

  const openRouteInput = (prefill) => {
    closeOverlays();
    setDestination(prefill);
    setMobileTab('route');
    setMobileScreen('input');
  };

  const closeRouteFlow = () => {
    setMobileScreen(null);
    setMobileTab('map');
  };

  const selectMobileTab = (key) => {
    if (key === 'route') {
      openRouteInput('');
      return;
    }
    closeOverlays();
    setMobileTab(key);
    setMobileScreen(null); // 다른 탭으로 이동하면 진행 중이던 경로 흐름은 닫음
  };

  // 하단시트(controlPanel)가 화면에서 실제로 시작하는 y좌표를 재서
  // "현재 위치로 이동" 버튼을 그 바로 위에 붙인다. 시트는 하단탭바(64px)
  // 위에 떠 있어서 시트 height만으로는 못 구하고, 화면 top 기준으로 직접 계산.
  const controlPanelRef = useRef(null);
  const [sheetTopGap, setSheetTopGap] = useState(0);
  useEffect(() => {
    if (!isMobile || !controlPanelRef.current) return undefined;
    const el = controlPanelRef.current;
    const observer = new ResizeObserver(() => {
      const top = el.getBoundingClientRect().top;
      setSheetTopGap(window.innerHeight - top);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [isMobile]);

  return (
    <div className="app">
      {/* 왼쪽 메뉴 */}
      <aside className="sidebar">
        <div>
          <div className="logo">
            <img src={logo} alt="친절한 이웃 로고" className="logoImage" />

            <div className="logoText">
              친절한 <span>이웃</span>
            </div>
          </div>

          {isMobile ? (
            <MobileTabBar active={mobileTab} onSelect={selectMobileTab} />
          ) : (
            <nav className="menu">
              <button
                className={menu === 'route' ? 'menuItem active' : 'menuItem'}
                onClick={() => setMenu('route')}
              >
                <MapPin size={22} />
                <span>안전 귀갓길 찾기</span>
              </button>

              <button
                className={menu === 'help' ? 'menuItem active' : 'menuItem'}
                onClick={() => setMenu('help')}
              >
                <Bell size={22} />
                <span>도움요청</span>
              </button>

              <button
                className={menu === 'facility' ? 'menuItem active' : 'menuItem'}
                onClick={() => setMenu('facility')}
              >
                <ShieldCheck size={22} />
                <span>공공시설 확인</span>
              </button>
            </nav>
          )}
        </div>

        <div className="sidebarBottom">
          <button className="emergencyButton">
            <Siren size={21} />
            도움요청하기
          </button>

          <button className="loginButton">
            <UserRound size={22} />
            로그인
          </button>
        </div>
      </aside>

      {/* 가운데 기능 패널 */}
      <section className="controlPanel" ref={controlPanelRef}>
        {isMobile ? (
          <>
            {mobileTab === 'map' && (
              <MainMapCard onOpenInput={openRouteInput} locationLabel={myLocation.address} />
            )}
            {mobileTab === 'help' && <HelpPanel />}
          </>
        ) : (
          <>
            {menu === 'route' && <RoutePanel />}
            {menu === 'help' && <HelpPanel />}
            {menu === 'facility' && <FacilityPanel layers={layers} onToggle={toggleLayer} />}
          </>
        )}
      </section>

      {/* 오른쪽 지도 영역 */}
      <main className="mapArea">
        <MapView
          layers={layers}
          location={isMobile ? myLocation : null}
          pickMode={mapPickerOpen}
          onCenterIdle={onCenterIdle}
        />
      </main>

      {/* 모바일 전용: 지도 위 검색바+오버레이 칩+컨트롤 / 온보딩 / 경로 흐름 / SOS / 범죄레이어 / 설정 */}
      {isMobile && onboardingDone && mobileTab === 'map' && mobileScreen === null && (
        <>
          <MapSearchOverlay
            cctvOn={layers.cctv}
            onToggleCctv={() => toggleLayer('cctv')}
            crimeOn={crimeLayerOpen}
            onOpenCrime={() => setCrimeLayerOpen((v) => !v)}
            onOpenInput={openRouteInput}
          />
          <MapControls onLocate={myLocation.refresh} bottomOffset={sheetTopGap ? sheetTopGap + 14 : undefined} />
        </>
      )}

      {isMobile && !onboardingDone && <Onboarding onDone={finishOnboarding} />}

      {isMobile && onboardingDone && mobileScreen === 'input' && !mapPickerOpen && (
        <RouteInputScreen
          initialDestination={destination}
          originLabel={myLocation.address}
          onBack={closeRouteFlow}
          onPickOnMap={openMapPicker}
          onSelect={(name) => {
            setDestination(name);
            setMobileScreen('result');
          }}
        />
      )}

      {isMobile && onboardingDone && mapPickerOpen && (
        <MapPickScreen
          center={pickCenter}
          onCancel={() => setMapPickerOpen(false)}
          onConfirm={(name) => {
            setDestination(name);
            setMapPickerOpen(false);
            setMobileScreen('result');
          }}
        />
      )}

      {isMobile && onboardingDone && mobileScreen === 'result' && (
        <RouteResultScreen
          destination={destination}
          originLabel={myLocation.address}
          safetyWeight={safetyWeight}
          onSafetyWeightChange={setSafetyWeight}
          timeMode={timeMode}
          onTimeModeChange={setTimeMode}
          selectedRouteId={selectedRouteId}
          onSelectRoute={setSelectedRouteId}
          onBack={() => setMobileScreen('input')}
          onStart={() => setMobileScreen('detail')}
        />
      )}

      {isMobile && onboardingDone && mobileScreen === 'detail' && (
        <RouteDetailScreen onEnd={closeRouteFlow} />
      )}

      {isMobile && onboardingDone && mobileTab === 'settings' && (
        <SettingsScreen
          safetyWeight={safetyWeight}
          onSafetyWeightChange={setSafetyWeight}
          theme={theme}
          onThemeChange={setTheme}
        />
      )}

      {isMobile && crimeLayerOpen && <CrimeLayerScreen />}

      {isMobile && onboardingDone && !sosOpen && <SosFab onOpen={() => setSosOpen(true)} />}
      {isMobile && sosOpen && <SosOverlay onClose={() => setSosOpen(false)} />}
    </div>
  );
}

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

function MapView({ layers, location, pickMode, onCenterIdle }) {
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

function RoutePanel() {
  return (
    <div className="panelContent">
      <h1>안전 귀갓길 찾기</h1>

      <p className="subtitle">더 안전한 길, 함께 만들어가는 우리 동네</p>

      <div className="locationBox">
        <div className="locationInput">
          <span className="dot blue"></span>
          <input placeholder="출발지 입력" />
        </div>

        <div className="divider"></div>

        <div className="locationInput">
          <span className="dot red"></span>
          <input placeholder="도착지 입력" />
        </div>

        <button className="swap">
          <ArrowUpDown size={18} />
        </button>
      </div>

      <h3 className="sectionTitle">경로 옵션</h3>

      <div className="routeOptions">
        <button className="routeOption activeOption">
          <ShieldCheck size={29} />
          <strong>안전 우선</strong>
          <small>CCTV, 가로등 고려</small>
        </button>

        <button className="routeOption">
          <Clock3 size={29} />
          <strong>빠른 길</strong>
          <small>최단 시간 경로</small>
        </button>

        <button className="routeOption">
          <PersonStanding size={29} />
          <strong>도보 전용</strong>
          <small>걸어가는 경로</small>
        </button>
      </div>

      <button className="searchRouteButton">
        <Search size={22} />
        경로 검색하기
      </button>

      <div className="safetyCard">
        <h3>안전 지표 안내</h3>

        <div className="safetyRow">
          <div className="safetyIcon blueSafety">
            <Camera />
          </div>

          <div>
            <strong>CCTV</strong>
            <p>주변 CCTV 설치 지역</p>
          </div>
        </div>

        <div className="safetyRow">
          <div className="safetyIcon yellowSafety">
            <Lightbulb />
          </div>

          <div>
            <strong>가로등</strong>
            <p>가로등이 설치된 구간</p>
          </div>
        </div>

        <div className="safetyRow">
          <div className="safetyIcon purpleSafety">
            <ShieldCheck />
          </div>

          <div>
            <strong>여성지킴이 귀갓길</strong>
            <p>안전 순찰 구간</p>
          </div>
        </div>
      </div>

      <div className="communityCard">
        <div className="peopleIllustration">👩‍🦰👨</div>

        <div>
          <strong>
            함께 만드는
            <br />더 안전한 우리 동네
          </strong>

          <p>친절한 이웃이 함께합니다.</p>
        </div>
      </div>
    </div>
  );
}

function HelpPanel() {
  return (
    <div className="panelContent">
      <h1>도움요청</h1>

      <p className="subtitle">주변에서 요청한 도움을 확인할 수 있습니다.</p>

      <div className="helpLegend">
        <span>
          <i className="yellowUrgency"></i>
          일반
        </span>

        <span>
          <i className="orangeUrgency"></i>
          주의
        </span>

        <span>
          <i className="redUrgency"></i>
          긴급
        </span>
      </div>

      <div className="requestCard orangeBorder">
        <div className="requestHeader">
          <strong>귀갓길 동행이 필요해요</strong>
          <span className="orangeBadge">주의</span>
        </div>

        <p>성수역 2번 출구 근처</p>
        <div className="requestInfo">약 0.8km · 5분 전</div>
      </div>

      <div className="requestCard redBorder">
        <div className="requestHeader">
          <strong>긴급하게 도움이 필요합니다</strong>
          <span className="redBadge">긴급</span>
        </div>

        <p>서울숲 인근 골목</p>
        <div className="requestInfo">약 1.2km · 2분 전</div>
      </div>

      <div className="requestCard yellowBorder">
        <div className="requestHeader">
          <strong>무거운 짐 옮기는 것을 도와주세요</strong>
          <span className="yellowBadge">일반</span>
        </div>

        <p>왕십리역 근처</p>
        <div className="requestInfo">약 1.5km · 12분 전</div>
      </div>
    </div>
  );
}

function FacilityPanel({ layers, onToggle }) {
  return (
    <div className="panelContent">
      <h1>공공시설 확인</h1>

      <p className="subtitle">지도에서 원하는 안전시설을 확인하세요.</p>

      <button
        className={layers.cctv ? 'facilityButton active' : 'facilityButton'}
        onClick={() => onToggle('cctv')}
      >
        <Camera />

        <div>
          <strong>CCTV 위치</strong>
          <span>{layers.cctv ? '표시 중 · 다시 눌러 숨기기' : '지도에 CCTV 표시'}</span>
        </div>
      </button>

      <button className="facilityButton" disabled>
        <Lightbulb />

        <div>
          <strong>가로등 위치</strong>
          <span>준비 중</span>
        </div>
      </button>

      <button className="facilityButton" disabled>
        <ShieldCheck />

        <div>
          <strong>여성지킴이 귀갓길</strong>
          <span>준비 중</span>
        </div>
      </button>
    </div>
  );
}

export default App;
