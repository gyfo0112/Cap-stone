import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, UserRound, LockKeyhole, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import './LoginPage.css';
import logo from '../../images/logo.png';

// 앱 안에서 열면 onBack(이전 화면으로), 주소(/login)로 바로 들어오면 메인(/)으로 돌아간다
function LoginPage({ onBack }) {
  const navigate = useNavigate();
  const goBack = onBack ?? (() => navigate('/'));
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [keepLogin, setKeepLogin] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = () => {
    if (!userId.trim()) {
      alert('아이디를 입력해주세요.');
      return;
    }

    if (!password.trim()) {
      alert('비밀번호를 입력해주세요.');
      return;
    }

    alert('로그인 기능은 나중에 서버와 연결하면 됩니다.');
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <button className="login-back" onClick={goBack}>
          <ChevronLeft size={20} />
          뒤로
        </button>

        <button className="login-logo" onClick={goBack}>
          <img src={logo} alt="친절한 이웃 로고" />

          <span>
            친절한 <strong>이웃</strong>
          </span>
        </button>

        <div className="login-box">
          <div className="login-title">
            <ShieldCheck size={26} />

            <div>
              <h1>로그인</h1>
              <p>친절한 이웃과 함께 안전한 귀갓길을 만들어보세요.</p>
            </div>
          </div>

          <div className="login-input-box">
            <UserRound size={21} />

            <input
              type="text"
              placeholder="아이디 또는 이메일"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
            />
          </div>

          <div className="login-input-box">
            <LockKeyhole size={21} />

            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="비밀번호"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleLogin();
                }
              }}
            />

            {/* 비밀번호 보기/숨기기 — 누르는 동안 입력창 포커스가 빠지지 않게 mousedown 기본동작을 막는다 */}
            <button
              type="button"
              className="password-toggle"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
              aria-pressed={showPassword}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <div className="login-options">
            <label className="keep-login">
              <input
                type="checkbox"
                checked={keepLogin}
                onChange={(e) => setKeepLogin(e.target.checked)}
              />

              <span>로그인 상태 유지</span>
            </label>
          </div>

          <button className="main-login-button" onClick={handleLogin}>
            로그인
          </button>

          <div className="login-links">
            <button onClick={() => navigate('/find-id')}>아이디 찾기</button>
            <span></span>
            <button onClick={() => navigate('/find-password')}>비밀번호 찾기</button>
            <span></span>
            <button className="signup-link" onClick={() => navigate('/signup')}>
              회원가입
            </button>
          </div>
        </div>

        <div className="login-footer">
          <p>친절한 이웃</p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
