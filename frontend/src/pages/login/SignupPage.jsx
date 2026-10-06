import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, BadgeInfo, UserRound, Phone } from 'lucide-react';
import { signup } from '../../data/auth';
import { AuthLayout, AuthField, AuthDone, PasswordField } from './AuthLayout';
import { formatPhone, PHONE_RE, PW_MIN, ID_RE } from './rules';

function SignupPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ userId: '', password: '', confirm: '', name: '', phone: '' });
  const [tried, setTried] = useState(false);
  const [idTaken, setIdTaken] = useState('');
  const [done, setDone] = useState(false);

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    if (key === 'userId') setIdTaken('');
  };

  const errors = {
    userId: !ID_RE.test(form.userId) && '영문·숫자 4~20자로 입력해주세요.',
    password: form.password.length < PW_MIN && `비밀번호는 ${PW_MIN}자 이상 입력해주세요.`,
    confirm: form.confirm !== form.password && '비밀번호가 일치하지 않아요.',
    name: !form.name.trim() && '이름을 입력해주세요.',
    phone: !PHONE_RE.test(form.phone) && '휴대폰 번호를 정확히 입력해주세요.',
  };
  // 비밀번호 확인은 입력을 시작하면 바로 일치 여부를 보여준다
  const show = (key) => (tried || (key === 'confirm' && form.confirm)) && errors[key];

  const submit = async () => {
    setTried(true);
    if (Object.values(errors).some(Boolean)) return;
    try {
      await signup(form);
      setDone(true);
    } catch (e) {
      setIdTaken(e.message);
    }
  };

  if (done) {
    return (
      <AuthLayout icon={<UserPlus size={26} />} title="회원가입" desc="친절한 이웃의 가족이 되셨어요.">
        <AuthDone title="가입이 완료됐어요" desc={`${form.name.trim()}님, 환영합니다! 로그인하고 시작해보세요.`} />
        <button className="main-login-button auth-submit" onClick={() => navigate('/login')}>
          로그인하기
        </button>
      </AuthLayout>
    );
  }

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
        error={show('userId') || idTaken}
      />
      <PasswordField
        placeholder={`비밀번호 (${PW_MIN}자 이상)`}
        autoComplete="new-password"
        value={form.password}
        onChange={set('password')}
        error={show('password')}
      />
      <PasswordField
        placeholder="비밀번호 확인"
        autoComplete="new-password"
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
        onKeyDown={(e) => e.key === 'Enter' && submit()}
        error={show('phone')}
      />

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
