import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, UserRound, ShieldCheck } from 'lucide-react';
import { login } from '../../data/auth';
import { AuthField, PasswordField } from './AuthLayout';
import './LoginPage.css';
import logo from '../../images/logo.png';

// 앱 안에서 열면 onBack(이전 화면으로), 주소(/login)로 바로 들어오면 메인(/)으로 돌아간다
function LoginPage({ onBack }) {
  const navigate = useNavigate();
  const goBack = onBack ?? (() => navigate('/'));
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [keepLogin, setKeepLogin] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!userId.trim() || !password) {
      setError(!userId.trim() ? '아이디를 입력해주세요.' : '비밀번호를 입력해주세요.');
      return;
    }
    try {
      await login(userId.trim(), password, keepLogin);
      goBack();
    } catch (e) {
      setError(e.message);
    }
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

          <AuthField
            icon={<UserRound size={21} />}
            placeholder="아이디"
            autoComplete="username"
            value={userId}
            onChange={(e) => {
              setUserId(e.target.value);
              setError('');
            }}
          />

          <PasswordField
            placeholder="비밀번호"
            autoComplete="current-password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError('');
            }}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            error={error}
          />

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
