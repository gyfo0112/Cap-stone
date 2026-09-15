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
  Bell,
  Route,
  Settings,
  UserPlus,
  Search,
  Camera,
  Lightbulb,
} from 'lucide-react';
import { scoreGrade } from './useIsMobile';
import { hasKakaoRestKey, searchPlaces } from './kakaoLocal';
import './MobileFlow.css';

// 안전점수 배지 — 화면 여러 곳(메인카드/최근검색/대안경로)에서 재사용.
// md(메인카드) = 아이콘+숫자+등급명, lg(경로결과 요약) = 숫자+등급명,
// sm(리스트용) = 숫자만 — 리스트에서 여러 개 나열될 때 안 복잡하게.
function ScoreBadge({ score, size = 'md' }) {
  const grade = scoreGrade(score);
  const Icon = score >= 80 ? CircleCheck : TriangleAlert;
  return (
    <div className={`mfScoreBadge mfScoreBadge--${size}`} style={{ background: grade.soft, color: grade.color }}>
      {size === 'md' && <Icon size={14} />}
      <strong>{score}</strong>
      {size !== 'sm' && <span>{grade.label}</span>}
    </div>
  );
}

// 하단시트 그랩핸들을 탭하거나 위/아래로 드래그해서 접고 펼치는 훅.
// 드래그로 이미 토글됐으면 뒤이어 발생하는 click은 무시해서 두 번 안 토글되게 한다.
function useSheetToggle(initial = true) {
  const [expanded, setExpanded] = useState(initial);
  const dragStartY = useRef(null);
  const draggedRef = useRef(false);

  const onPointerDown = (e) => {
    dragStartY.current = e.clientY;
    draggedRef.current = false;
  };
  const onPointerMove = (e) => {
    if (dragStartY.current == null || draggedRef.current) return;
    const delta = e.clientY - dragStartY.current;
    if (delta < -30) {
      setExpanded(true);
      draggedRef.current = true;
    } else if (delta > 30) {
      setExpanded(false);
      draggedRef.current = true;
    }
  };
  const endDrag = () => {
    dragStartY.current = null;
  };
  const onClick = () => {
    if (draggedRef.current) {
      draggedRef.current = false;
      return;
    }
    setExpanded((v) => !v);
  };

  return [
    expanded,
    { onPointerDown, onPointerMove, onPointerUp: endDrag, onPointerCancel: endDrag, onClick },
  ];
}

// 하단 탭바 (지도 / 경로 / [SOS 자리] / 도움요청 / 설정)
const TABS = [
  { key: 'map', label: '지도', icon: MapPin },
  { key: 'route', label: '경로', icon: Route },
  { key: 'sos', label: '', icon: null },
  { key: 'help', label: '도움요청', icon: Bell },
  { key: 'settings', label: '설정', icon: Settings },
];

export function MobileTabBar({ active, onSelect }) {
  return (
    <nav className="mfTabBar">
      {TABS.map((t) =>
        t.key === 'sos' ? (
          <span key="sos" className="mfTabSpacer" aria-hidden="true" />
        ) : (
          <button
            key={t.key}
            className={active === t.key ? 'mfTabItem active' : 'mfTabItem'}
            onClick={() => onSelect(t.key)}
          >
            <t.icon size={20} />
            <span>{t.label}</span>
          </button>
        ),
      )}
    </nav>
  );
}

// 지도 위 검색바 + 안전시설 오버레이 칩 (메인 지도 탭에서만 표시)
const OVERLAY_CHIPS = [
  { key: 'cctv', label: 'CCTV', icon: Camera },
  { key: 'streetlight', label: '보안등', icon: Lightbulb },
  { key: 'safetyBell', label: '안심벨', icon: Bell },
  { key: 'crimeZone', label: '범죄주의구간', icon: TriangleAlert },
];

export function MapSearchOverlay({ cctvOn, onToggleCctv, onOpenCrime, onOpenInput }) {
  const handleChip = (key) => {
    if (key === 'cctv') onToggleCctv();
    if (key === 'crimeZone') onOpenCrime();
    // 보안등·안심벨 데이터는 아직 없어서 비활성
  };

  return (
    <div className="mfMapOverlay">
      <button className="mfSearchBar" onClick={() => onOpenInput('')}>
        <Search size={18} />
        <span>어디로 갈까요?</span>
      </button>

      <div className="mfChipRow">
        {OVERLAY_CHIPS.map((c) => {
          const disabled = c.key === 'streetlight' || c.key === 'safetyBell';
          const active = c.key === 'cctv' && cctvOn;
          return (
            <button
              key={c.key}
              className={active ? 'mfChip active' : 'mfChip'}
              disabled={disabled}
              onClick={() => handleChip(c.key)}
            >
              <c.icon size={15} /> {c.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// 지도 우측 컨트롤 — 지금은 "현재 위치로 이동" 하나. 레이어 버튼 등은 필요해지면 추가.
// bottomOffset은 실제 하단시트 높이+여백(px) — 시트 바로 위에 붙이기 위해 App에서 측정해 내려줌.
export function MapControls({ onLocate, bottomOffset }) {
  return (
    <div className="mfMapControls" style={bottomOffset ? { bottom: bottomOffset } : undefined}>
      <button className="mfMapControlBtn" onClick={onLocate} aria-label="현재 위치로 이동">
        <Crosshair size={20} />
      </button>
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

// 실제 시각 기준으로 "주간/야간" 문구만 맞춤 — 안전점수 자체는 아직 mock.
function timeOfDayLabel() {
  const hour = new Date().getHours();
  const isNight = hour >= 19 || hour < 6;
  return `${isNight ? '야간' : '주간'}(${hour}시) 기준`;
}

export function MainMapCard({ onOpenInput, locationLabel }) {
  return (
    <div className="mfMainCard">
      <div className="mfMainCardTop">
        <div>
          <span className="mfCaption">현재 위치</span>
          <h2 className="mfLocationTitle">{locationLabel || '서울 마포구 서교동'}</h2>
        </div>
        <ScoreBadge score={68} />
      </div>

      <p className="mfMainCaption">{timeOfDayLabel()} · 반경 500m 내 CCTV 41대, 보안등 128개</p>

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

export function RouteInputScreen({ initialDestination, originLabel, onBack, onSelect }) {
  const [destination, setDestination] = useState(initialDestination || '');
  const [places, setPlaces] = useState(null); // 마지막으로 완료된 검색 결과
  const [placesQuery, setPlacesQuery] = useState(''); // places가 어떤 검색어의 결과인지
  const [searching, setSearching] = useState(false);
  const query = destination.trim();
  const canSearch = hasKakaoRestKey();
  const showingSearch = Boolean(query) && canSearch;

  // 카카오 REST 키가 있으면 실제 장소 검색(디바운스), 없으면 mock 최근검색만 필터링.
  useEffect(() => {
    if (!query || !canSearch) return undefined;
    let cancelled = false;
    const timer = setTimeout(() => {
      setSearching(true);
      searchPlaces(query)
        .then((r) => {
          if (cancelled) return;
          setPlaces(r);
          setPlacesQuery(query);
        })
        .catch(() => {
          if (cancelled) return;
          setPlaces([]);
          setPlacesQuery(query);
        })
        .finally(() => !cancelled && setSearching(false));
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, canSearch]);

  const filtered = query ? RECENTS.filter((r) => r.name.includes(query)) : RECENTS;
  const resultsReady = showingSearch && !searching && placesQuery === query;

  return (
    <div className="mfScreen mfScreenTabbed">
      <header className="mfHeader">
        <button className="mfIconBtn" onClick={onBack} aria-label="뒤로">
          <ChevronLeft size={22} />
        </button>
        <h1>경로 설정</h1>
      </header>

      <div className="mfOdCard">
        <div className="mfOdRow">
          <span className="mfOdDotOrigin" />
          <span>현재 위치 · {originLabel || '홍대입구역 2번출구'}</span>
        </div>
        <div className="mfOdDivider" />
        <div className="mfOdRow">
          <MapPin size={16} color="#ff4b50" />
          <input
            className="mfOdInput"
            placeholder="어디로 갈까요?"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && destination && onSelect(destination)}
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

      {showingSearch ? (
        <>
          <h3 className="mfSectionLabel">검색 결과</h3>
          <div className="mfRecentList">
            {!resultsReady && <p className="mfEmptyHint">검색 중…</p>}
            {resultsReady &&
              places.map((p) => (
                <button key={p.id} className="mfRecentRow" onClick={() => onSelect(p.name)}>
                  <div className="mfRecentInfo">
                    <strong>{p.name}</strong>
                    <span>{p.address}</span>
                  </div>
                </button>
              ))}
            {resultsReady && places.length === 0 && (
              <p className="mfEmptyHint">
                일치하는 장소가 없어요. Enter를 누르면 입력한 위치로 길찾기를 시작합니다.
              </p>
            )}
          </div>
        </>
      ) : (
        <>
          <h3 className="mfSectionLabel">{query ? '검색 결과' : '최근 검색'}</h3>
          <div className="mfRecentList">
            {filtered.map((r) => (
              <button key={r.name} className="mfRecentRow" onClick={() => onSelect(r.name)}>
                <div className="mfRecentInfo">
                  <strong>{r.name}</strong>
                  <span>{r.sub}</span>
                </div>
                <ScoreBadge score={r.score} size="sm" />
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="mfEmptyHint">
                일치하는 검색 결과가 없어요. Enter를 누르면 입력한 위치로 길찾기를 시작합니다.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/* ---------- 4. 경로 결과 ---------- */

const ROUTE_OPTIONS = [
  { id: 'safe', name: '안전 우선 경로', score: 82, note: 'CCTV 12대 · 보안등 34개 · 대로변 위주', duration: 24, distance: 1.8 },
  { id: 'balanced', name: '균형 경로', score: 71, note: '어두운 구간 120m 포함', duration: 21, distance: 1.6 },
  { id: 'shortest', name: '최단 거리', score: 58, note: '어두운 골목 320m · 야간 신고 4건', duration: 18, distance: 1.4 },
];

// 목적지가 바뀔 때마다 이 컴포넌트 자체를 새로 마운트해서(key=destination)
// "계산 중" 스켈레톤을 다시 보여준다 — 아직 실제 경로 API가 없어서 결과는
// mock이지만, 붙일 때를 위해 로딩 자리는 미리 만들어 둔다.
export function RouteResultScreen(props) {
  return <RouteResultBody key={props.destination} {...props} />;
}

function RouteResultBody({
  destination,
  originLabel,
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
  const timeDiff = selected.duration - shortest.duration;

  const [ready, setReady] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setReady(true), 550);
    return () => clearTimeout(timer);
  }, []);

  const [expanded, sheetHandlers] = useSheetToggle(true);

  const header = (
    <div className="mfFloatingHeader">
      <button className="mfIconBtn" onClick={onBack} aria-label="뒤로">
        <ChevronLeft size={22} />
      </button>
      <h1>
        {originLabel || '홍대입구역 2번출구'} → {destination || '목적지'}
      </h1>
    </div>
  );

  if (!ready) {
    return (
      <div className="mfRouteScreen">
        {header}
        <div className="mfRouteSheet">
          <span className="mfGrabHandle" />
          <div className="mfSkeleton mfSkeletonCard" />
          <div className="mfSkeleton mfSkeletonBlock" />
          <div className="mfSkeleton" style={{ height: 40, marginBottom: 18 }} />
          <div className="mfSkeleton mfSkeletonRow" />
          <div className="mfSkeleton mfSkeletonRow" />
          <div className="mfSkeleton mfSkeletonRow" />
        </div>
      </div>
    );
  }

  return (
    <div className="mfRouteScreen">
      {header}

      <div className="mfRouteSheet">
        <button
          className="mfGrabHandleZone"
          aria-label={expanded ? '시트 접기' : '시트 펼치기'}
          aria-expanded={expanded}
          {...sheetHandlers}
        >
          <span className="mfGrabHandle" />
        </button>

        <div className="mfSummaryCard">
          <ScoreBadge score={selected.score} size="lg" />
          <div>
            <strong>
              {selected.distance}km · 도보 {selected.duration}분
            </strong>
            <p>{timeDiff === 0 ? '가장 빠른 경로예요' : `최단 대비 +${timeDiff}분`} · 어두운 구간 80m 회피</p>
          </div>
        </div>

        <div className={expanded ? 'mfCollapsible' : 'mfCollapsible collapsed'}>
          <div className="mfCollapsibleInner">
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
              <div className="mfSliderFooter">
                <span className="mfSliderValue">안전 우선 {safetyWeight}%</span>
                <div className="mfToggleBg mfToggleBgCompact">
                  <button
                    className={timeMode === 'now' ? 'mfToggleItem active' : 'mfToggleItem'}
                    onClick={() => onTimeModeChange('now')}
                  >
                    <Sun size={12} /> 지금
                  </button>
                  <button
                    className={timeMode === 'night' ? 'mfToggleItem active' : 'mfToggleItem'}
                    onClick={() => onTimeModeChange('night')}
                  >
                    <Moon size={12} /> 야간
                  </button>
                </div>
              </div>
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
        </div>
      </div>
    </div>
  );
}

/* ---------- 5. 경로 상세 / 턴바이턴 ---------- */

const SEGMENTS = [
  { name: '어울마당로', meters: 260, grade: '안전', note: 'CCTV 3대, 보안등 8개 · 유동인구 많음' },
  { name: '서교로 골목', meters: 180, grade: '보통', note: '보안등 2개 · 야간 조도 낮음, 안심벨 40m' },
  { name: '동교로 뒷길', meters: 200, grade: '주의', note: '어두운 구간 · 최근 6개월 야간 신고 4건' },
  { name: '연남로', meters: 340, grade: '안전', note: '안심벨 1개, CCTV 5대 · 상가 밀집' },
];

const GRADE_COLOR = { 안전: '#22a06b', 보통: '#9a6910', 주의: '#c1631a', 위험: '#f34b52' };
const GRADE_SOFT = { 안전: '#e3f5ec', 보통: '#fff7da', 주의: '#ffe9d6', 위험: '#fdecec' };

export function RouteDetailScreen({ onEnd }) {
  const [sharing, setSharing] = useState(false);
  const [expanded, sheetHandlers] = useSheetToggle(true);

  return (
    <div className="mfRouteScreen">
      <div className="mfTurnBanner">
        <ArrowUp size={26} />
        <div>
          <strong>250m 직진</strong>
          <span>어울마당로 · 다음 좌회전까지</span>
        </div>
      </div>

      <div className="mfRouteSheet">
        <button
          className="mfGrabHandleZone"
          aria-label={expanded ? '시트 접기' : '시트 펼치기'}
          aria-expanded={expanded}
          {...sheetHandlers}
        >
          <span className="mfGrabHandle" />
        </button>

        <div className="mfSegmentHeader">
          <h3 className="mfSectionLabel" style={{ margin: 0 }}>
            구간별 안전 요인
          </h3>
          <span className="mfSegmentSummary">총 {SEGMENTS.length}구간 · 1.8km</span>
        </div>

        <div className={expanded ? 'mfCollapsible' : 'mfCollapsible collapsed'}>
          <div className="mfCollapsibleInner">
            <div className="mfSegmentList">
              {SEGMENTS.map((s) => (
                <div className="mfSegmentRow" key={s.name}>
                  <span className="mfSegmentBar" style={{ background: GRADE_COLOR[s.grade] }} />
                  <div
                    className="mfSegmentIcon"
                    style={{ color: GRADE_COLOR[s.grade], background: GRADE_SOFT[s.grade] }}
                  >
                    {s.grade === '안전' ? <CircleCheck size={16} /> : <TriangleAlert size={16} />}
                  </div>
                  <div className="mfSegmentBody">
                    <div className="mfSegmentTitleRow">
                      <strong>
                        {s.name} · {s.meters}m
                      </strong>
                      <span
                        className="mfSegmentGradeTag"
                        style={{ color: GRADE_COLOR[s.grade], background: GRADE_SOFT[s.grade] }}
                      >
                        {s.grade}
                      </span>
                    </div>
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
        </div>
      </div>
    </div>
  );
}

/* ---------- 6. 도움요청 (SOS) ---------- */

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
    <div className="mfSosScreen">
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

      <div className="mfRouteSheet">
        <span className="mfGrabHandle" />

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

// 등급 10칸 색상은 기존 팔레트의 안전(초록)-주의(옐로우)-위험(레드) 세 축 사이를
// 손으로 보간한 값 — 디자인 원본 팔레트를 그대로 쓰지 않고 우리 색으로 재구성.
const CRIME_LEGEND = [
  '#22a06b',
  '#3aa966',
  '#55b25c',
  '#7ab84c',
  '#a3b93c',
  '#c9b02e',
  '#dda32a',
  '#e69126',
  '#ec7a2a',
  '#f34b52',
];

export function CrimeLayerScreen({ onClose }) {
  const [enabled, setEnabled] = useState(true);
  const [opacity, setOpacity] = useState(60);

  return (
    <div className="mfScreen mfScreenTabbed">
      <header className="mfHeader">
        <button className="mfIconBtn" onClick={onClose} aria-label="뒤로">
          <ChevronLeft size={22} />
        </button>
        <h1>범죄주의구간</h1>
      </header>

      <div className="mfCrimeTopCard">
        <div className="mfCrimeTopIcon">
          <TriangleAlert size={18} />
        </div>
        <div className="mfCrimeTopText">
          <strong>범죄주의구간</strong>
          <span>경찰청 격자 WMS · 2026.08 기준</span>
        </div>
        <button
          className={enabled ? 'mfSwitch on' : 'mfSwitch'}
          onClick={() => setEnabled((v) => !v)}
          aria-label="레이어 토글"
        >
          <span />
        </button>
      </div>

      <h3 className="mfSectionLabel">10등급 범례</h3>
      <div className="mfLegend">
        {CRIME_LEGEND.map((c, i) => (
          <div key={c} className="mfLegendCell" style={{ background: c }}>
            {i + 1}
          </div>
        ))}
      </div>
      <p className="mfLegendCaption">1등급 안전 · 5·6등급 보통 · 10등급 위험</p>

      <div className="mfCrimeAreaCard">
        <strong>이 지역 8등급 · 주의</strong>
        <p>
          서교동 일부 격자는 야간 절도·폭력 신고가 마포구 평균보다 높습니다. 22시 이후
          어울마당로 대로변 이용을 권장합니다.
        </p>
      </div>

      <h3 className="mfSectionLabel">레이어 투명도</h3>
      <input
        type="range"
        min={0}
        max={100}
        value={opacity}
        onChange={(e) => setOpacity(Number(e.target.value))}
        className="mfSlider mfSliderNeutral"
      />
      <span className="mfSliderValue">{opacity}%</span>

      <p className="mfCrimeNote">
        ⓘ 실제 경찰청 WMS 타일 연동 전 목업입니다. 데이터 파트 연동 후 지도 위 실시간
        오버레이로 교체될 예정입니다.
      </p>
    </div>
  );
}

/* ---------- 8. 설정 ---------- */

const GUARDIANS = [
  { relation: '엄마', name: '김서연', phone: '010-2841-XXXX', tag: '기본' },
  { relation: '친구', name: '이지훈', phone: '010-7745-XXXX', tag: '보조' },
];

const THEME_OPTIONS = [
  { key: 'light', label: '라이트' },
  { key: 'dark', label: '다크' },
  { key: 'system', label: '시스템' },
];

const NOTIF_ITEMS = [
  { key: 'zoneEntry', title: '위험 구간 진입 알림', desc: '주의구간 100m 이내 진입 시 진동' },
  { key: 'nightRecalc', title: '야간 경로 재계산 알림', desc: '일몰 후 저장 경로 안전도 변동 시' },
  { key: 'arrival', title: '보호자 도착 알림', desc: '목적지 도착 시 보호자에게 자동 전송' },
];

export function SettingsScreen({ safetyWeight, onSafetyWeightChange }) {
  const [theme, setTheme] = useState('light');
  const [notif, setNotif] = useState({ zoneEntry: true, nightRecalc: true, arrival: false });

  const toggleNotif = (key) => setNotif((n) => ({ ...n, [key]: !n[key] }));

  return (
    <div className="mfScreen mfScreenTabbed">
      <h1 className="mfPageTitle">설정</h1>

      <div className="mfSettingsCard">
        <strong>기본 안전 우선도</strong>
        <p>모든 경로 계산의 기본값으로 사용됩니다.</p>
        <input
          type="range"
          min={0}
          max={100}
          value={safetyWeight}
          onChange={(e) => onSafetyWeightChange(Number(e.target.value))}
          className="mfSlider"
        />
        <div className="mfSliderLabels">
          <span>거리 최우선</span>
          <span>균형 (기본)</span>
          <span>안전 최우선</span>
        </div>
      </div>

      <div className="mfSettingsCard">
        <strong>보호자 연락처</strong>
        {GUARDIANS.map((g) => (
          <div className="mfContactRow" key={g.name}>
            <span className="mfContactAvatar">{g.relation}</span>
            <div className="mfContactInfo">
              <strong>{g.name}</strong>
              <span>{g.phone}</span>
            </div>
            <span className="mfContactTag">{g.tag}</span>
          </div>
        ))}
        <button className="mfTextBtn mfAddContact" disabled>
          <UserPlus size={15} /> 연락처 추가
        </button>
      </div>

      <div className="mfSettingsCard">
        <strong>테마</strong>
        <div className="mfSegment">
          {THEME_OPTIONS.map((t) => (
            <button
              key={t.key}
              className={theme === t.key ? 'mfSegmentItem active' : 'mfSegmentItem'}
              onClick={() => setTheme(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>
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
