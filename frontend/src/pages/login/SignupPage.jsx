import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, BadgeInfo, LockKeyhole, UserRound, Phone, Eye, EyeOff } from 'lucide-react';
import { AuthLayout, AuthField } from './AuthLayout';
import { formatPhone, PHONE_RE } from './phone';

const ID_RE = /^[a-zA-Z0-9]{4,20}$/;
// 백엔드 user_pw 컬럼이 30자라 최대 30자로 맞춘다
const PW_MIN = 8;
const PW_MAX = 30;

const AGREEMENTS = [
  { key: 'terms', label: '이용약관 동의', required: true },
  { key: 'privacy', label: '개인정보 수집·이용 동의', required: true },
  { key: 'location', label: '위치정보 이용 동의', required: true },
];

function SignupPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ userId: '', password: '', confirm: '', name: '', phone: '' });
  const [showPw, setShowPw] = useState(false);
  const [agree, setAgree] = useState({ terms: false, privacy: false, location: false });
  const [tried, setTried] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const allAgreed = AGREEMENTS.every((a) => agree[a.key]);

  const errors = {
    userId: !ID_RE.test(form.userId) && '영문·숫자 4~20자로 입력해주세요.',
    password: form.password.length < PW_MIN && `비밀번호는 ${PW_MIN}자 이상 입력해주세요.`,
    confirm: form.confirm !== form.password && '비밀번호가 일치하지 않아요.',
    name: !form.name.trim() && '이름을 입력해주세요.',
    phone: !PHONE_RE.test(form.phone) && '휴대폰 번호를 정확히 입력해주세요.',
  };
  // 비밀번호 확인은 입력을 시작하면 바로 일치 여부를 보여준다
  const show = (key) => (tried || (key === 'confirm' && form.confirm)) && errors[key];

  const submit = () => {
    setTried(true);
    if (Object.values(errors).some(Boolean)) return;
    if (!allAgreed) {
      alert('필수 약관에 모두 동의해주세요.');
      return;
    }
    alert('회원가입 기능은 나중에 서버와 연결하면 됩니다.');
  };

  const pwToggle = (
    <button
      type="button"
      className="password-toggle"
      onMouseDown={(e) => e.preventDefault()}
      onClick={() => setShowPw((v) => !v)}
      aria-label={showPw ? '비밀번호 숨기기' : '비밀번호 보기'}
      aria-pressed={showPw}
    >
      {showPw ? <EyeOff size={20} /> : <Eye size={20} />}
    </button>
  );

  return (
    <AuthLayout
      icon={<UserPlus size={26} />}
      title="회원가입"
      desc="가입하고 안전한 귀갓길을 함께 만들어보세요."
    >
      <AuthField
        icon={<BadgeInfo size={21} />}
        placeholder="아이디 (영문·숫자 4~20자)"
        autoComplete="username"
        maxLength={20}
        value={form.userId}
        onChange={set('userId')}
        error={show('userId')}
      />
      <AuthField
        icon={<LockKeyhole size={21} />}
        type={showPw ? 'text' : 'password'}
        placeholder={`비밀번호 (${PW_MIN}자 이상)`}
        autoComplete="new-password"
        maxLength={PW_MAX}
        value={form.password}
        onChange={set('password')}
        error={show('password')}
        right={pwToggle}
      />
      <AuthField
        icon={<LockKeyhole size={21} />}
        type={showPw ? 'text' : 'password'}
        placeholder="비밀번호 확인"
        autoComplete="new-password"
        maxLength={PW_MAX}
        value={form.confirm}
        onChange={set('confirm')}
        error={show('confirm')}
        hint={form.confirm && !errors.confirm ? '비밀번호가 일치해요.' : undefined}
      />
      <AuthField
        icon={<UserRound size={21} />}
        placeholder="이름"
        autoComplete="name"
        value={form.name}
        onChange={set('name')}
        error={show('name')}
      />
      <AuthField
        icon={<Phone size={21} />}
        type="tel"
        inputMode="numeric"
        placeholder="휴대폰 번호 (010-0000-0000)"
        autoComplete="tel"
        value={form.phone}
        onChange={(e) => setForm((f) => ({ ...f, phone: formatPhone(e.target.value) }))}
        error={show('phone')}
      />

      <div className="signup-agree">
        <label className="signup-agree-all">
          <input
            type="checkbox"
            checked={allAgreed}
            onChange={(e) =>
              setAgree(Object.fromEntries(AGREEMENTS.map((a) => [a.key, e.target.checked])))
            }
          />
          <span>전체 동의</span>
        </label>
        {AGREEMENTS.map((a) => (
          <label key={a.key} className="signup-agree-item">
            <input
              type="checkbox"
              checked={agree[a.key]}
              onChange={(e) => setAgree((s) => ({ ...s, [a.key]: e.target.checked }))}
            />
            <span>
              <em>(필수)</em> {a.label}
            </span>
          </label>
        ))}
      </div>

      <button className="main-login-button auth-submit" onClick={submit}>
        가입하기
      </button>

      <div className="login-links">
        <span className="auth-plain">이미 계정이 있나요?</span>
        <button className="signup-link" onClick={() => navigate('/login')}>
          로그인
        </button>
      </div>
    </AuthLayout>
  );
}

export default SignupPage;
