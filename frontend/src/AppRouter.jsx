import { Routes, Route, Navigate } from 'react-router-dom';
import App from './App';
import LoginPage from './pages/login/LoginPage';
import FindIdPage from './pages/login/FindIdPage';
import FindPasswordPage from './pages/login/FindPasswordPage';
import SignupPage from './pages/login/SignupPage';
import SosPage from './pages/sos/SosPage';
import { useCurrentLocation } from './hooks/useCurrentLocation';

// 주소(URL) → 페이지 목록. 백엔드는 이 목록의 주소를 모두 index.html로 넘기면 된다.
// 새 페이지(jsx)를 만들면 여기에 <Route>를 한 줄씩 추가한다.
//
// 지도·경로·도움요청·설정은 공통 틀(좌측 메뉴/하단 탭 + 지도)을 쓰는 App 하나가 그리므로
// startMenu로 '처음 열 메뉴'만 정한다. 들어온 뒤 메뉴 이동은 App 안에서 상태값으로 한다.
export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/map" element={<App startMenu="map" />} />
      <Route path="/route" element={<App startMenu="route" />} />
      <Route path="/help" element={<App startMenu="help" />} />
      <Route path="/settings" element={<App startMenu="settings" />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/find-id" element={<FindIdPage />} />
      <Route path="/find-password" element={<FindPasswordPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/sos" element={<SosRoute />} />
      {/* 목록에 없는 주소는 메인으로 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

// 주소(/sos)로 바로 들어왔을 때 — 앱 안에서 열 때와 같이 현재 위치를 지도에 넘겨준다
function SosRoute() {
  const location = useCurrentLocation();
  return <SosPage location={location} />;
}
