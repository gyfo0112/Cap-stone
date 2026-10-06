import { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
// 전역 스타일 — 기존과 같은 순서(App.css → 로그인/SOS → MobileFlow.css)로 불러온다
import './styles/App.css';
import LoginPage from './pages/login/LoginPage';
import SosPage from './pages/sos/SosPage';
import { MapView } from './components/KakaoMapView';
import { useAuth } from './hooks/useAuth';
import { useCurrentLocation } from './hooks/useCurrentLocation';
import { useIsMobile } from './hooks/useIsMobile';
import { useLocationBroadcast, useSharing } from './hooks/useSharing';
import { useStoredState } from './hooks/useStoredState';
import { useTheme } from './hooks/useTheme';
import { Sidebar } from './components/layout/Sidebar';
import { HelpPanel } from './pages/help/HelpPanel';
import { CrimeLayerScreen } from './pages/map/CrimeLayerScreen';
import { FacilityPanel } from './pages/map/FacilityPanel';
import { MainMapCard } from './pages/map/MainMapCard';
import { MapControls } from './pages/map/MapControls';
import { MapSearchOverlay } from './pages/map/MapSearchOverlay';
import { Onboarding } from './pages/onboarding/Onboarding';
import { MapPickScreen } from './pages/route/MapPickScreen';
import { NavigationPanel } from './pages/route/NavigationPanel';
import { RouteDetailScreen } from './pages/route/RouteDetailScreen';
import { RouteInputScreen } from './pages/route/RouteInputScreen';
import { RoutePanel } from './pages/route/RoutePanel';
import { RouteResultScreen } from './pages/route/RouteResultScreen';
import { SettingsPanel } from './pages/settings/SettingsPanel';
import { SettingsScreen } from './pages/settings/SettingsScreen';
import { SosFab, SosOverlay } from './pages/sos/SosScreen';
import './styles/MobileFlow.css';

// startMenu: AppRouter.jsx가 주소(/map, /route, /help, /settings)에 맞춰 넘겨주는 '처음 열 메뉴'.
// 들어온 뒤의 메뉴 이동은 지금처럼 상태값으로 한다(주소는 바꾸지 않음).
function App({ startMenu = 'map' }) {
  const [theme, setTheme] = useTheme();
  const [menu, setMenu] = useState(startMenu);
  const [navigationActive, setNavigationActive] = useState(false);

  // 메뉴를 바꾸면 진행 중이던 길 안내는 접어둔다 (frontend-junwoo의 handleMenuChange와 동일)
  const selectDesktopMenu = (key) => {
    if (key !== 'route') setNavigationActive(false);
    setMenu(key);
  };
  const [layers, setLayers] = useState({ cctv: false, streetlight: false, safeHouse: false, safetyBell: false });
  const toggleLayer = (key) => setLayers((s) => ({ ...s, [key]: !s[key] }));
  // 레이어별 불러오기 상태('ok' | 'fallback' | 'zoom' | 'error') — 패널/칩 안내 문구용
  const [layerStatus, setLayerStatus] = useState({});
  const onLayerStatus = useCallback(
    (key, status) => setLayerStatus((s) => (s[key] === status ? s : { ...s, [key]: status })),
    [],
  );

  const isMobile = useIsMobile();
  // 실제 GPS 위치 + (REST 키 있으면) 주소. 실패해도 각 화면이 알아서 mock으로 대체.
  const myLocation = useCurrentLocation();

  // 실시간 위치 공유 — 보호자는 보호 대상의 위치를 지도에 받고, 보호 대상은 공유가 켜진 동안 위치를 올린다
  const { user } = useAuth();
  const { liveFriends, shared } = useSharing(user);
  useLocationBroadcast(user, shared);

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
  const [mobileTab, setMobileTab] = useState(startMenu);
  // 경로 탭 안에서의 하위 흐름: 지도 하단시트 -> 경로입력 -> 경로결과 -> 경로상세
  // /route로 들어오면 모바일은 경로 탭을 누른 것과 같이 경로 입력 화면부터
  const [mobileScreen, setMobileScreen] = useState(startMenu === 'route' ? 'input' : null); // null | 'input' | 'result' | 'detail'
  const [sosOpen, setSosOpen] = useState(false);
  const [crimeLayerOpen, setCrimeLayerOpen] = useState(false);
  const [destination, setDestination] = useState('');
  const [routePriority, setRoutePriority] = useStoredState('mf-route-priority', 'safe'); // 'safe' | 'shortest'
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

  // 데스크탑 사이드바의 로그인/도움요청하기 버튼 — 전체 화면을 덮는 별도 페이지로 전환.
  // 모바일에서는 sidebarBottom 자체가 숨겨져 있어 두 state 모두 쓰이지 않는다.
  const [loginOpen, setLoginOpen] = useState(false);
  const [desktopSosOpen, setDesktopSosOpen] = useState(false);

  // 로그인/SOS 페이지를 여는 동안 메인 화면은 숨기기만 하고 마운트는 유지 — 경로 검색·결과,
  // 설정 중이던 값이 돌아왔을 때 그대로 남는다(SafetyMap/frontend 통합본 방식).
  const fullPageOpen = loginOpen || desktopSosOpen;

  // PC 가운데 정보 패널 접기 — 지도를 넓게 보고 싶을 때. 새로고침해도 유지.
  const [panelCollapsed, setPanelCollapsed] = useStoredState('mf-panel-collapsed', false);
  const collapsed = panelCollapsed && !isMobile;

  return (
    <>
    <div
      className={collapsed ? 'app panelCollapsed' : 'app'}
      style={fullPageOpen ? { display: 'none' } : undefined}
    >
      {/* 공통 레이아웃: 왼쪽 메뉴(PC) / 하단 탭바(모바일) */}
      <Sidebar
        isMobile={isMobile}
        mobileTab={mobileTab}
        onSelectMobileTab={selectMobileTab}
        menu={menu}
        onSelectMenu={selectDesktopMenu}
        onOpenSos={() => setDesktopSosOpen(true)}
        onOpenLogin={() => setLoginOpen(true)}
      />

      {/* 가운데 기능 패널 */}
      <section className="controlPanel" ref={controlPanelRef}>
        {isMobile ? (
          <>
            {mobileTab === 'map' && (
              <MainMapCard
                onOpenInput={openRouteInput}
                locationLabel={myLocation.address || (myLocation.status === 'loading' ? '위치 확인 중' : '')}
                lat={myLocation.lat}
                lng={myLocation.lng}
              />
            )}
            {mobileTab === 'help' && <HelpPanel onOpenLogin={() => setLoginOpen(true)} />}
          </>
        ) : (
          <>
            {/* menu 조건 밖에 항상 마운트해서, 다른 메뉴 다녀와도 검색 상태가 안 날아가게 함
                (frontend-junwoo RoutePage와 같은 방식) */}
            <div style={{ display: menu === 'route' && !navigationActive ? 'block' : 'none' }}>
              <RoutePanel
                originLabel={myLocation.address}
                routePriority={routePriority}
                onStartNavigation={() => setNavigationActive(true)}
              />
            </div>
            {menu === 'route' && navigationActive && (
              <NavigationPanel onEnd={() => setNavigationActive(false)} />
            )}
            {menu === 'help' && <HelpPanel onOpenLogin={() => setLoginOpen(true)} />}
            {menu === 'map' && (
              <FacilityPanel layers={layers} layerStatus={layerStatus} onToggle={toggleLayer} />
            )}
            {menu === 'settings' && (
              <SettingsPanel
                routePriority={routePriority}
                onRoutePriorityChange={setRoutePriority}
                theme={theme}
                onThemeChange={setTheme}
                onOpenLogin={() => setLoginOpen(true)}
              />
            )}
          </>
        )}
      </section>

      {/* 오른쪽 지도 영역 */}
      <main className="mapArea">
        {!isMobile && (
          <button
            className="panelToggle"
            onClick={() => setPanelCollapsed((v) => !v)}
            aria-label={collapsed ? '정보 패널 펼치기' : '정보 패널 접기'}
            aria-expanded={!collapsed}
            title={collapsed ? '패널 펼치기' : '패널 접기'}
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        )}
        {/* SOS 페이지가 자기 지도(id="map")를 띄우므로 그동안은 메인 지도를 내린다 */}
        {!fullPageOpen && (
          <MapView
            layers={layers}
            location={myLocation}
            liveFriends={liveFriends}
            pickMode={mapPickerOpen}
            onCenterIdle={onCenterIdle}
            onLayerStatus={onLayerStatus}
          />
        )}
        {/* PC: 지도 오른쪽 아래 현재 위치 버튼 (모바일은 아래쪽 시트 기준으로 따로 배치) */}
        {!isMobile && !fullPageOpen && <MapControls desktop onLocate={myLocation.refresh} />}
      </main>

      {/* 모바일 전용: 지도 위 검색바+오버레이 칩+컨트롤 / 온보딩 / 경로 흐름 / SOS / 범죄레이어 / 설정 */}
      {isMobile && onboardingDone && mobileTab === 'map' && mobileScreen === null && (
        <>
          <MapSearchOverlay
            layers={layers}
            layerStatus={layerStatus}
            onToggleLayer={toggleLayer}
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
            setSelectedRouteId(routePriority);
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
            setSelectedRouteId(routePriority);
            setMobileScreen('result');
          }}
        />
      )}

      {isMobile && onboardingDone && mobileScreen === 'result' && (
        <RouteResultScreen
          destination={destination}
          originLabel={myLocation.address}
          routePriority={routePriority}
          onRoutePriorityChange={(p) => {
            setRoutePriority(p);
            setSelectedRouteId(p);
          }}
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
          routePriority={routePriority}
          onRoutePriorityChange={setRoutePriority}
          theme={theme}
          onThemeChange={setTheme}
          onOpenLogin={() => setLoginOpen(true)}
        />
      )}

      {isMobile && crimeLayerOpen && <CrimeLayerScreen />}

      {isMobile && onboardingDone && !sosOpen && <SosFab onOpen={() => setSosOpen(true)} />}
      {isMobile && sosOpen && <SosOverlay onClose={() => setSosOpen(false)} />}
    </div>
    {loginOpen && <LoginPage onBack={() => setLoginOpen(false)} />}
    {desktopSosOpen && <SosPage onCancel={() => setDesktopSosOpen(false)} location={myLocation} />}
    </>
  );
}

export default App;
