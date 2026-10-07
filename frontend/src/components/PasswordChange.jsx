import { useState } from 'react';
import { KeyRound } from 'lucide-react';
import { changePassword } from '../data/auth';
import { useAuth } from '../hooks/useAuth';
import { PW_MAX, PW_MIN } from '../pages/login/rules';

// 비밀번호 변경 — 설정 화면(PC·모바일 공용). mobile이면 모바일 설정 화면의 클래스를 쓴다.
// 입력 오류는 입력창 아래에 보여준다(현재 비밀번호 불일치 등 서버 400 메시지 포함).
const CLASSES = {
  pc: { form: 'addContactForm', input: 'addContactInput', actions: 'addContactActions', cancel: 'addContactCancel', submit: 'addContactSubmit', open: 'addGuardianButton' },
  mobile: { form: 'mfAddContactForm', input: 'mfAddContactInput', actions: 'mfAddContactActions', cancel: 'mfOutlineBtn mfFlex1', submit: 'mfPrimaryBtn mfFlex1', open: 'mfTextBtn mfAddContact' },
};

export function PasswordChange({ mobile = false }) {
  const { user } = useAuth();
  const c = CLASSES[mobile ? 'mobile' : 'pc'];
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ oldPassword: '', newPassword: '', confirmNewPassword: '' });
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const close = () => {
    setOpen(false);
    setForm({ oldPassword: '', newPassword: '', confirmNewPassword: '' });
    setError('');
  };

  const submit = async () => {
    if (form.newPassword.length < PW_MIN) return setError(`새 비밀번호는 ${PW_MIN}자 이상이어야 해요.`);
    if (form.newPassword !== form.confirmNewPassword) return setError('새 비밀번호와 확인이 일치하지 않아요.');
    setBusy(true);
    try {
      await changePassword(user.userId, form);
      close();
      setDone(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <>
        {done && <p className={mobile ? 'mfEmptyHint' : 'settingsDescription'}>비밀번호를 변경했어요.</p>}
        <button
          className={c.open}
          onClick={() => {
            setDone(false);
            setOpen(true);
          }}
        >
          <KeyRound size={mobile ? 15 : 18} /> 비밀번호 변경
        </button>
      </>
    );
  }
  return (
    <div className={c.form}>
      <input className={c.input} type="password" placeholder="현재 비밀번호" aria-label="현재 비밀번호" autoComplete="current-password" maxLength={PW_MAX} value={form.oldPassword} onChange={set('oldPassword')} />
      <input className={c.input} type="password" placeholder={`새 비밀번호 (${PW_MIN}자 이상)`} aria-label="새 비밀번호" autoComplete="new-password" maxLength={PW_MAX} value={form.newPassword} onChange={set('newPassword')} />
      <input
        className={c.input}
        type="password"
        placeholder="새 비밀번호 확인"
        aria-label="새 비밀번호 확인"
        autoComplete="new-password"
        maxLength={PW_MAX}
        value={form.confirmNewPassword}
        onChange={set('confirmNewPassword')}
        onKeyDown={(e) => e.key === 'Enter' && form.oldPassword && submit()}
      />
      {error && <p className="shareError">{error}</p>}
      <div className={c.actions}>
        <button className={c.cancel} onClick={close}>
          취소
        </button>
        <button className={c.submit} disabled={busy || !form.oldPassword || !form.newPassword} onClick={submit}>
          변경
        </button>
      </div>
    </div>
  );
}
