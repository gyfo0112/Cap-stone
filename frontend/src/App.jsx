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
  CircleCheck,
  TriangleAlert,
  Settings,
  UserPlus,
} from 'lucide-react';
import './App.css';
import logo from './images/logo.png';
import LoginPage from './LoginPage';
import SosPage from './SosPage';
import { MapView } from './KakaoMapView';
import { hasKakaoRestKey, searchPlaces } from './kakaoLocal';
import { getContacts, addContact, removeContact } from './contacts';
import { useIsMobile, scoreGrade } from './useIsMobile';
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
import { ROUTE_OPTIONS, SEGMENTS, GRADE_COLOR, GRADE_SOFT } from './routeData';

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

  // 데스크탑 사이드바의 로그인/도움요청하기 버튼 — 전체 화면을 덮는 별도 페이지로 전환.
  // 모바일에서는 sidebarBottom 자체가 숨겨져 있어 두 state 모두 쓰이지 않는다.
  const [loginOpen, setLoginOpen] = useState(false);
  const [desktopSosOpen, setDesktopSosOpen] = useState(false);

  if (loginOpen) {
    return <LoginPage onBack={() => setLoginOpen(false)} />;
  }
  if (desktopSosOpen) {
    return <SosPage onCancel={() => setDesktopSosOpen(false)} location={myLocation} />;
  }

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

              <button
                className={menu === 'settings' ? 'menuItem active' : 'menuItem'}
                onClick={() => setMenu('settings')}
              >
                <Settings size={22} />
                <span>설정</span>
              </button>
            </nav>
          )}
        </div>

        <div className="sidebarBottom">
          <button className="emergencyButton" onClick={() => setDesktopSosOpen(true)}>
            <Siren size={21} />
            도움요청하기
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
              <MainMapCard onOpenInput={openRouteInput} locationLabel={myLocation.address} />
            )}
            {mobileTab === 'help' && <HelpPanel />}
          </>
        ) : (
          <>
            {menu === 'route' && <RoutePanel originLabel={myLocation.address} />}
            {menu === 'help' && <HelpPanel />}
            {menu === 'facility' && <FacilityPanel layers={layers} onToggle={toggleLayer} />}
            {menu === 'settings' && (
              <SettingsPanel
                safetyWeight={safetyWeight}
                onSafetyWeightChange={setSafetyWeight}
                theme={theme}
                onThemeChange={setTheme}
              />
            )}
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

// 데스크탑의 3개 "경로 옵션" 버튼은 모바일처럼 슬라이더가 아니라 프리셋 버튼이라,
// 안전/빠른/도보 각각을 mock 대안 경로 3개(safe/shortest/balanced) 중 하나에 매핑한다.
// "도보 전용"은 셋 다 도보 경로라 딱 맞는 대응이 없어 균형 경로로 눌러뒀다.
const ROUTE_MODES = [
  { id: 'safe', icon: ShieldCheck, label: '안전 우선', desc: 'CCTV, 가로등 고려' },
  { id: 'shortest', icon: Clock3, label: '빠른 길', desc: '최단 시간 경로' },
  { id: 'balanced', icon: PersonStanding, label: '도보 전용', desc: '걸어가는 경로' },
];

function RoutePanel({ originLabel }) {
  const [origin, setOrigin] = useState(originLabel || '현재 위치');
  const [destination, setDestination] = useState('');
  const [places, setPlaces] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedMode, setSelectedMode] = useState('safe');
  const [selectedRouteId, setSelectedRouteId] = useState('safe');
  const [resultsReady, setResultsReady] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [notice, setNotice] = useState('');

  const query = destination.trim();
  const canSearch = hasKakaoRestKey();

  // 실제 카카오 장소 검색 (모바일 경로설정 화면과 동일한 방식)
  useEffect(() => {
    if (!query || !canSearch) return undefined;
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
  }, [query, canSearch]);

  const pickPlace = (name) => {
    setDestination(name);
    setPlaces([]);
  };

  const swap = () => {
    setOrigin(destination);
    setDestination(origin);
    setPlaces([]);
  };

  const runSearch = () => {
    if (!query) {
      setNotice('도착지를 입력해주세요.');
      return;
    }
    setNotice('');
    setSelectedRouteId(selectedMode);
    setResultsReady(true);
    setShowDetail(false);
  };

  const selectedRoute = ROUTE_OPTIONS.find((r) => r.id === selectedRouteId) ?? ROUTE_OPTIONS[0];
  const grade = scoreGrade(selectedRoute.score);

  return (
    <div className="panelContent">
      <h1>안전 귀갓길 찾기</h1>

      <p className="subtitle">더 안전한 길, 함께 만들어가는 우리 동네</p>

      <div className="locationBox">
        <div className="locationInput">
          <span className="dot blue"></span>
          <input
            placeholder="출발지 입력"
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
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

      {query && canSearch && (
        <div className="searchSuggestions">
          {searching && <div className="searchSuggestionEmpty">검색 중…</div>}
          {!searching && places.length === 0 && (
            <div className="searchSuggestionEmpty">검색 결과가 없습니다</div>
          )}
          {!searching &&
            places.map((p) => (
              <button key={p.id} className="searchSuggestionItem" onClick={() => pickPlace(p.name)}>
                <strong>{p.name}</strong>
                <span>{p.address}</span>
              </button>
            ))}
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

      <button className="searchRouteButton" onClick={runSearch}>
        <Search size={22} />
        경로 검색하기
      </button>
      {notice && <p className="routeNotice">{notice}</p>}

      {resultsReady && (
        <div className="routeResultCard">
          <div className="routeResultHeader">
            <div className="mfScoreBadge mfScoreBadge--lg" style={{ background: grade.soft, color: grade.color }}>
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
                  <div className="mfScoreBadge mfScoreBadge--sm" style={{ background: g.soft, color: g.color }}>
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
                    style={{ color: GRADE_COLOR[s.grade], background: GRADE_SOFT[s.grade] }}
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
                        style={{ color: GRADE_COLOR[s.grade], background: GRADE_SOFT[s.grade] }}
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

const THEME_OPTIONS = [
  { key: 'light', label: '라이트' },
  { key: 'dark', label: '다크' },
  { key: 'system', label: '시스템' },
];

const NOTIF_ITEMS = [
  { key: 'zoneEntry', title: '위험 구간 진입 알림', desc: '주의구간 100m 이내 진입 시 진동' },
  { key: 'nightRecalc', title: '야간 경로 재계산 알림', desc: '일몰 후 저장 경로 안전도 변동 시' },
  { key: 'arrival', title: '보호자 도착 알림', desc: '목적지 도착 시 보호자에게 자동 전송' },
];

// 모바일 설정 화면과 내용은 같되, controlPanel 안에 들어가는 데스크탑 전용 레이아웃.
// 보호자 연락처는 모바일과 완전히 같은 저장소(contacts.js/localStorage)를 그대로 쓴다.
function SettingsPanel({ safetyWeight, onSafetyWeightChange, theme, onThemeChange }) {
  const [notif, setNotif] = useState({ zoneEntry: true, nightRecalc: true, arrival: false });
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
        <input
          type="range"
          min={0}
          max={100}
          value={safetyWeight}
          onChange={(e) => onSafetyWeightChange(Number(e.target.value))}
          className="safetyRange"
        />
        <div className="rangeLabels">
          <span>거리 최우선</span>
          <span>균형 (기본)</span>
          <span>안전 최우선</span>
        </div>
      </div>

      <div className="settingsCard">
        <h3>보호자 연락처</h3>

        <div className="guardianItem">
          <div className="guardianAvatar">엄마</div>
          <div className="guardianInfo">
            <strong>김서연</strong>
            <span>010-2841-XXXX</span>
          </div>
          <span className="guardianBadge">기본</span>
        </div>
        <div className="guardianDivider" />
        <div className="guardianItem">
          <div className="guardianAvatar">친구</div>
          <div className="guardianInfo">
            <strong>이지훈</strong>
            <span>010-7745-XXXX</span>
          </div>
          <span className="guardianBadge">보조</span>
        </div>

        {contacts.map((c) => (
          <div key={c.tel_uuid}>
            <div className="guardianDivider" />
            <div className="guardianItem">
              <div className="guardianAvatar">{c.tel_name[0]}</div>
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
        <div className="themeButtons">
          {THEME_OPTIONS.map((t) => (
            <button
              key={t.key}
              className={theme === t.key ? 'themeButton selected' : 'themeButton'}
              onClick={() => onThemeChange(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>
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
