import { useEffect, useRef, useState } from 'react';
import {
  ChevronLeft,
  Sun,
  Moon,
  CircleCheck,
  TriangleAlert,
  ArrowUp,
  Home,
  Building2,
  Star,
  Crosshair,
  Users,
  Phone,
  ShieldCheck,
  Siren,
  MapPin,
} from 'lucide-react';
import { scoreGrade } from './useIsMobile';
import './MobileFlow.css';

// 안전점수 배지 — 화면 여러 곳(메인카드/최근검색/대안경로)에서 재사용
function ScoreBadge({ score, size = 'md' }) {
  const grade = scoreGrade(score);
  const Icon = score >= 60 ? CircleCheck : TriangleAlert;
  return (
    <div className={`mfScoreBadge mfScoreBadge--${size}`} style={{ background: grade.soft, color: grade.color }}>
      <Icon size={size === 'lg' ? 18 : 14} />
      <strong>{score}</strong>
      <span>{grade.label}</span>
    </div>
  );
}

/* ---------- 1. 온보딩 ---------- */

const FEATURES = [
  { icon: ShieldCheck, title: '안전도 기반 경로', desc: 'CCTV·보안등·안심벨·112 신고 데이터로 구간마다 점수를 계산합니다.' },
  { icon: Moon, title: '밤에는 다르게 계산', desc: '같은 길도 시간대에 따라 위험도가 달라집니다. 야간 조도를 반영합니다.' },
  { icon: Siren, title: '한 번에 도움요청', desc: '위험할 때 SOS 한 번으로 보호자와 112에 위치를 전송합니다.' },
];

export function Onboarding({ onDone }) {
  const handleAllow = () => {
    try {
      navigator.geolocation?.getCurrentPosition(onDone, onDone, { timeout: 4000 });
    } catch {
      onDone();
    }
  };

  return (
    <div className="mfScreen mfOnboarding">
      <div className="mfOnbIcon">
        <ShieldCheck size={34} color="#fff" />
      </div>

      <h1 className="mfOnbHeadline">
        밤길도 가까운 길보다
        <br />
        안전한 길로
      </h1>
      <p className="mfOnbSub">CCTV·보안등·안심벨·112 신고 데이터를 시간대별로 계산해 안전한 경로를 알려드립니다.</p>

      <ul className="mfOnbFeatures">
        {FEATURES.map((f) => (
          <li key={f.title}>
            <span className="mfOnbFeatureIcon">
              <f.icon size={18} />
            </span>
            <div>
              <strong>{f.title}</strong>
              <p>{f.desc}</p>
            </div>
          </li>
        ))}
      </ul>

      <div className="mfOnbPermCard">
        <strong>위치 권한이 필요합니다</strong>
        <p>현재 위치를 기준으로 주변 안전시설과 경로를 계산합니다.</p>
        <button className="mfPrimaryBtn" onClick={handleAllow}>
          앱 사용 중에만 허용
        </button>
        <button className="mfTextBtn" onClick={onDone}>
          나중에 설정하기
        </button>
      </div>
    </div>
  );
}

/* ---------- 2. 메인 지도 (하단시트 카드) ---------- */

export function MainMapCard({ onOpenInput }) {
  return (
    <div className="mfMainCard">
      <div className="mfMainCardTop">
        <div>
          <span className="mfCaption">현재 위치</span>
          <h2 className="mfLocationTitle">서울 마포구 서교동</h2>
        </div>
        <ScoreBadge score={68} />
      </div>

      <p className="mfMainCaption">야간(21시) 기준 · 반경 500m 내 CCTV 41대, 보안등 128개</p>

      <div className="mfQuickRow">
        <button className="mfQuickBtn" onClick={() => onOpenInput('망원동 396-12 (집)')}>
          <Home size={16} /> 집
        </button>
        <button className="mfQuickBtn" onClick={() => onOpenInput('강남 오피스 (회사)')}>
          <Building2 size={16} /> 회사
        </button>
      </div>

      <button className="mfPrimaryBtn mfMainCta" onClick={() => onOpenInput('')}>
        안전 길찾기
      </button>
    </div>
  );
}

/* ---------- 3. 경로 입력 ---------- */

const RECENTS = [
  { name: '연남동 501-9', sub: '서울 마포구 연남로 · 3시간 전', score: 82 },
  { name: '홍대입구역 2번출구', sub: '서울 마포구 양화로 · 어제', score: 76 },
  { name: '망원동 396-12 (집)', sub: '즐겨찾기', score: 84 },
  { name: '상수동 골목시장', sub: '서울 마포구 와우산로 · 3일 전', score: 58 },
];

export function RouteInputScreen({ initialDestination, onBack, onSelect }) {
  const [destination, setDestination] = useState(initialDestination || '');

  return (
    <div className="mfScreen">
      <header className="mfHeader">
        <button className="mfIconBtn" onClick={onBack} aria-label="뒤로">
          <ChevronLeft size={22} />
        </button>
        <h1>경로 설정</h1>
      </header>

      <div className="mfOdCard">
        <div className="mfOdRow">
          <span className="mfOdDotOrigin" />
          <span>현재 위치 · 홍대입구역 2번출구</span>
        </div>
        <div className="mfOdDivider" />
        <div className="mfOdRow">
          <MapPin size={16} color="#ff4b50" />
          <input
            className="mfOdInput"
            placeholder="어디로 갈까요?"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && destination && onSelect(destination, null)}
          />
        </div>
      </div>

      <div className="mfOdActions">
        <button className="mfOutlineBtn" disabled>
          <Crosshair size={16} /> 지도에서 찍기
        </button>
        <button className="mfOutlineBtn" disabled>
          <Star size={16} /> 즐겨찾기
        </button>
      </div>

      <h3 className="mfSectionLabel">최근 검색</h3>
      <div className="mfRecentList">
        {RECENTS.map((r) => (
          <button key={r.name} className="mfRecentRow" onClick={() => onSelect(r.name)}>
            <div className="mfRecentInfo">
              <strong>{r.name}</strong>
              <span>{r.sub}</span>
            </div>
            <ScoreBadge score={r.score} size="sm" />
          </button>
        ))}
      </div>
    </div>
  );
}

/* ---------- 4. 경로 결과 ---------- */

const ROUTE_OPTIONS = [
  { id: 'safe', name: '안전 우선 경로', score: 82, note: 'CCTV 12대 · 보안등 34개 · 대로변 위주', duration: 24, distance: 1.8 },
  { id: 'balanced', name: '균형 경로', score: 71, note: '어두운 구간 120m 포함', duration: 21, distance: 1.6 },
  { id: 'shortest', name: '최단 거리', score: 58, note: '어두운 골목 320m · 야간 신고 4건', duration: 18, distance: 1.4 },
];

export function RouteResultScreen({
  destination,
  safetyWeight,
  onSafetyWeightChange,
  timeMode,
  onTimeModeChange,
  selectedRouteId,
  onSelectRoute,
  onBack,
  onStart,
}) {
  const selected = ROUTE_OPTIONS.find((r) => r.id === selectedRouteId) ?? ROUTE_OPTIONS[0];
  const shortest = ROUTE_OPTIONS[ROUTE_OPTIONS.length - 1];

  return (
    <div className="mfScreen">
      <header className="mfHeader">
        <button className="mfIconBtn" onClick={onBack} aria-label="뒤로">
          <ChevronLeft size={22} />
        </button>
        <h1>홍대입구역 2번출구 → {destination || '목적지'}</h1>
      </header>

      <div className="mfSummaryCard">
        <ScoreBadge score={selected.score} size="lg" />
        <div>
          <strong>
            {selected.distance}km · 도보 {selected.duration}분
          </strong>
          <p>최단 대비 +{selected.duration - shortest.duration}분 · 어두운 구간 80m 회피</p>
        </div>
      </div>

      <div className="mfSliderBlock">
        <div className="mfSliderLabels">
          <span>거리 최우선</span>
          <span>안전 최우선</span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={safetyWeight}
          onChange={(e) => onSafetyWeightChange(Number(e.target.value))}
          className="mfSlider"
        />
        <span className="mfSliderValue">안전 우선 {safetyWeight}%</span>
      </div>

      <div className="mfToggleBg">
        <button
          className={timeMode === 'now' ? 'mfToggleItem active' : 'mfToggleItem'}
          onClick={() => onTimeModeChange('now')}
        >
          <Sun size={14} /> 지금
        </button>
        <button
          className={timeMode === 'night' ? 'mfToggleItem active' : 'mfToggleItem'}
          onClick={() => onTimeModeChange('night')}
        >
          <Moon size={14} /> 야간
        </button>
      </div>

      <h3 className="mfSectionLabel">대안 경로</h3>
      <div className="mfRouteList">
        {ROUTE_OPTIONS.map((r) => (
          <button
            key={r.id}
            className={r.id === selectedRouteId ? 'mfRouteOption selected' : 'mfRouteOption'}
            onClick={() => onSelectRoute(r.id)}
          >
            <ScoreBadge score={r.score} size="sm" />
            <div>
              <strong>{r.name}</strong>
              <span>{r.note}</span>
            </div>
            <div className="mfRouteMeta">
              <strong>{r.duration}분</strong>
              <span>{r.distance}km</span>
            </div>
          </button>
        ))}
      </div>

      <button className="mfPrimaryBtn mfMainCta" onClick={onStart}>
        안내 시작
      </button>
    </div>
  );
}

/* ---------- 5. 경로 상세 / 턴바이턴 ---------- */

const SEGMENTS = [
  { name: '어울마당로 · 260m', grade: '안전', note: 'CCTV 3대, 보안등 8개 · 유동인구 많음' },
  { name: '서교로 골목 · 180m', grade: '보통', note: '보안등 2개 · 야간 조도 낮음, 안심벨 40m' },
  { name: '동교로 뒷길 · 200m', grade: '주의', note: '어두운 구간 · 최근 6개월 야간 신고 4건' },
  { name: '연남로 · 340m', grade: '안전', note: '안심벨 1개, CCTV 5대 · 상가 밀집' },
];

const GRADE_COLOR = { 안전: '#22a06b', 보통: '#22a06b', 주의: '#efaa16', 위험: '#f34b52' };

export function RouteDetailScreen({ onEnd }) {
  const [sharing, setSharing] = useState(false);

  return (
    <div className="mfScreen">
      <div className="mfTurnBanner">
        <ArrowUp size={26} />
        <div>
          <strong>250m 직진</strong>
          <span>어울마당로 · 다음 좌회전까지</span>
        </div>
      </div>

      <h3 className="mfSectionLabel">구간별 안전 요인</h3>
      <div className="mfSegmentList">
        {SEGMENTS.map((s) => (
          <div className="mfSegmentRow" key={s.name}>
            <span className="mfSegmentBar" style={{ background: GRADE_COLOR[s.grade] }} />
            <div className="mfSegmentIcon" style={{ color: GRADE_COLOR[s.grade] }}>
              {s.grade === '주의' ? <TriangleAlert size={16} /> : <CircleCheck size={16} />}
            </div>
            <div>
              <strong>
                {s.name} · <span style={{ color: GRADE_COLOR[s.grade] }}>{s.grade}</span>
              </strong>
              <p>{s.note}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mfDetailActions">
        <button className="mfOutlineBtn mfFlex1" onClick={onEnd}>
          안내 종료
        </button>
        <button className="mfShareBtn mfFlex1_4" onClick={() => setSharing((v) => !v)}>
          <Users size={16} /> {sharing ? '공유 중' : '보호자 공유'}
        </button>
      </div>
    </div>
  );
}

/* ---------- 6. 도움요청 (SOS) ---------- */

const HOLD_MS = 3000;

export function SosFab({ onOpen }) {
  return (
    <button className="mfSosFab" onClick={onOpen} aria-label="긴급 도움요청">
      <Siren size={22} />
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
  const [sharing, setSharing] = useState(true);
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
    <div className="mfScrim">
      <div className="mfSosTop">
        <span className="mfSosEyebrow">긴급 도움요청</span>
        <p>
          {state === 'sent'
            ? '112와 보호자에게 위치가 전송되었습니다'
            : '3초간 눌러 112와 보호자에게 위치를 전송합니다'}
        </p>
      </div>

      <button
        className={`mfSosCircle ${state}`}
        onPointerDown={startPress}
        onPointerUp={cancelPress}
        onPointerLeave={cancelPress}
      >
        {state === 'sent' && <strong className="mfSosLabel">전송됨</strong>}
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

      <div className="mfGuardianCard">
        <Users size={18} />
        <div>
          <strong>보호자 실시간 위치 공유</strong>
          <span>엄마 · 김서연{sharing ? ' (공유 중)' : ''}</span>
        </div>
        <button
          className={sharing ? 'mfSwitch on' : 'mfSwitch'}
          onClick={() => setSharing((v) => !v)}
          aria-label="보호자 공유 토글"
        >
          <span />
        </button>
      </div>

      <h3 className="mfSectionLabel mfSectionLabelLight">주변 안전시설</h3>
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
  );
}
