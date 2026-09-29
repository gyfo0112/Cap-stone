import { Bell, MapPin, Route, Settings, Siren, UserRound } from 'lucide-react';
import logo from '../../images/logo.png';
import { MobileTabBar } from './MobileTabBar.jsx';

// 데스크탑 왼쪽 메뉴 — MobileTabBar의 TABS 배열과 같은 방식으로, 여기 하나만
// 고치면 메뉴 추가/순서 변경이 되게 데이터로 관리한다.
// frontend-junwoo 브랜치와 이름·순서를 맞춤: 지도(공공시설 확인 내용) / 경로 / 도움요청 / 설정.
const DESKTOP_MENU = [
  { key: 'map', icon: MapPin, label: '지도' },
  { key: 'route', icon: Route, label: '경로' },
  { key: 'help', icon: Bell, label: '도움요청' },
  { key: 'settings', icon: Settings, label: '설정' },
];

// 공통 레이아웃: PC에선 왼쪽 메뉴(헤더 역할), 모바일에선 같은 자리에 하단 탭바(푸터 역할).
// 가운데 내용(pages/)만 바뀌고 이 틀은 모든 기능이 같이 쓴다.
export function Sidebar({ isMobile, mobileTab, onSelectMobileTab, menu, onSelectMenu, onOpenSos, onOpenLogin }) {
  return (
    <aside className="sidebar">
      <div>
        <div className="logo">
          <img src={logo} alt="친절한 이웃 로고" className="logoImage" />

          <div className="logoText">
            친절한 <span>이웃</span>
          </div>
        </div>

        {isMobile ? (
          <MobileTabBar active={mobileTab} onSelect={onSelectMobileTab} />
        ) : (
          <nav className="menu">
            {DESKTOP_MENU.map((m) => (
              <button
                key={m.key}
                className={menu === m.key ? 'menuItem active' : 'menuItem'}
                onClick={() => onSelectMenu(m.key)}
              >
                <m.icon size={22} />
                <span>{m.label}</span>
              </button>
            ))}
          </nav>
        )}
      </div>

      <div className="sidebarBottom">
        <button className="emergencyButton" onClick={onOpenSos}>
          <Siren size={21} />
          도움 요청하기
        </button>

        <button className="loginButton" onClick={onOpenLogin}>
          <UserRound size={22} />
          로그인
        </button>
      </div>
    </aside>
  );
}
