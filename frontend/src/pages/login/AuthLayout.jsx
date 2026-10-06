import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import './LoginPage.css';
import logo from '../../images/logo.png';

// 아이디 찾기 · 비밀번호 찾기 · 회원가입 공통 틀 — 로그인 화면과 같은 카드 모양을 쓴다
export function AuthLayout({ icon, title, desc, children }) {
  const navigate = useNavigate();
  const toLogin = () => navigate('/login');

  return (
    <div className="login-page">
      <div className="login-container">
        <button className="login-back" onClick={toLogin}>
          <ChevronLeft size={20} />
          로그인
        </button>

        <button className="login-logo" onClick={() => navigate('/')}>
          <img src={logo} alt="친절한 이웃 로고" />
          <span>
            친절한 <strong>이웃</strong>
          </span>
        </button>

        <div className="login-box">
          <div className="login-title">
            {icon}
            <div>
              <h1>{title}</h1>
              <p>{desc}</p>
            </div>
          </div>
          {children}
        </div>

        <div className="login-footer">
          <p>친절한 이웃</p>
        </div>
      </div>
    </div>
  );
}

// 아이콘 + 입력창 한 줄. error가 있으면 아래에 빨간 안내, hint는 회색 안내
export function AuthField({ icon, error, hint, right, ...inputProps }) {
  return (
    <div className="auth-field">
      <div className={`login-input-box${error ? ' hasError' : ''}`}>
        {icon}
        <input {...inputProps} />
        {right}
      </div>
      {error ? <p className="auth-msg error">{error}</p> : hint && <p className="auth-msg">{hint}</p>}
    </div>
  );
}
