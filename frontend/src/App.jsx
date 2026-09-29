import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
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
  CircleCheck,
  TriangleAlert,
  Settings,
  UserPlus,
  Route,
  Users,
  ArrowUp,
  ChevronLeft,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import './App.css';
import logo from './images/logo.png';
import LoginPage from './LoginPage';
import SosPage from './SosPage';
import { MapView } from './KakaoMapView';
import { LAYER_STATUS_TEXT } from './markersApi';
import { hasKakaoRestKey, searchPlaces } from './kakaoLocal';
import { getContacts, addContact, removeContact } from './contacts';
import { getRecents, addRecent, removeRecent, clearRecents } from './recents';
import {
  MY_USER_UUID,
  POST_TYPES,
  getPosts,
  addPost,
  removePost,
  getAcceptedIds,
  acceptPost,
  cancelAccept,
  timeAgo,
} from './posts';
import { useIsMobile, scoreGrade } from './useIsMobile';
import { useCurrentLocation } from './useCurrentLocation';
import { useTheme } from './useTheme';
import { useStoredState } from './useStoredState';
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
  ToggleGroup,
  SosFab,
  SosOverlay,
} from './MobileFlow';
import {
  ROUTE_OPTIONS,
  PRIORITY_OPTIONS,
  THEME_OPTIONS,
  QUICK_PLACES,
  SEGMENTS,
  GRADE_COLOR,
  GRADE_SOFT,
} from './routeData';

// 데스크탑 왼쪽 메뉴 — MobileTabBar의 TABS 배열과 같은 방식으로, 여기 하나만
// 고치면 메뉴 추가/순서 변경이 되게 데이터로 관리한다.
// frontend-junwoo 브랜치와 이름·순서를 맞춤: 지도(공공시설 확인 내용) / 경로 / 도움요청 / 설정.
const DESKTOP_MENU = [
  { key: 'map', icon: MapPin, label: '지도' },
  { key: 'route', icon: Route, label: '경로' },
  { key: 'help', icon: Bell, label: '도움요청' },
  { key: 'settings', icon: Settings, label: '설정' },
];

function App() {
  const [theme, setTheme] = useTheme();
  const [menu, setMenu] = useState('map');
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

  return (
    <>
    <div className="app" style={fullPageOpen ? { display: 'none' } : undefined}>
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
              {DESKTOP_MENU.map((m) => (
                <button
                  key={m.key}
                  className={menu === m.key ? 'menuItem active' : 'menuItem'}
                  onClick={() => selectDesktopMenu(m.key)}
                >
                  <m.icon size={22} />
                  <span>{m.label}</span>
                </button>
              ))}
            </nav>
          )}
        </div>

        <div className="sidebarBottom">
          <button className="emergencyButton" onClick={() => setDesktopSosOpen(true)}>
            <Siren size={21} />
            도움 요청하기
          </button>

          <button className="loginButton" onClick={() => setLoginOpen(true)}>
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
              <MainMapCard
                onOpenInput={openRouteInput}
                locationLabel={myLocation.address || (myLocation.status === 'loading' ? '위치 확인 중' : '')}
                lat={myLocation.lat}
                lng={myLocation.lng}
              />
            )}
            {mobileTab === 'help' && <HelpPanel />}
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
            {menu === 'help' && <HelpPanel />}
            {menu === 'map' && (
              <FacilityPanel layers={layers} layerStatus={layerStatus} onToggle={toggleLayer} />
            )}
            {menu === 'settings' && (
              <SettingsPanel
                routePriority={routePriority}
                onRoutePriorityChange={setRoutePriority}
                theme={theme}
                onThemeChange={setTheme}
              />
            )}
          </>
        )}
      </section>

      {/* 오른쪽 지도 영역 */}
      <main className="mapArea">
        {/* SOS 페이지가 자기 지도(id="map")를 띄우므로 그동안은 메인 지도를 내린다 */}
        {!fullPageOpen && (
          <MapView
            layers={layers}
            location={isMobile ? myLocation : null}
            pickMode={mapPickerOpen}
            onCenterIdle={onCenterIdle}
            onLayerStatus={onLayerStatus}
          />
        )}
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

// 데스크탑의 3개 "경로 옵션" 버튼을 mock 대안 경로 2개(safe/shortest) 중 하나에 매핑한다.
// "도보 전용"은 두 경로 모두 도보라 딱 맞는 대응이 없어 안전 우선 경로로 눌러뒀다.
const ROUTE_MODES = [
  { id: 'safe', route: 'safe', icon: ShieldCheck, label: '안전 우선', desc: 'CCTV, 가로등 고려' },
  { id: 'shortest', route: 'shortest', icon: Clock3, label: '빠른 길', desc: '최단 시간 경로' },
  { id: 'walk', route: 'safe', icon: PersonStanding, label: '도보 전용', desc: '걸어가는 경로' },
];

function RoutePanel({ originLabel, routePriority, onStartNavigation }) {
  const [origin, setOrigin] = useState(originLabel || '현재 위치');
  // 이 패널이 항상 마운트돼 있어서(탭 전환에도 검색상태 유지) 첫 렌더 시점엔
  // GPS 주소가 아직 안 왔을 수 있다 — 사용자가 직접 수정하기 전까지는 계속 따라간다.
  const originTouched = useRef(false);
  useEffect(() => {
    if (!originTouched.current && originLabel) setOrigin(originLabel);
  }, [originLabel]);
  const [destination, setDestination] = useState('');
  const [places, setPlaces] = useState([]);
  const [searching, setSearching] = useState(false);
  // 경로 옵션 기본값 = 설정의 기본 안전 우선도(ROUTE_MODES id가 우선도 key와 같음).
  // 패널이 항상 마운트돼 있으니 설정에서 바꾸면 그 값으로 다시 맞춘다.
  const [selectedMode, setSelectedMode] = useState(routePriority);
  const [prevPriority, setPrevPriority] = useState(routePriority);
  if (prevPriority !== routePriority) {
    setPrevPriority(routePriority);
    setSelectedMode(routePriority);
  }
  const [selectedRouteId, setSelectedRouteId] = useState(routePriority);
  const [resultsReady, setResultsReady] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [notice, setNotice] = useState('');
  // 최근 검색 — 모바일 경로설정 화면과 같은 저장소(recents.js)라 PC·모바일 기록이 공유된다
  const [recents, setRecents] = useState(getRecents);
  // 추천 목록에서 고른 장소 — 고른 뒤엔 목록을 다시 띄우지 않고, 최근 검색에 주소를 같이 남긴다
  const [pickedPlace, setPickedPlace] = useState(null);

  const query = destination.trim();
  const canSearch = hasKakaoRestKey();
  const showSuggestions = query && canSearch && pickedPlace?.name !== query;

  // 실제 카카오 장소 검색 (모바일 경로설정 화면과 동일한 방식)
  useEffect(() => {
    if (!showSuggestions) return undefined;
    let cancelled = false;
    const timer = setTimeout(() => {
      setSearching(true);
      searchPlaces(query)
        .then((r) => !cancelled && setPlaces(r))
        .catch(() => !cancelled && setPlaces([]))
        .finally(() => !cancelled && setSearching(false));
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, showSuggestions]);

  const pickPlace = (place) => {
    setDestination(place.name);
    setPickedPlace(place);
    setPlaces([]);
  };

  const swap = () => {
    originTouched.current = true;
    setOrigin(destination);
    setDestination(origin);
    setPlaces([]);
  };

  const runSearch = (name = query) => {
    if (!name) {
      setNotice('도착지를 입력해주세요.');
      return;
    }
    setNotice('');
    setRecents(addRecent({ name, sub: pickedPlace?.name === name ? pickedPlace.address : '' }));
    setSelectedRouteId(ROUTE_MODES.find((m) => m.id === selectedMode).route);
    setResultsReady(true);
    setShowDetail(false);
  };

  // 최근 검색을 누르면 도착지에 넣고 바로 경로 검색
  const searchRecent = (r) => {
    setDestination(r.name);
    setPickedPlace({ name: r.name, address: r.sub });
    runSearch(r.name);
  };

  const selectedRoute = ROUTE_OPTIONS.find((r) => r.id === selectedRouteId) ?? ROUTE_OPTIONS[0];
  const grade = scoreGrade(selectedRoute.score);

  return (
    <div className="panelContent">
      <h1>경로 설정</h1>

      <p className="subtitle">더 안전한 길, 함께 만들어가는 우리 동네</p>

      <div className="locationBox">
        <div className="locationInput">
          <span className="dot blue"></span>
          <input
            placeholder="출발지 입력"
            value={origin}
            onChange={(e) => {
              originTouched.current = true;
              setOrigin(e.target.value);
            }}
          />
        </div>

        <div className="divider"></div>

        <div className="locationInput">
          <span className="dot red"></span>
          <input
            placeholder="도착지 입력"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && runSearch()}
          />
        </div>

        <button className="swap" onClick={swap} aria-label="출발지/도착지 바꾸기">
          <ArrowUpDown size={18} />
        </button>
      </div>

      {/* 집/회사 바로가기 — 모바일 홈 카드와 같은 장소(routeData.js QUICK_PLACES), 누르면 바로 검색 */}
      <div className="mfQuickRow routeQuickRow">
        {QUICK_PLACES.map((q) => (
          <button key={q.key} className="mfQuickBtn" onClick={() => searchRecent({ name: q.name, sub: '' })}>
            <q.icon size={16} /> {q.label}
          </button>
        ))}
      </div>

      {showSuggestions && (
        <div className="searchSuggestions">
          {searching && <div className="searchSuggestionEmpty">검색 중…</div>}
          {!searching && places.length === 0 && (
            <div className="searchSuggestionEmpty">검색 결과가 없습니다</div>
          )}
          {!searching &&
            places.map((p) => (
              <button key={p.id} className="searchSuggestionItem" onClick={() => pickPlace(p)}>
                <strong>{p.name}</strong>
                <span>{p.address}</span>
              </button>
            ))}
        </div>
      )}

      {!query && (
        <div className="recentSearches">
          <div className="recentSearchesHeader">
            <h3 className="sectionTitle">최근 검색</h3>
            {recents.length > 0 && (
              <button className="recentClearAll" onClick={() => setRecents(clearRecents())}>
                전체 삭제
              </button>
            )}
          </div>
          {recents.length === 0 ? (
            <p className="searchSuggestionEmpty">최근 검색한 장소가 없어요.</p>
          ) : (
            <div className="searchSuggestions">
              {recents.map((r) => (
                <div className="recentRow" key={r.name}>
                  <button className="searchSuggestionItem" onClick={() => searchRecent(r)}>
                    <strong>{r.name}</strong>
                    {r.sub && <span>{r.sub}</span>}
                  </button>
                  <button
                    className="recentRemove"
                    onClick={() => setRecents(removeRecent(r.name))}
                    aria-label={`${r.name} 최근 검색 삭제`}
                  >
                    <X size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <h3 className="sectionTitle">경로 옵션</h3>

      <div className="routeOptions">
        {ROUTE_MODES.map((m) => (
          <button
            key={m.id}
            className={selectedMode === m.id ? 'routeOption activeOption' : 'routeOption'}
            onClick={() => setSelectedMode(m.id)}
          >
            <m.icon size={29} />
            <strong>{m.label}</strong>
            <small>{m.desc}</small>
          </button>
        ))}
      </div>

      <button className="searchRouteButton" onClick={() => runSearch()}>
        <Search size={22} />
        경로 검색하기
      </button>
      {notice && <p className="routeNotice">{notice}</p>}

      {resultsReady && (
        <div className="routeResultCard">
          <div className="routeResultHeader">
            <div className="mfScoreBadge mfScoreBadge--lg" style={{ '--tone': grade.color, '--tone-soft': grade.soft }}>
              <strong>{selectedRoute.score}</strong>
              <span>{grade.label}</span>
            </div>
            <div>
              <strong>
                {selectedRoute.distance}km · 도보 {selectedRoute.duration}분
              </strong>
              <p>{selectedRoute.note}</p>
            </div>
          </div>

          <div className="mfRouteList">
            {ROUTE_OPTIONS.map((r) => {
              const g = scoreGrade(r.score);
              return (
                <button
                  key={r.id}
                  className={r.id === selectedRouteId ? 'mfRouteOption selected' : 'mfRouteOption'}
                  onClick={() => setSelectedRouteId(r.id)}
                >
                  <div className="mfScoreBadge mfScoreBadge--sm" style={{ '--tone': g.color, '--tone-soft': g.soft }}>
                    <strong>{r.score}</strong>
                  </div>
                  <div>
                    <strong>{r.name}</strong>
                    <span>{r.note}</span>
                  </div>
                  <div className="mfRouteMeta">
                    <strong>{r.duration}분</strong>
                    <span>{r.distance}km</span>
                  </div>
                </button>
              );
            })}
          </div>

          <button className="mfOutlineBtn routeDetailToggle" onClick={() => setShowDetail((v) => !v)}>
            {showDetail ? '구간별 정보 접기' : '구간별 안전 요인 보기'}
          </button>

          {showDetail && (
            <div className="mfSegmentList">
              {SEGMENTS.map((s) => (
                <div className="mfSegmentRow" key={s.name}>
                  <span className="mfSegmentBar" style={{ background: GRADE_COLOR[s.grade] }} />
                  <div
                    className="mfSegmentIcon"
                    style={{ '--tone': GRADE_COLOR[s.grade], '--tone-soft': GRADE_SOFT[s.grade] }}
                  >
                    {s.grade === '안전' ? <CircleCheck size={16} /> : <TriangleAlert size={16} />}
                  </div>
                  <div className="mfSegmentBody">
                    <div className="mfSegmentTitleRow">
                      <strong>
                        {s.name} · {s.meters}m
                      </strong>
                      <span
                        className="mfSegmentGradeTag"
                        style={{ '--tone': GRADE_COLOR[s.grade], '--tone-soft': GRADE_SOFT[s.grade] }}
                      >
                        {s.grade}
                      </span>
                    </div>
                    <p>{s.note}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <button className="mfPrimaryBtn startNavigationButton" onClick={onStartNavigation}>
            안내 시작
          </button>
        </div>
      )}

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

// 데스크탑 길 안내 화면 — frontend-junwoo의 NavigationPage와 같은 구성(턴 배너 +
// 구간별 안전요인 + 안내종료/보호자공유). 모바일 RouteDetailScreen과 같은
// mock SEGMENTS를 쓰고, mf* 클래스를 그대로 재사용해 별도 CSS 없이 붙였다.
function NavigationPanel({ onEnd }) {
  const [sharing, setSharing] = useState(false);

  return (
    <div className="panelContent">
      <div className="mfTurnBanner">
        <ArrowUp size={26} />
        <div>
          <strong>250m 직진</strong>
          <span>어울마당로 · 다음 좌회전까지</span>
        </div>
      </div>

      <h3 className="sectionTitle" style={{ marginTop: 20 }}>
        구간별 안전 요인 · 총 {SEGMENTS.length}구간 · 1.8km
      </h3>

      <div className="mfSegmentList">
        {SEGMENTS.map((s) => (
          <div className="mfSegmentRow" key={s.name}>
            <span className="mfSegmentBar" style={{ background: GRADE_COLOR[s.grade] }} />
            <div className="mfSegmentIcon" style={{ '--tone': GRADE_COLOR[s.grade], '--tone-soft': GRADE_SOFT[s.grade] }}>
              {s.grade === '안전' ? <CircleCheck size={16} /> : <TriangleAlert size={16} />}
            </div>
            <div className="mfSegmentBody">
              <div className="mfSegmentTitleRow">
                <strong>
                  {s.name} · {s.meters}m
                </strong>
                <span className="mfSegmentGradeTag" style={{ '--tone': GRADE_COLOR[s.grade], '--tone-soft': GRADE_SOFT[s.grade] }}>
                  {s.grade}
                </span>
              </div>
              <p>{s.note}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mfDetailActions">
        <button className="mfOutlineBtn mfFlex1" onClick={onEnd}>
          안내 종료
        </button>
        <button className="mfShareBtn mfFlex1_4" onClick={() => setSharing((v) => !v)}>
          <Users size={16} /> {sharing ? '공유 예시' : '보호자 공유'}
        </button>
      </div>
    </div>
  );
}

// 긴급도(post_type)별 카드 테두리/배지 색 — 기존 클래스 재사용
const POST_TYPE_STYLE = {
  일반: { border: 'yellowBorder', badge: 'yellowBadge' },
  주의: { border: 'orangeBorder', badge: 'orangeBadge' },
  긴급: { border: 'redBorder', badge: 'redBadge' },
};

// 모바일(도움요청 탭)과 데스크탑(도움요청 메뉴)이 함께 쓰는 패널.
// 목록 → 글쓰기 화면 / 게시글 상세(수락·삭제) 모달.
function HelpPanel() {
  const [posts, setPosts] = useState(getPosts);
  const [acceptedIds, setAcceptedIds] = useState(getAcceptedIds);
  const [filter, setFilter] = useState('all'); // 'all' | 'mine'
  const [writing, setWriting] = useState(false);
  const [openId, setOpenId] = useState(null);

  const isMine = (p) => p.user_uuid === MY_USER_UUID;
  const visible = filter === 'mine' ? posts.filter(isMine) : posts;
  const openPost = posts.find((p) => p.post_uuid === openId);

  const deletePost = (p) => {
    if (!window.confirm(`'${p.post_title}' 글을 삭제할까요?`)) return;
    setPosts(removePost(p.post_uuid));
    setAcceptedIds(getAcceptedIds());
    setOpenId(null);
  };

  if (writing) {
    return (
      <HelpWriteForm
        onCancel={() => setWriting(false)}
        onSubmit={(post) => {
          setPosts(addPost(post));
          setFilter('all');
          setWriting(false);
        }}
      />
    );
  }

  return (
    <div className="panelContent">
      <h1>도움요청</h1>

      <p className="subtitle">주변에서 요청한 도움을 확인할 수 있습니다.</p>

      <button className="searchRouteButton helpWriteButton" onClick={() => setWriting(true)}>
        <Plus size={20} />
        도움 요청 글쓰기
      </button>

      <div className="themeButtons helpTabs">
        <button
          className={filter === 'all' ? 'themeButton selected' : 'themeButton'}
          onClick={() => setFilter('all')}
        >
          전체
        </button>
        <button
          className={filter === 'mine' ? 'themeButton selected' : 'themeButton'}
          onClick={() => setFilter('mine')}
        >
          내가 쓴 글
        </button>
      </div>

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

      {visible.length === 0 && (
        <p className="settingsDescription">
          {filter === 'mine' ? '아직 작성한 도움 요청이 없어요.' : '주변에 올라온 도움 요청이 없어요.'}
        </p>
      )}

      {visible.map((p) => {
        const style = POST_TYPE_STYLE[p.post_type] ?? POST_TYPE_STYLE.일반;
        const mine = isMine(p);
        return (
          <div key={p.post_uuid} className={`requestCard ${style.border}`}>
            <button className="requestCardMain" onClick={() => setOpenId(p.post_uuid)}>
              <div className="requestHeader">
                <strong>{p.post_title}</strong>
                <span className={style.badge}>{p.post_type}</span>
              </div>
              <p>{p.body}</p>
              <div className="requestInfo">
                {mine ? '내가 쓴 글' : `약 ${p.distance ?? '-'}km`} · {timeAgo(p.created_at)}
                {acceptedIds.includes(p.post_uuid) && <em className="requestAccepted"> · 수락함</em>}
              </div>
            </button>
            {mine && (
              <button className="requestDelete" onClick={() => deletePost(p)}>
                <Trash2 size={14} />
                삭제
              </button>
            )}
          </div>
        );
      })}

      {openPost && (
        <HelpPostModal
          post={openPost}
          mine={isMine(openPost)}
          accepted={acceptedIds.includes(openPost.post_uuid)}
          onAccept={() => setAcceptedIds(acceptPost(openPost.post_uuid))}
          onCancelAccept={() => setAcceptedIds(cancelAccept(openPost.post_uuid))}
          onDelete={() => deletePost(openPost)}
          onClose={() => setOpenId(null)}
        />
      )}
    </div>
  );
}

// 요청 게시글 상세 — 남의 글이면 수락, 내 글이면 삭제
function HelpPostModal({ post, mine, accepted, onAccept, onCancelAccept, onDelete, onClose }) {
  const style = POST_TYPE_STYLE[post.post_type] ?? POST_TYPE_STYLE.일반;
  // controlPanel이 자체 z-index 층을 만들어서, body로 빼야 지도까지 어둡게 덮인다
  return createPortal(
    <div className="helpModalScrim" onClick={onClose}>
      <div
        className="helpModal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="helpModalTitle"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="requestHeader">
          <strong id="helpModalTitle">{post.post_title}</strong>
          <span className={style.badge}>{post.post_type}</span>
        </div>
        <p className="helpModalBody">{post.body}</p>
        <div className="requestInfo">
          {mine ? '내가 쓴 글' : `약 ${post.distance ?? '-'}km`} · {timeAgo(post.created_at)}
        </div>

        {accepted && (
          <p className="helpModalNotice">
            <CircleCheck size={16} /> 수락한 요청이에요.
          </p>
        )}

        <div className="helpModalActions">
          <button className="mfOutlineBtn" onClick={onClose}>
            닫기
          </button>
          {mine ? (
            <button className="mfPrimaryBtn helpModalDanger" onClick={onDelete}>
              삭제하기
            </button>
          ) : accepted ? (
            <button className="mfOutlineBtn" onClick={onCancelAccept}>
              수락 취소
            </button>
          ) : (
            <button className="mfPrimaryBtn" onClick={onAccept}>
              수락하기
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}

function HelpWriteForm({ onCancel, onSubmit }) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState('일반');
  const [body, setBody] = useState('');
  const [error, setError] = useState('');

  const submit = () => {
    if (!title.trim()) return setError('제목을 입력해주세요.');
    if (!body.trim()) return setError('위치와 상황을 입력해주세요.');
    onSubmit({ post_title: title.trim(), post_type: type, body: body.trim() });
  };

  return (
    <div className="panelContent">
      <button className="login-back" onClick={onCancel}>
        <ChevronLeft size={20} />
        목록으로
      </button>

      <h1>도움 요청 글쓰기</h1>
      <p className="subtitle">주변 이웃에게 필요한 도움을 알려주세요.</p>

      <div className="helpForm">
        <label className="helpField">
          <span>제목</span>
          <input
            className="mfAddContactInput"
            placeholder="귀갓길 동행이 필요해요"
            maxLength={50}
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setError('');
            }}
          />
        </label>

        <div className="helpField">
          <span>긴급도</span>
          <div className="themeButtons">
            {POST_TYPES.map((t) => (
              <button
                key={t}
                className={type === t ? 'themeButton selected' : 'themeButton'}
                onClick={() => setType(t)}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <label className="helpField">
          <span>위치 · 상황</span>
          <textarea
            className="mfAddContactInput helpTextarea"
            placeholder="성수역 2번 출구 근처, 골목이 어두워서 함께 걸어갈 분을 찾아요"
            value={body}
            onChange={(e) => {
              setBody(e.target.value);
              setError('');
            }}
          />
        </label>

        {error && <p className="helpFormError">{error}</p>}

        <button className="searchRouteButton" onClick={submit}>
          요청 올리기
        </button>
      </div>
    </div>
  );
}

// 지도에 켜고 끌 수 있는 안전시설 — key는 markersApi.js MARKER_LAYERS와 같다
const FACILITY_BUTTONS = [
  { key: 'cctv', icon: Camera, title: 'CCTV 위치' },
  { key: 'streetlight', icon: Lightbulb, title: '가로등(보안등) 위치' },
  { key: 'safeHouse', icon: ShieldCheck, title: '여성안심지킴이집' },
  { key: 'safetyBell', icon: Siren, title: '안심벨(비상벨) 위치' },
];

function FacilityPanel({ layers, layerStatus, onToggle }) {
  return (
    <div className="panelContent">
      <h1>지도</h1>

      <p className="subtitle">주변의 안전시설과 위험구간을 확인하세요.</p>

      {FACILITY_BUTTONS.map((f) => {
        const on = layers[f.key];
        return (
          <button
            key={f.key}
            className={on ? 'facilityButton active' : 'facilityButton'}
            onClick={() => onToggle(f.key)}
          >
            <f.icon />

            <div>
              <strong>{f.title}</strong>
              <span>
                {on ? LAYER_STATUS_TEXT[layerStatus[f.key]] ?? '불러오는 중…' : '지도에 표시'}
              </span>
            </div>
          </button>
        );
      })}

      <button className="facilityButton" disabled>
        <TriangleAlert />

        <div>
          <strong>범죄주의구간</strong>
          <span>준비 중</span>
        </div>
      </button>
    </div>
  );
}


const NOTIF_ITEMS = [
  { key: 'zoneEntry', title: '위험 구간 진입 알림', desc: '주의구간 100m 이내 진입 시 진동' },
  { key: 'nightRecalc', title: '야간 경로 재계산 알림', desc: '일몰 후 저장 경로 안전도 변동 시' },
  { key: 'arrival', title: '보호자 도착 알림', desc: '목적지 도착 시 보호자에게 자동 전송' },
];

// 모바일 설정 화면과 내용은 같되, controlPanel 안에 들어가는 데스크탑 전용 레이아웃.
// 보호자 연락처는 모바일과 완전히 같은 저장소(contacts.js/localStorage)를 그대로 쓴다.
function SettingsPanel({ routePriority, onRoutePriorityChange, theme, onThemeChange }) {
  const [notif, setNotif] = useStoredState('mf-notif', { zoneEntry: true, nightRecalc: true, arrival: false });
  const [contacts, setContacts] = useState(getContacts);
  const [addingContact, setAddingContact] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newType, setNewType] = useState('보조');

  const toggleNotif = (key) => setNotif((n) => ({ ...n, [key]: !n[key] }));

  const submitContact = () => {
    const tel_name = newName.trim();
    const tel_num = newPhone.trim();
    if (!tel_name || !tel_num) return;
    setContacts(addContact({ tel_name, tel_num, tel_type: newType }));
    setNewName('');
    setNewPhone('');
    setNewType('보조');
    setAddingContact(false);
  };

  return (
    <div className="panelContent">
      <h1>설정</h1>

      <p className="subtitle">친절한 이웃의 설정을 변경할 수 있습니다.</p>

      <div className="settingsCard">
        <h3>기본 안전 우선도</h3>
        <p className="settingsDescription">모든 경로 계산의 기본값으로 사용됩니다.</p>
        <ToggleGroup options={PRIORITY_OPTIONS} value={routePriority} onChange={onRoutePriorityChange} label="기본 안전 우선도" />
      </div>

      <div className="settingsCard">
        <h3>보호자 연락처</h3>

        {contacts.length === 0 && <p className="settingsDescription">등록된 보호자가 없어요.</p>}
        {contacts.map((c, i) => (
          <div key={c.tel_uuid}>
            {i > 0 && <div className="guardianDivider" />}
            <div className="guardianItem">
              <div className="guardianAvatar">{c.relation || c.tel_name[0]}</div>
              <div className="guardianInfo">
                <strong>{c.tel_name}</strong>
                <span>{c.tel_num}</span>
              </div>
              <span className="guardianBadge">{c.tel_type}</span>
              <button
                className="guardianRemoveButton"
                onClick={() => setContacts(removeContact(c.tel_uuid))}
                aria-label={`${c.tel_name} 연락처 삭제`}
              >
                ×
              </button>
            </div>
          </div>
        ))}

        {addingContact ? (
          <div className="addContactForm">
            <input
              className="addContactInput"
              placeholder="이름"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <input
              className="addContactInput"
              placeholder="전화번호"
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submitContact()}
            />
            <div className="themeButtons">
              {['기본', '보조'].map((t) => (
                <button
                  key={t}
                  className={newType === t ? 'themeButton selected' : 'themeButton'}
                  onClick={() => setNewType(t)}
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="addContactActions">
              <button className="addContactCancel" onClick={() => setAddingContact(false)}>
                취소
              </button>
              <button
                className="addContactSubmit"
                disabled={!newName.trim() || !newPhone.trim()}
                onClick={submitContact}
              >
                추가
              </button>
            </div>
          </div>
        ) : (
          <button className="addGuardianButton" onClick={() => setAddingContact(true)}>
            <UserPlus size={18} />
            연락처 추가
          </button>
        )}
      </div>

      <div className="settingsCard">
        <h3>테마</h3>
        <ToggleGroup options={THEME_OPTIONS} value={theme} onChange={onThemeChange} label="테마" />
      </div>

      <div className="settingsCard">
        <h3>알림</h3>
        {NOTIF_ITEMS.map((n) => (
          <div className="settingToggleRow" key={n.key}>
            <div>
              <strong>{n.title}</strong>
              <span>{n.desc}</span>
            </div>
            <button
              role="switch"
              aria-checked={notif[n.key]}
              aria-label={n.title}
              className={notif[n.key] ? 'toggleSwitch on' : 'toggleSwitch'}
              onClick={() => toggleNotif(n.key)}
            >
              <span />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
