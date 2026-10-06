import { useState } from 'react';
import { UserPlus, UserRound } from 'lucide-react';
import { ToggleGroup } from '../../components/ToggleGroup';
import { addContact, getContacts, removeContact } from '../../data/contacts';
import { PRIORITY_OPTIONS, THEME_OPTIONS } from '../../data/routeData';
import { useAuth } from '../../hooks/useAuth';
import { useStoredState } from '../../hooks/useStoredState';

const NOTIF_ITEMS = [
  { key: 'zoneEntry', title: '위험 구간 진입 알림', desc: '주의구간 100m 이내 진입 시 진동' },
  { key: 'nightRecalc', title: '야간 경로 재계산 알림', desc: '일몰 후 저장 경로 안전도 변동 시' },
  { key: 'arrival', title: '보호자 도착 알림', desc: '목적지 도착 시 보호자에게 자동 전송' },
];

// 모바일 설정 화면과 내용은 같되, controlPanel 안에 들어가는 데스크탑 전용 레이아웃.
// 보호자 연락처는 모바일과 완전히 같은 저장소(contacts.js/localStorage)를 그대로 쓴다.
export function SettingsPanel({ routePriority, onRoutePriorityChange, theme, onThemeChange, onOpenLogin }) {
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

  return (
    <div className="panelContent">
      <h1>설정</h1>

      <p className="subtitle">친절한 이웃의 설정을 변경할 수 있습니다.</p>

      <div className="settingsCard">
        <div className="guardianItem accountItem">
          <div className="guardianAvatar">
            <UserRound size={20} />
          </div>
          <div className="guardianInfo">
            <strong>{user ? user.name : '로그인하세요'}</strong>
            <span>{user ? `@${user.userId}` : '연락처·즐겨찾기를 안전하게 보관'}</span>
          </div>
          <button className="accountButton" onClick={user ? logout : onOpenLogin}>
            {user ? '로그아웃' : '로그인'}
          </button>
        </div>
      </div>

      <div className="settingsCard">
        <h3>기본 안전 우선도</h3>
        <p className="settingsDescription">모든 경로 계산의 기본값으로 사용됩니다.</p>
        <ToggleGroup options={PRIORITY_OPTIONS} value={routePriority} onChange={onRoutePriorityChange} label="기본 안전 우선도" />
      </div>

      <div className="settingsCard">
        <h3>보호자 연락처</h3>

        {contacts.length === 0 && <p className="settingsDescription">등록된 보호자가 없어요.</p>}
        {contacts.map((c, i) => (
          <div key={c.tel_uuid}>
            {i > 0 && <div className="guardianDivider" />}
            <div className="guardianItem">
              <div className="guardianAvatar">{c.relation || c.tel_name[0]}</div>
              <div className="guardianInfo">
                <strong>{c.tel_name}</strong>
                <span>{c.tel_num}</span>
              </div>
              <span className="guardianBadge">{c.tel_type}</span>
              <button
                className="guardianRemoveButton"
                onClick={() => setContacts(removeContact(c.tel_uuid))}
                aria-label={`${c.tel_name} 연락처 삭제`}
              >
                ×
              </button>
            </div>
          </div>
        ))}

        {addingContact ? (
          <div className="addContactForm">
            <input
              className="addContactInput"
              placeholder="이름"
              aria-label="이름"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <input
              className="addContactInput"
              placeholder="전화번호"
              aria-label="전화번호"
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submitContact()}
            />
            <div className="themeButtons">
              {['기본', '보조'].map((t) => (
                <button
                  key={t}
                  className={newType === t ? 'themeButton selected' : 'themeButton'}
                  onClick={() => setNewType(t)}
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="addContactActions">
              <button className="addContactCancel" onClick={() => setAddingContact(false)}>
                취소
              </button>
              <button
                className="addContactSubmit"
                disabled={!newName.trim() || !newPhone.trim()}
                onClick={submitContact}
              >
                추가
              </button>
            </div>
          </div>
        ) : (
          <button className="addGuardianButton" onClick={() => setAddingContact(true)}>
            <UserPlus size={18} />
            연락처 추가
          </button>
        )}
      </div>

      <div className="settingsCard">
        <h3>테마</h3>
        <ToggleGroup options={THEME_OPTIONS} value={theme} onChange={onThemeChange} label="테마" />
      </div>

      <div className="settingsCard">
        <h3>알림</h3>
        {NOTIF_ITEMS.map((n) => (
          <div className="settingToggleRow" key={n.key}>
            <div>
              <strong>{n.title}</strong>
              <span>{n.desc}</span>
            </div>
            <button
              role="switch"
              aria-checked={notif[n.key]}
              aria-label={n.title}
              className={notif[n.key] ? 'toggleSwitch on' : 'toggleSwitch'}
              onClick={() => toggleNotif(n.key)}
            >
              <span />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
