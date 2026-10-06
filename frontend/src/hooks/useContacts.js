import { useEffect, useState } from 'react';
import { USE_BACKEND } from '../api/http';
import { addContact, getContacts, listContacts, removeContact } from '../data/contacts';
import { useAuth } from './useAuth';

// 보호자 연락처 목록 + 추가/삭제 — 설정 화면(PC·모바일) 공용. 백엔드 모드에선 로그인해야 쓸 수 있다(needLogin).
export function useContacts() {
  const { user } = useAuth();
  const needLogin = USE_BACKEND && !user;
  const [loaded, setLoaded] = useState(() => (USE_BACKEND ? [] : getContacts()));
  const [error, setError] = useState('');
  const userId = user?.userId;

  useEffect(() => {
    if (!USE_BACKEND || !userId) return;
    let cancelled = false;
    listContacts()
      .then((list) => !cancelled && setLoaded(list))
      .catch((e) => !cancelled && setError(e.message));
    return () => {
      cancelled = true;
    };
  }, [userId]);

  // 성공하면 true — 호출한 쪽이 입력 폼을 닫을지 정한다
  const run = async (action) => {
    try {
      setLoaded(await action());
      setError('');
      return true;
    } catch (e) {
      setError(e.message);
      return false;
    }
  };

  return {
    contacts: needLogin ? [] : loaded,
    needLogin,
    error,
    add: (contact) => run(() => addContact(contact)),
    remove: (tel_uuid) => run(() => removeContact(tel_uuid)),
  };
}
