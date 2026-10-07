import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, UserRound, Phone } from 'lucide-react';
import { findIds } from '../../data/auth';
import { AuthLayout, AuthField, AuthDone } from './AuthLayout';
import { formatPhone, PHONE_RE } from './rules';

function FindIdPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [tried, setTried] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [found, setFound] = useState(null); // 찾은 아이디(가린 형태) 목록

  const nameError = tried && !name.trim() && '이름을 입력해주세요.';
  const phoneError = tried && !PHONE_RE.test(phone) && '휴대폰 번호를 정확히 입력해주세요.';

  const [serverError, setServerError] = useState('');

  const submit = async () => {
    setTried(true);
    if (!name.trim() || !PHONE_RE.test(phone)) return;
    try {
      const ids = await findIds({ name, phone });
      setServerError('');
      setNotFound(ids.length === 0);
      if (ids.length) setFound(ids);
    } catch (e) {
      setServerError(e.message);
    }
  };

  if (found) {
    return (
      <AuthLayout icon={<Search size={26} />} title="아이디 찾기" desc="입력하신 정보로 가입된 아이디예요.">
        <AuthDone title="아이디를 찾았어요">
          <ul className="auth-found">
            {found.map((id) => (
              <li key={id}>{id}</li>
            ))}
          </ul>
          <p className="auth-note">개인정보 보호를 위해 일부만 보여드려요.</p>
        </AuthDone>
        <button className="main-login-button auth-submit" onClick={() => navigate('/login')}>
          로그인하기
        </button>
        <div className="login-links">
          <button onClick={() => navigate('/find-password')}>비밀번호 찾기</button>
        </div>
      </AuthLayout>
    );
  }

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
        onChange={(e) => {
          setName(e.target.value);
          setNotFound(false);
        }}
        error={nameError}
      />
      <AuthField
        icon={<Phone size={21} />}
        type="tel"
        inputMode="numeric"
        placeholder="휴대폰 번호 (010-0000-0000)"
        value={phone}
        onChange={(e) => {
          setPhone(formatPhone(e.target.value));
          setNotFound(false);
        }}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
        error={phoneError || serverError || (notFound && '일치하는 계정을 찾을 수 없어요.')}
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
