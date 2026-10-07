import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { KeyRound, UserRound, Phone, BadgeInfo } from 'lucide-react';
import { resetPassword, verifyAccount } from '../../data/auth';
import { AuthLayout, AuthField, AuthDone, PasswordField } from './AuthLayout';
import { formatPhone, PHONE_RE, PW_MIN } from './rules';

// 1) 본인 확인(아이디·이름·휴대폰) → 2) 새 비밀번호 → 3) 완료
function FindPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState('verify');
  const [info, setInfo] = useState({ userId: '', name: '', phone: '' });
  const [newPw, setNewPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [tried, setTried] = useState(false);
  const [serverError, setServerError] = useState('');

  const setField = (key) => (e) => {
    const value = key === 'phone' ? formatPhone(e.target.value) : e.target.value;
    setInfo((f) => ({ ...f, [key]: value }));
    setServerError('');
  };

  const verifyErrors = {
    userId: !info.userId.trim() && '아이디를 입력해주세요.',
    name: !info.name.trim() && '이름을 입력해주세요.',
    phone: !PHONE_RE.test(info.phone) && '휴대폰 번호를 정확히 입력해주세요.',
  };
  const resetErrors = {
    newPw: newPw.length < PW_MIN && `비밀번호는 ${PW_MIN}자 이상 입력해주세요.`,
    confirm: confirm !== newPw && '비밀번호가 일치하지 않아요.',
  };

  const verify = async () => {
    setTried(true);
    if (Object.values(verifyErrors).some(Boolean)) return;
    try {
      if (!(await verifyAccount(info))) {
        setServerError('일치하는 계정을 찾을 수 없어요.');
        return;
      }
    } catch (e) {
      setServerError(e.message);
      return;
    }
    setTried(false);
    setStep('reset');
  };

  const reset = async () => {
    setTried(true);
    if (Object.values(resetErrors).some(Boolean)) return;
    try {
      await resetPassword(info, newPw);
      setStep('done');
    } catch (e) {
      setServerError(e.message);
    }
  };

  if (step === 'done') {
    return (
      <AuthLayout icon={<KeyRound size={26} />} title="비밀번호 찾기" desc="새 비밀번호로 로그인할 수 있어요.">
        <AuthDone title="비밀번호를 변경했어요" />
        <button className="main-login-button auth-submit" onClick={() => navigate('/login')}>
          로그인하기
        </button>
      </AuthLayout>
    );
  }

  if (step === 'reset') {
    return (
      <AuthLayout icon={<KeyRound size={26} />} title="비밀번호 재설정" desc="새로 사용할 비밀번호를 입력해주세요.">
        <PasswordField
          placeholder={`새 비밀번호 (${PW_MIN}자 이상)`}
          autoComplete="new-password"
          value={newPw}
          onChange={(e) => setNewPw(e.target.value)}
          error={tried && resetErrors.newPw}
        />
        <PasswordField
          placeholder="새 비밀번호 확인"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && reset()}
          error={(tried || confirm) && resetErrors.confirm}
          hint={confirm && !resetErrors.confirm ? '비밀번호가 일치해요.' : undefined}
        />
        {serverError && <p className="auth-msg error">{serverError}</p>}
        <button className="main-login-button auth-submit" onClick={reset}>
          비밀번호 변경
        </button>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      icon={<KeyRound size={26} />}
      title="비밀번호 찾기"
      desc="본인 확인 후 비밀번호를 다시 설정할 수 있어요."
    >
      <AuthField
        icon={<BadgeInfo size={21} />}
        placeholder="아이디"
        value={info.userId}
        onChange={setField('userId')}
        error={tried && verifyErrors.userId}
      />
      <AuthField
        icon={<UserRound size={21} />}
        placeholder="이름"
        value={info.name}
        onChange={setField('name')}
        error={tried && verifyErrors.name}
      />
      <AuthField
        icon={<Phone size={21} />}
        type="tel"
        inputMode="numeric"
        placeholder="휴대폰 번호 (010-0000-0000)"
        value={info.phone}
        onChange={setField('phone')}
        onKeyDown={(e) => e.key === 'Enter' && verify()}
        error={(tried && verifyErrors.phone) || serverError}
      />

      <button className="main-login-button auth-submit" onClick={verify}>
        본인 확인
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
