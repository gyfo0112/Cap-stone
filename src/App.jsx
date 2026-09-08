import { useState } from 'react';
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
import SosPage from './SosPage';
import LoginPage from './LoginPage';

function App() {
  const [menu, setMenu] = useState('route');
  const [showSOS, setShowSOS] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  if (showSOS) {
    return <SosPage onCancel={() => setShowSOS(false)} />;
  }

  if (showLogin) {
    return <LoginPage onBack={() => setShowLogin(false)} />;
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
              <span>도움 요청</span>
            </button>

            <button
              className={menu === 'facility' ? 'menuItem active' : 'menuItem'}
              onClick={() => setMenu('facility')}
            >
              <ShieldCheck size={22} />
              <span>공공시설 확인</span>
            </button>
          </nav>
        </div>

        <div className="sidebarBottom">
          <button className="emergencyButton" onClick={() => setShowSOS(true)}>
            <Siren size={21} />
            도움 요청하기
          </button>

          <button className="loginButton" onClick={() => setShowLogin(true)}>
            <UserRound size={22} />
            로그인
          </button>
        </div>
      </aside>

      {/* 가운데 기능 패널 */}
      <section className="controlPanel">
        {menu === 'route' && <RoutePanel />}
        {menu === 'help' && <HelpPanel />}
        {menu === 'facility' && <FacilityPanel />}
      </section>

      {/* 오른쪽 지도 영역 */}
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
  );
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

function FacilityPanel() {
  return (
    <div className="panelContent">
      <h1>공공시설 확인</h1>

      <p className="subtitle">지도에서 원하는 안전시설을 확인하세요.</p>

      <button className="facilityButton">
        <Camera />

        <div>
          <strong>CCTV 위치</strong>
          <span>주변 CCTV 확인</span>
        </div>
      </button>

      <button className="facilityButton">
        <Lightbulb />

        <div>
          <strong>가로등 위치</strong>
          <span>주변 가로등 확인</span>
        </div>
      </button>

      <button className="facilityButton">
        <ShieldCheck />

        <div>
          <strong>여성지킴이 귀갓길</strong>
          <span>안전 귀갓길 구역 확인</span>
        </div>
      </button>
    </div>
  );
}

export default App;
