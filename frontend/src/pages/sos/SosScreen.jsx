import { useState, useEffect, useRef } from 'react';
import {
  Phone,
  ShieldCheck,
  Siren,
} from 'lucide-react';

const HOLD_MS = 3000;

export function SosFab({ onOpen }) {
  return (
    <button className="mfSosFab" onClick={onOpen} aria-label="긴급 도움요청">
      <Siren size={26} />
    </button>
  );
}

const NEARBY = [
  { name: '안심지킴이집 · 서교편의점', sub: '24시간 운영 중', dist: '80m', icon: ShieldCheck },
  { name: '안심벨 · 홍대입구역 3번출구', sub: '경보음 + 112 자동연결', dist: '140m', icon: Siren },
  { name: '마포경찰서 서교지구대', sub: '02-3149-XXXX', dist: '320m', icon: Phone },
];

export function SosOverlay({ onClose }) {
  const [state, setState] = useState('idle'); // idle | pressing | sent
  const [countdown, setCountdown] = useState(3);
  const timerRef = useRef(null);
  const startRef = useRef(0);

  useEffect(() => () => clearInterval(timerRef.current), []);

  const cancelPress = () => {
    clearInterval(timerRef.current);
    setState((s) => (s === 'sent' ? s : 'idle'));
    setCountdown(3);
  };

  const startPress = () => {
    setState('pressing');
    setCountdown(3);
    startRef.current = Date.now();
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startRef.current;
      const left = Math.max(0, Math.ceil((HOLD_MS - elapsed) / 1000));
      setCountdown(left);
      if (elapsed >= HOLD_MS) {
        clearInterval(timerRef.current);
        setState('sent');
      }
    }, 100);
  };

  return (
    <div className="mfSosScreen">
      <div className="mfSosTop">
        <span className="mfSosEyebrow">긴급 도움요청</span>
        <p>
          {state === 'sent'
            ? 'SOS 화면 테스트 완료 · 실제 전송은 되지 않았습니다'
            : state === 'pressing'
              ? `${countdown}초 후 SOS 화면 테스트가 완료됩니다`
              : '화면 예시입니다. 3초간 눌러 SOS 동작을 확인하세요'}
        </p>
      </div>

      <button
        className={`mfSosCircle ${state}`}
        onPointerDown={startPress}
        onPointerUp={cancelPress}
        onPointerLeave={cancelPress}
      >
        {state === 'sent' && <strong className="mfSosLabel">테스트 완료</strong>}
        {state === 'pressing' && (
          <>
            <strong className="mfSosCountdown">{countdown}</strong>
            <span className="mfSosLabel">SOS</span>
            <span className="mfSosHint">손을 떼면 취소</span>
          </>
        )}
        {state === 'idle' && (
          <>
            <span className="mfSosLabel">SOS</span>
            <span className="mfSosHint">3초간 누르기</span>
          </>
        )}
      </button>

      <div className="mfRouteSheet">
        <span className="mfGrabHandle" />

        <h3 className="mfSectionLabel">주변 안전시설</h3>
        <div className="mfNearbyList">
          {NEARBY.map((n) => (
            <div className="mfNearbyRow" key={n.name}>
              <n.icon size={16} />
              <div>
                <strong>{n.name}</strong>
                <span>{n.sub}</span>
              </div>
              <span className="mfNearbyDist">{n.dist}</span>
            </div>
          ))}
        </div>

        <button className="mfOutlineBtn mfCancelBtn" onClick={onClose}>
          취소
        </button>
      </div>
    </div>
  );
}

/* ---------- 7. 범죄주의구간 레이어 ---------- */
