import { useState } from 'react';
import { Lock, Plus, X } from 'lucide-react';
import { acceptInvite, createInvite, removeLink, setPermission, setSharing } from '../data/sharing';
import { useAuth } from '../hooks/useAuth';
import { useNow } from '../hooks/useNow';
import { useSharing } from '../hooks/useSharing';

// 설정 화면(PC·모바일 공용)의 "실시간 위치 공유" 카드 안쪽.
// 보호자(그룹장): 연결된 보호 대상마다 공유 켜기/끄기 · 끄기 권한 허용 · 연결 추가/해제
// 보호 대상(자녀·노약자): 기본은 공유 상태만 볼 수 있다. 보호자가 권한을 허용한 연결에서만 직접 켜고 끌 수 있다.
export function LocationSharing() {
  const { user } = useAuth();
  const { connections } = useSharing(user);

  if (!user) return <p className="shareHint">로그인하면 가족과 실시간 위치를 공유할 수 있어요.</p>;
  return user.role === 'protected' ? (
    <ProtectedView user={user} connections={connections} />
  ) : (
    <GuardianView user={user} connections={connections} />
  );
}

// 위치가 이만큼 안 오면 "오래 갱신되지 않았어요" 경고 (보호 대상 기기는 15초마다 다시 올린다)
const STALE_MS = 2 * 60 * 1000;

function ago(ms) {
  const sec = Math.max(0, Math.floor(ms / 1000));
  if (sec < 10) return '방금 전';
  if (sec < 60) return `${sec}초 전`;
  const min = Math.floor(sec / 60);
  return min < 60 ? `${min}분 전` : `${Math.floor(min / 60)}시간 전`;
}

// 보호자 화면의 상태 문구와, 오래 갱신되지 않았는지(stale)
function statusOf(c, now) {
  if (!c.sharing) return { text: c.changedBy === 'protected' ? '보호 대상이 공유를 껐어요' : '공유 꺼짐' };
  if (!c.location) return { text: '위치 확인 중…' };
  const age = now - c.location.ts;
  return age > STALE_MS
    ? { text: `${ago(age)} 위치 확인 · 오래 갱신되지 않았어요`, stale: true }
    : { text: `${ago(age)} 위치 확인`, on: true };
}

function GuardianView({ user, connections }) {
  const now = useNow(5000); // "n초 전" 문구를 5초마다 갱신
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  // 권한 검사는 data/sharing.js가 하고, 화면은 실패 메시지만 보여준다
  const run = (action) => {
    try {
      action();
      setError('');
      return true;
    } catch (e) {
      setError(e.message);
      return false;
    }
  };

  const status = (c) => statusOf(c, now);

  return (
    <>
      <p className="shareHint">연결한 보호 대상의 위치를 지도에서 실시간으로 볼 수 있어요. 공유는 여기서 켜고 끌 수 있어요.</p>
      {connections.length === 0 && <p className="shareHint">연결된 보호 대상이 없어요. 아래에서 연결 코드를 입력하세요.</p>}
      {connections.map((c) => (
        <div className="shareItem" key={c.otherId}>
          <div className="shareRow">
            <div className="shareInfo">
              <strong>{c.name}</strong>
              <span className={`shareStatus${status(c).on ? ' on' : ''}${status(c).stale ? ' stale' : ''}`}>{status(c).text}</span>
            </div>
            <button
              role="switch"
              aria-checked={c.sharing}
              aria-label={`${c.name} 위치 공유`}
              className={c.sharing ? 'toggleSwitch on' : 'toggleSwitch'}
              onClick={() => run(() => setSharing(user, c.otherId, !c.sharing))}
            >
              <span />
            </button>
            <button
              className="shareRemove"
              aria-label={`${c.name} 연결 해제`}
              onClick={() => window.confirm(`${c.name}님과의 연결을 해제할까요?`) && run(() => removeLink(user, c.otherId))}
            >
              <X size={15} />
            </button>
          </div>
          <label className="shareOption">
            <input
              type="checkbox"
              checked={c.canToggle}
              onChange={(e) => run(() => setPermission(user, c.otherId, e.target.checked))}
            />
            <span>{c.name}님이 직접 공유를 켜고 끌 수 있게 허용</span>
          </label>
        </div>
      ))}

      <div className="shareAdd">
        <input
          className="mfAddContactInput"
          inputMode="numeric"
          maxLength={6}
          placeholder="보호 대상의 연결 코드 6자리"
          aria-label="연결 코드"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
          onKeyDown={(e) => e.key === 'Enter' && code && run(() => acceptInvite(user, code)) && setCode('')}
        />
        <button
          className="shareAddButton"
          disabled={code.length !== 6}
          onClick={() => run(() => acceptInvite(user, code)) && setCode('')}
        >
          <Plus size={16} /> 연결
        </button>
      </div>
      {error && <p className="shareError">{error}</p>}
    </>
  );
}

function ProtectedView({ user, connections }) {
  const [invite, setInvite] = useState(null); // { code, expires }
  const now = useNow(invite ? 1000 : null); // 코드가 떠 있는 동안만 남은 시간을 1초마다 갱신
  const left = invite ? invite.expires - now : 0;
  const [error, setError] = useState('');

  const run = (action) => {
    try {
      action();
      setError('');
    } catch (e) {
      setError(e.message);
    }
  };

  const makeCode = () => {
    try {
      setInvite(createInvite(user));
      setError('');
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <>
      <p className="shareHint">보호자가 공유를 켜면 내 위치가 보호자에게 전달돼요. 공유 중에는 화면에 표시가 떠요.</p>
      {connections.length === 0 && <p className="shareHint">연결된 보호자가 없어요. 연결 코드를 만들어 보호자에게 알려주세요.</p>}
      {connections.map((c) => (
        <div className="shareItem" key={c.otherId}>
          <div className="shareRow">
            <div className="shareInfo">
              <strong>{c.name}</strong>
              <span className={c.sharing ? 'shareStatus on' : 'shareStatus'}>
                {c.sharing ? '내 위치를 공유 중' : '공유 꺼짐'}
              </span>
            </div>
            {/* 보호자가 권한을 허용한 연결에서만 스위치가 보인다 */}
            {c.canToggle ? (
              <button
                role="switch"
                aria-checked={c.sharing}
                aria-label={`${c.name}에게 위치 공유`}
                className={c.sharing ? 'toggleSwitch on' : 'toggleSwitch'}
                onClick={() => run(() => setSharing(user, c.otherId, !c.sharing))}
              >
                <span />
              </button>
            ) : (
              <Lock size={15} className="shareLockIcon" aria-label="보호자만 변경 가능" />
            )}
          </div>
        </div>
      ))}
      {connections.length > 0 && (
        <p className="shareLock">
          <Lock size={13} />
          {connections.every((c) => c.canToggle)
            ? '보호자가 허용해서 직접 켜고 끌 수 있어요.'
            : '위치 공유는 보호자만 켜고 끌 수 있어요. 보호자가 허용하면 직접 조절할 수 있어요.'}
        </p>
      )}

      <button className="shareAddButton shareCodeButton" onClick={makeCode}>
        <Plus size={16} /> 보호자 연결 코드 만들기
      </button>
      {invite && (
        <p className="shareCode">
          <strong>{invite.code}</strong>
          <span>
            {left > 0
              ? `보호자가 이 코드를 입력하면 연결돼요 · 남은 시간 ${Math.floor(left / 60000)}:${String(Math.floor((left % 60000) / 1000)).padStart(2, '0')}`
              : '코드가 만료됐어요. 다시 만들어주세요.'}
          </span>
        </p>
      )}
      {error && <p className="shareError">{error}</p>}
    </>
  );
}
