import { useNavigate } from 'react-router-dom';
import { MapPinOff } from 'lucide-react';
import './login/LoginPage.css';
import logo from '../images/logo.png';

// 목록(AppRouter.jsx)에 없는 주소로 들어왔을 때
function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-logo">
          <img src={logo} alt="친절한 이웃 로고" />
          <span>
            친절한 <strong>이웃</strong>
          </span>
        </div>

        <div className="login-box">
          <div className="auth-done">
            <MapPinOff size={48} />
            <h2>페이지를 찾을 수 없어요</h2>
            <p>주소가 바뀌었거나 잘못 입력됐을 수 있어요.</p>
          </div>
          <button className="main-login-button" onClick={() => navigate('/')}>
            지도로 돌아가기
          </button>
        </div>
      </div>
    </div>
  );
}

export default NotFoundPage;
