import { useState } from 'react';
import {
  ChevronRight,
  UserPlus,
  UserRound,
  X,
} from 'lucide-react';
import { LocationSharing } from '../../components/LocationSharing';
import { ToggleGroup } from '../../components/ToggleGroup';
import { addContact, getContacts, removeContact } from '../../data/contacts';
import { PRIORITY_OPTIONS, THEME_OPTIONS } from '../../data/routeData';
import { useAuth } from '../../hooks/useAuth';
import { useStoredState } from '../../hooks/useStoredState';
import { MobileHeader } from '../../components/layout/MobileHeader';

const NOTIF_ITEMS = [
  { key: 'zoneEntry', title: '위험 구간 진입 알림', desc: '주의구간 100m 이내 진입 시 진동' },
  { key: 'nightRecalc', title: '야간 경로 재계산 알림', desc: '일몰 후 저장 경로 안전도 변동 시' },
  { key: 'arrival', title: '보호자 도착 알림', desc: '목적지 도착 시 보호자에게 자동 전송' },
];

export function SettingsScreen({ routePriority, onRoutePriorityChange, theme, onThemeChange, onOpenLogin }) {
  const { user, logout } = useAuth();
  const [notif, setNotif] = useStoredState('mf-notif', { zoneEntry: true, nightRecalc: true, arrival: false });
  const [contacts, setContacts] = useState(getContacts);
  const [addingContact, setAddingContact] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newType, setNewType] = useState('보조');

  const toggleNotif = (key) => setNotif((n) => ({ ...n, [key]: !n[key] }));

  const submitContact = () => {
    const tel_name = newName.trim();
    const tel_num = newPhone.trim();
    if (!tel_name || !tel_num) return;
    setContacts(addContact({ tel_name, tel_num, tel_type: newType }));
    setNewName('');
    setNewPhone('');
    setNewType('보조');
    setAddingContact(false);
  };

  const deleteContact = (tel_uuid) => setContacts(removeContact(tel_uuid));

  return (
    <div className="mfScreen mfScreenTabbed">
      <MobileHeader title="설정" />

      {/* 계정 카드 — 로그인 전엔 로그인 화면으로, 로그인 후엔 이름·아이디와 로그아웃 */}
      {user ? (
        <div className="mfSettingsCard mfAccountCard mfAccountIn">
          <span className="mfContactAvatar">
            <UserRound size={20} />
          </span>
          <div className="mfContactInfo">
            <strong>{user.name}</strong>
            <span>@{user.userId}</span>
          </div>
          <button className="mfOutlineBtn" onClick={logout}>
            로그아웃
          </button>
        </div>
      ) : (
        <button className="mfSettingsCard mfAccountCard" onClick={onOpenLogin}>
          <span className="mfContactAvatar">
            <UserRound size={20} />
          </span>
          <div className="mfContactInfo">
            <strong>로그인하세요</strong>
            <span>연락처·즐겨찾기를 안전하게 보관</span>
          </div>
          <ChevronRight size={20} className="mfAccountChevron" />
        </button>
      )}

      <div className="mfSettingsCard">
        <strong>실시간 위치 공유</strong>
        <LocationSharing />
      </div>

      <div className="mfSettingsCard">
        <strong>기본 안전 우선도</strong>
        <p>모든 경로 계산의 기본값으로 사용됩니다.</p>
        <ToggleGroup options={PRIORITY_OPTIONS} value={routePriority} onChange={onRoutePriorityChange} label="기본 안전 우선도" />
      </div>

      <div className="mfSettingsCard">
        <strong>보호자 연락처</strong>
        {contacts.length === 0 && <p className="mfEmptyHint">등록된 보호자가 없어요.</p>}
        {contacts.map((c) => (
          <div className="mfContactRow" key={c.tel_uuid}>
            <span className="mfContactAvatar">{c.relation || c.tel_name[0]}</span>
            <div className="mfContactInfo">
              <strong>{c.tel_name}</strong>
              <span>{c.tel_num}</span>
            </div>
            <span className="mfContactTag">{c.tel_type}</span>
            <button
              className="mfContactRemove"
              onClick={() => deleteContact(c.tel_uuid)}
              aria-label={`${c.tel_name} 연락처 삭제`}
            >
              <X size={14} />
            </button>
          </div>
        ))}

        {addingContact ? (
          <div className="mfAddContactForm">
            <input
              className="mfAddContactInput"
              placeholder="이름"
              aria-label="이름"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <input
              className="mfAddContactInput"
              placeholder="전화번호"
              aria-label="전화번호"
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submitContact()}
            />
            <div className="mfSegment">
              {['기본', '보조'].map((t) => (
                <button
                  key={t}
                  className={newType === t ? 'mfSegmentItem active' : 'mfSegmentItem'}
                  onClick={() => setNewType(t)}
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="mfAddContactActions">
              <button className="mfOutlineBtn mfFlex1" onClick={() => setAddingContact(false)}>
                취소
              </button>
              <button
                className="mfPrimaryBtn mfFlex1"
                disabled={!newName.trim() || !newPhone.trim()}
                onClick={submitContact}
              >
                추가
              </button>
            </div>
          </div>
        ) : (
          <button className="mfTextBtn mfAddContact" onClick={() => setAddingContact(true)}>
            <UserPlus size={15} /> 연락처 추가
          </button>
        )}
      </div>

      <div className="mfSettingsCard">
        <strong>테마</strong>
        <ToggleGroup options={THEME_OPTIONS} value={theme} onChange={onThemeChange} label="테마" />
      </div>

      <div className="mfSettingsCard">
        <strong>알림</strong>
        {NOTIF_ITEMS.map((n) => (
          <div className="mfNotifRow" key={n.key}>
            <div className="mfNotifInfo">
              <strong>{n.title}</strong>
              <span>{n.desc}</span>
            </div>
            <button
              className={notif[n.key] ? 'mfSwitch on' : 'mfSwitch'}
              onClick={() => toggleNotif(n.key)}
              aria-label={n.title}
            >
              <span />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
