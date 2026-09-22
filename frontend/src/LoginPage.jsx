import { useState } from 'react';
import { UserRound, LockKeyhole, ShieldCheck } from 'lucide-react';
import './LoginPage.css';
import logo from './images/logo.png';

function LoginPage({ onBack }) {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [keepLogin, setKeepLogin] = useState(false);

  const handleLogin = () => {
    if (!userId.trim()) {
      alert('아이디를 입력해주세요.');
      return;
    }

    if (!password.trim()) {
      alert('비밀번호를 입력해주세요.');
      return;
    }

    console.log('아이디:', userId);
    console.log('비밀번호:', password);

    alert('로그인 기능은 나중에 서버와 연결하면 됩니다.');
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <button className="login-logo" onClick={onBack}>
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
              type="password"
              placeholder="비밀번호"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleLogin();
                }
              }}
            />
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

            <button className="security-button">
              IP 보안
              <span className="security-toggle"></span>
            </button>
          </div>

          <button className="main-login-button" onClick={handleLogin}>
            로그인
          </button>

          <div className="login-links">
            <button>아이디 찾기</button>
            <span></span>
            <button>비밀번호 찾기</button>
            <span></span>
            <button className="signup-link">회원가입</button>
          </div>
        </div>

        <div className="login-footer">
          <button>이용약관</button>
          <span></span>
          <button>개인정보처리방침</button>
          <span></span>
          <button>고객센터</button>

          <p>© 친절한 이웃</p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
