import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { KeyRound, UserRound, Phone, BadgeInfo } from 'lucide-react';
import { AuthLayout, AuthField } from './AuthLayout';
import { formatPhone, PHONE_RE } from './phone';

function FindPasswordPage() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [tried, setTried] = useState(false);

  const idError = tried && !userId.trim() && '아이디를 입력해주세요.';
  const nameError = tried && !name.trim() && '이름을 입력해주세요.';
  const phoneError = tried && !PHONE_RE.test(phone) && '휴대폰 번호를 정확히 입력해주세요.';

  const submit = () => {
    setTried(true);
    if (!userId.trim() || !name.trim() || !PHONE_RE.test(phone)) return;
    alert('비밀번호 찾기 기능은 나중에 서버와 연결하면 됩니다.');
  };

  return (
    <AuthLayout
      icon={<KeyRound size={26} />}
      title="비밀번호 찾기"
      desc="본인 확인 후 비밀번호를 다시 설정할 수 있어요."
    >
      <AuthField
        icon={<BadgeInfo size={21} />}
        placeholder="아이디"
        value={userId}
        onChange={(e) => setUserId(e.target.value)}
        error={idError}
      />
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
        비밀번호 재설정
      </button>

      <div className="login-links">
        <button onClick={() => navigate('/find-id')}>아이디 찾기</button>
        <span></span>
        <button className="signup-link" onClick={() => navigate('/signup')}>
          회원가입
        </button>
      </div>
    </AuthLayout>
  );
}

export default FindPasswordPage;
