import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, UserRound, Phone } from 'lucide-react';
import { AuthLayout, AuthField } from './AuthLayout';
import { formatPhone, PHONE_RE } from './phone';

function FindIdPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [tried, setTried] = useState(false);

  const nameError = tried && !name.trim() && '이름을 입력해주세요.';
  const phoneError = tried && !PHONE_RE.test(phone) && '휴대폰 번호를 정확히 입력해주세요.';

  const submit = () => {
    setTried(true);
    if (!name.trim() || !PHONE_RE.test(phone)) return;
    alert('아이디 찾기 기능은 나중에 서버와 연결하면 됩니다.');
  };

  return (
    <AuthLayout
      icon={<Search size={26} />}
      title="아이디 찾기"
      desc="가입할 때 입력한 이름과 휴대폰 번호를 알려주세요."
    >
      <AuthField
        icon={<UserRound size={21} />}
        placeholder="이름"
        value={name}
        onChange={(e) => setName(e.target.value)}
        error={nameError}
      />
      <AuthField
        icon={<Phone size={21} />}
        type="tel"
        inputMode="numeric"
        placeholder="휴대폰 번호 (010-0000-0000)"
        value={phone}
        onChange={(e) => setPhone(formatPhone(e.target.value))}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
        error={phoneError}
      />

      <button className="main-login-button auth-submit" onClick={submit}>
        아이디 찾기
      </button>

      <div className="login-links">
        <button onClick={() => navigate('/find-password')}>비밀번호 찾기</button>
        <span></span>
        <button className="signup-link" onClick={() => navigate('/signup')}>
          회원가입
        </button>
      </div>
    </AuthLayout>
  );
}

export default FindIdPage;
