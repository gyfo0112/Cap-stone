import { useState } from 'react';

import {
  MapPin,
  Bell,
  ShieldCheck,
  UserRound,
  Search,
  Camera,
  Lightbulb,
  Siren,
  Settings,
  UserPlus,
  Route,
  TriangleAlert,
} from 'lucide-react';

import './App.css';
import './NavigationPage.css';

import logo from './images/logo.png';

import SosPage from './SosPage';
import LoginPage from './LoginPage';
import RoutePage from './RoutePage';
import NavigationPage from './NavigationPage';

function App() {
  // 처음 실행하면 지도 메뉴 선택
  const [menu, setMenu] = useState('map');

  const [showSOS, setShowSOS] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  // 길 안내 진행 여부
  const [navigationActive, setNavigationActive] = useState(false);

  // 메뉴 변경 시 안내창 닫기
  const handleMenuChange = (nextMenu) => {
    if (nextMenu !== 'route') {
      setNavigationActive(false);
    }

    setMenu(nextMenu);
  };

  // 안내 시작
  const handleStartNavigation = () => {
    setMenu('route');
    setNavigationActive(true);
  };

  // 안내 종료
  const handleEndNavigation = () => {
    setNavigationActive(false);
  };

  // SOS 화면 열기
  const handleOpenSOS = () => {
    setNavigationActive(false);
    setShowSOS(true);
  };

  // 로그인 화면 열기
  const handleOpenLogin = () => {
    setNavigationActive(false);
    setShowLogin(true);
  };

  return (
    <>
      {/*
        SOS나 로그인 화면을 열어도 기존 화면을 삭제하지 않고 숨김.
        돌아왔을 때 경로 선택 상태를 유지하기 위한 구조.
      */}
      <div
        className="app"
        style={showSOS || showLogin ? { display: 'none' } : undefined}
      >
        {/* =========================
            왼쪽 메뉴
        ========================= */}

        <aside className="sidebar">
          <div>
            <div className="logo">
              <img src={logo} alt="친절한 이웃 로고" className="logoImage" />

              <div className="logoText">
                친절한 <span>이웃</span>
              </div>
            </div>

            <nav className="menu">
              <button
                type="button"
                className={menu === 'map' ? 'menuItem active' : 'menuItem'}
                onClick={() => handleMenuChange('map')}
              >
                <MapPin size={22} />
                <span>지도</span>
              </button>

              <button
                type="button"
                className={menu === 'route' ? 'menuItem active' : 'menuItem'}
                onClick={() => handleMenuChange('route')}
              >
                <Route size={22} />
                <span>경로</span>
              </button>

              <button
                type="button"
                className={menu === 'help' ? 'menuItem active' : 'menuItem'}
                onClick={() => handleMenuChange('help')}
              >
                <Bell size={22} />
                <span>도움요청</span>
              </button>

              <button
                type="button"
                className={menu === 'settings' ? 'menuItem active' : 'menuItem'}
                onClick={() => handleMenuChange('settings')}
              >
                <Settings size={22} />
                <span>설정</span>
              </button>
            </nav>
          </div>

          <div className="sidebarBottom">
            <button
              type="button"
              className="emergencyButton"
              onClick={handleOpenSOS}
            >
              <Siren size={21} />
              도움 요청하기
            </button>

            <button
              type="button"
              className="loginButton"
              onClick={handleOpenLogin}
            >
              <UserRound size={22} />
              로그인
            </button>
          </div>
        </aside>

        {/* =========================
            가운데 기능 패널
        ========================= */}

        <section className="controlPanel">
          {menu === 'map' && <MapPanel />}

          {/*
            RoutePage를 삭제하지 않고 숨겨서
            안내 종료 후 기존 결과 화면과 선택 상태 유지.
          */}
          <div
            style={{
              display: menu === 'route' && !navigationActive ? 'block' : 'none',
            }}
          >
            <RoutePage onStartNavigation={handleStartNavigation} />
          </div>

          {menu === 'route' && navigationActive && (
            <NavigationPage onEnd={handleEndNavigation} />
          )}

          {menu === 'help' && <HelpPanel />}

          {menu === 'settings' && <SettingsPanel />}
        </section>

        {/* =========================
            오른쪽 지도 영역
        ========================= */}

        <main className="mapArea">
          <div id="map" className="kakaoMap">
            <div className="mapPlaceholder">
              <MapPin size={42} />

              <strong>카카오맵 API 영역</strong>

              <span>나중에 실제 지도가 여기에 표시됩니다.</span>
            </div>
          </div>
        </main>
      </div>

      {/* =========================
          SOS / 로그인 화면
      ========================= */}

      {showSOS && <SosPage onCancel={() => setShowSOS(false)} />}

      {showLogin && <LoginPage onBack={() => setShowLogin(false)} />}
    </>
  );
}

/* =========================================================
   지도 패널
========================================================= */

function MapPanel() {
  return (
    <div className="panelContent">
      <h1>지도</h1>

      <p className="subtitle">주변의 안전시설과 위험구간을 확인하세요.</p>

      <div className="locationBox">
        <div className="locationInput">
          <Search size={20} />

          <input placeholder="어디로 갈까요?" aria-label="장소 검색" />
        </div>
      </div>

      <button type="button" className="facilityButton">
        <Camera />

        <div>
          <strong>CCTV</strong>
          <span>주변 CCTV 위치 확인</span>
        </div>
      </button>

      <button type="button" className="facilityButton">
        <Lightbulb />

        <div>
          <strong>가로등</strong>
          <span>주변 가로등 위치 확인</span>
        </div>
      </button>

      <button type="button" className="facilityButton">
        <ShieldCheck />

        <div>
          <strong>여성지킴이 귀갓길</strong>
          <span>안전 귀갓길 구역 확인</span>
        </div>
      </button>

      <button type="button" className="facilityButton">
        <TriangleAlert />

        <div>
          <strong>범죄주의구간</strong>
          <span>주변 주의구간 확인</span>
        </div>
      </button>
    </div>
  );
}

/* =========================================================
   도움요청 패널
========================================================= */

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

/* =========================================================
   설정 패널
========================================================= */

function SettingsPanel() {
  const [safetyLevel, setSafetyLevel] = useState(50);
  const [theme, setTheme] = useState('light');

  const [dangerAlert, setDangerAlert] = useState(true);
  const [routeAlert, setRouteAlert] = useState(true);
  const [guardianAlert, setGuardianAlert] = useState(false);

  return (
    <div className="panelContent settingsPanel">
      <h1>설정</h1>

      <p className="subtitle">친절한 이웃의 설정을 변경할 수 있습니다.</p>

      {/* 기본 안전 우선도 */}
      <div className="settingsCard">
        <h3>기본 안전 우선도</h3>

        <p className="settingsDescription">
          모든 경로 계산의 기본값으로 사용됩니다.
        </p>

        <input
          type="range"
          min="0"
          max="100"
          value={safetyLevel}
          onChange={(e) => setSafetyLevel(Number(e.target.value))}
          className="safetyRange"
          aria-label="기본 안전 우선도"
        />

        <div className="rangeLabels">
          <span>거리 최우선</span>
          <span>균형 (기본)</span>
          <span>안전 최우선</span>
        </div>
      </div>

      {/* 보호자 연락처 */}
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

        <div className="guardianDivider"></div>

        <div className="guardianItem">
          <div className="guardianAvatar">친구</div>

          <div className="guardianInfo">
            <strong>이지훈</strong>
            <span>010-7745-XXXX</span>
          </div>

          <span className="guardianBadge">보조</span>
        </div>

        <button type="button" className="addGuardianButton">
          <UserPlus size={18} />
          연락처 추가
        </button>
      </div>

      {/* 테마 */}
      <div className="settingsCard">
        <h3>테마</h3>

        <div className="themeButtons">
          <button
            type="button"
            className={
              theme === 'light' ? 'themeButton selected' : 'themeButton'
            }
            onClick={() => setTheme('light')}
          >
            라이트
          </button>

          <button
            type="button"
            className={
              theme === 'dark' ? 'themeButton selected' : 'themeButton'
            }
            onClick={() => setTheme('dark')}
          >
            다크
          </button>

          <button
            type="button"
            className={
              theme === 'system' ? 'themeButton selected' : 'themeButton'
            }
            onClick={() => setTheme('system')}
          >
            시스템
          </button>
        </div>
      </div>

      {/* 알림 */}
      <div className="settingsCard">
        <h3>알림</h3>

        <SettingToggle
          title="위험 구간 진입 알림"
          description="주의구간 100m 이내 진입 시 진동"
          checked={dangerAlert}
          onChange={() => setDangerAlert((previous) => !previous)}
        />

        <SettingToggle
          title="야간 경로 재계산 알림"
          description="일몰 후 저장 경로 안전도 변동 시"
          checked={routeAlert}
          onChange={() => setRouteAlert((previous) => !previous)}
        />

        <SettingToggle
          title="보호자 도착 알림"
          description="목적지 도착 시 보호자에게 자동 전송"
          checked={guardianAlert}
          onChange={() => setGuardianAlert((previous) => !previous)}
        />
      </div>
    </div>
  );
}

/* =========================================================
   설정 ON / OFF 버튼
========================================================= */

function SettingToggle({ title, description, checked, onChange }) {
  return (
    <div className="settingToggleRow">
      <div>
        <strong>{title}</strong>
        <span>{description}</span>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={title}
        className={checked ? 'toggleSwitch on' : 'toggleSwitch'}
        onClick={onChange}
      >
        <span></span>
      </button>
    </div>
  );
}

export default App;
