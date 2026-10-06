import { useState, useEffect, useRef } from 'react';
import {
  ArrowUpDown,
  Camera,
  CircleCheck,
  Clock3,
  Lightbulb,
  LocateFixed,
  MapPin,
  PersonStanding,
  Search,
  ShieldCheck,
  Star,
  TriangleAlert,
  X,
} from 'lucide-react';
import { hasKakaoRestKey, searchPlaces } from '../../api/kakaoLocal';
import { addRecent, clearRecents, getRecents, removeRecent } from '../../data/recents';
import { GRADE_COLOR, GRADE_SOFT, ROUTE_OPTIONS, SEGMENTS } from '../../data/routeData';
import { QuickPlaces } from '../../components/QuickPlaces';
import { useFavorites } from '../../hooks/useFavorites';
import { scoreGrade } from '../../hooks/useIsMobile';

// 데스크탑의 3개 "경로 옵션" 버튼을 mock 대안 경로 2개(safe/shortest) 중 하나에 매핑한다.
// "도보 전용"은 두 경로 모두 도보라 딱 맞는 대응이 없어 안전 우선 경로로 눌러뒀다.
const ROUTE_MODES = [
  { id: 'safe', route: 'safe', icon: ShieldCheck, label: '안전 우선', desc: 'CCTV, 가로등 고려' },
  { id: 'shortest', route: 'shortest', icon: Clock3, label: '빠른 길', desc: '최단 시간 경로' },
  { id: 'walk', route: 'safe', icon: PersonStanding, label: '도보 전용', desc: '걸어가는 경로' },
];

export function RoutePanel({ originLabel, routePriority, onStartNavigation }) {
  const [origin, setOrigin] = useState(originLabel || '현재 위치');
  // 이 패널이 항상 마운트돼 있어서(탭 전환에도 검색상태 유지) 첫 렌더 시점엔
  // GPS 주소가 아직 안 왔을 수 있다 — 사용자가 직접 수정하기 전까지는 계속 따라간다.
  const originTouched = useRef(false);
  useEffect(() => {
    if (!originTouched.current && originLabel) setOrigin(originLabel);
  }, [originLabel]);
  const [destination, setDestination] = useState('');
  const [places, setPlaces] = useState([]);
  const [searching, setSearching] = useState(false);
  // 경로 옵션 기본값 = 설정의 기본 안전 우선도(ROUTE_MODES id가 우선도 key와 같음).
  // 패널이 항상 마운트돼 있으니 설정에서 바꾸면 그 값으로 다시 맞춘다.
  const [selectedMode, setSelectedMode] = useState(routePriority);
  const [prevPriority, setPrevPriority] = useState(routePriority);
  if (prevPriority !== routePriority) {
    setPrevPriority(routePriority);
    setSelectedMode(routePriority);
  }
  const [selectedRouteId, setSelectedRouteId] = useState(routePriority);
  const [resultsReady, setResultsReady] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [notice, setNotice] = useState('');
  // 최근 검색 — 모바일 경로설정 화면과 같은 저장소(recents.js)라 PC·모바일 기록이 공유된다
  const [recents, setRecents] = useState(getRecents);
  // 즐겨찾기 — 모바일 경로설정 화면과 같은 저장소(백엔드 또는 mock). 검색 추천의 별표로 추가/해제
  const { favorites, needLogin: favNeedLogin, error: favError, isFavorite, toggle: toggleFavorite, remove: removeFavorite } =
    useFavorites();
  const [showFavorites, setShowFavorites] = useState(false); // 집/회사 아래 즐겨찾기 목록 펼치기
  // 추천 목록에서 고른 장소 — 고른 뒤엔 목록을 다시 띄우지 않고, 최근 검색에 주소를 같이 남긴다
  const [pickedPlace, setPickedPlace] = useState(null);

  // 네이버 지도처럼 출발지/도착지 입력창을 눌렀을 때만 아래에 목록(최근 검색·검색 추천)을 띄운다
  const [activeField, setActiveField] = useState(null); // null | 'origin' | 'dest'

  // 출발지에서 고른 장소 — 도착지의 pickedPlace와 같은 역할(고른 뒤엔 추천 목록을 다시 띄우지 않음)
  const [pickedOrigin, setPickedOrigin] = useState(null);

  const query = destination.trim();
  const canSearch = hasKakaoRestKey();
  // 눌러둔 입력창(출발지/도착지)에 글자를 치면 그 글자로 카카오 검색 추천을 띄운다.
  // 출발지가 기본값(현재 위치 주소)이거나 이미 고른 장소면 검색하지 않고 최근 검색을 보여준다.
  const activeText = (activeField === 'origin' ? origin : destination).trim();
  const picked = activeField === 'origin' ? pickedOrigin : pickedPlace;
  const isDefaultOrigin = activeField === 'origin' && (activeText === (originLabel || '') || activeText === '현재 위치');
  const showSuggestions = Boolean(activeField) && activeText && canSearch && picked?.name !== activeText && !isDefaultOrigin;

  // 목록에서 고르거나 Enter/Esc를 누르면 목록을 닫고 입력창 포커스도 뺀다
  const closeDropdown = () => {
    setActiveField(null);
    document.activeElement?.blur();
  };

  // 입력창 오른쪽 ✕ — 한 번에 비우고 그 칸에 포커스를 남겨 최근 검색 목록이 바로 뜨게 한다
  const originInputRef = useRef(null);
  const destInputRef = useRef(null);
  const clearOrigin = () => {
    originTouched.current = true;
    setOrigin('');
    setPickedOrigin(null);
    originInputRef.current?.focus();
  };
  const clearDestination = () => {
    setDestination('');
    setPickedPlace(null);
    destInputRef.current?.focus();
  };

  // 실제 카카오 장소 검색 (모바일 경로설정 화면과 동일한 방식)
  useEffect(() => {
    if (!showSuggestions) return undefined;
    let cancelled = false;
    const timer = setTimeout(() => {
      setSearching(true);
      searchPlaces(activeText)
        .then((r) => !cancelled && setPlaces(r))
        .catch(() => !cancelled && setPlaces([]))
        .finally(() => !cancelled && setSearching(false));
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [activeText, showSuggestions]);

  const pickPlace = (place) => {
    if (activeField === 'origin') {
      originTouched.current = true;
      setOrigin(place.name);
      setPickedOrigin(place);
    } else {
      setDestination(place.name);
      setPickedPlace(place);
    }
    setPlaces([]);
    closeDropdown();
  };

  // 출발지 목록: 현재 위치로 되돌리기 / 최근 검색 장소를 출발지로
  const pickOrigin = (name) => {
    originTouched.current = name !== null;
    setOrigin(name ?? (originLabel || '현재 위치'));
    setPickedOrigin(name === null ? null : { name });
    closeDropdown();
  };

  const swap = () => {
    originTouched.current = true;
    setOrigin(destination);
    setDestination(origin);
    setPlaces([]);
  };

  const runSearch = (name = query) => {
    if (!name) {
      setNotice('도착지를 입력해주세요.');
      return;
    }
    setNotice('');
    closeDropdown();
    setRecents(addRecent({ name, sub: pickedPlace?.name === name ? pickedPlace.address : '' }));
    setSelectedRouteId(ROUTE_MODES.find((m) => m.id === selectedMode).route);
    setResultsReady(true);
    setShowDetail(false);
  };

  // 최근 검색을 누르면 도착지에 넣고 바로 경로 검색
  const searchRecent = (r) => {
    setDestination(r.name);
    setPickedPlace({ name: r.name, address: r.sub });
    runSearch(r.name);
  };

  const selectedRoute = ROUTE_OPTIONS.find((r) => r.id === selectedRouteId) ?? ROUTE_OPTIONS[0];
  const grade = scoreGrade(selectedRoute.score);

  return (
    <div className="panelContent">
      <h1>경로 설정</h1>

      <p className="subtitle">더 안전한 길, 함께 만들어가는 우리 동네</p>

      <div className="routeSearchBox">
        <div className={activeField ? 'locationBox focused' : 'locationBox'}>
          <div className="locationInput">
            <span className="dot blue"></span>
            <input
              ref={originInputRef}
              placeholder="출발지 입력"
              aria-label="출발지 입력"
              value={origin}
              onFocus={() => setActiveField('origin')}
              onBlur={() => setActiveField(null)}
              onKeyDown={(e) => e.key === 'Escape' && closeDropdown()}
              onChange={(e) => {
                originTouched.current = true;
                setOrigin(e.target.value);
                setPickedOrigin(null);
              }}
            />
            {origin && (
              <button
                className="locationClear"
                onMouseDown={(e) => e.preventDefault()}
                onClick={clearOrigin}
                aria-label="출발지 지우기"
              >
                <X size={13} />
              </button>
            )}
          </div>

          <div className="divider"></div>

          <div className="locationInput">
            <span className="dot red"></span>
            <input
              ref={destInputRef}
              placeholder="도착지 입력"
              aria-label="도착지 입력"
              value={destination}
              onFocus={() => setActiveField('dest')}
              onBlur={() => setActiveField(null)}
              onChange={(e) => setDestination(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') runSearch();
                if (e.key === 'Escape') closeDropdown();
              }}
            />
            {destination && (
              <button
                className="locationClear"
                onMouseDown={(e) => e.preventDefault()}
                onClick={clearDestination}
                aria-label="도착지 지우기"
              >
                <X size={13} />
              </button>
            )}
          </div>

          <button className="swap" onClick={swap} aria-label="출발지/도착지 바꾸기">
            <ArrowUpDown size={18} />
          </button>
        </div>

        {/* 입력창을 눌렀을 때만 뜨는 목록. mousedown을 막아야 항목을 누를 때 입력창 blur로 먼저 닫히지 않는다 */}
        {activeField && (showSuggestions || !query || activeField === 'origin') && (
          <div className="routeDropdown" onMouseDown={(e) => e.preventDefault()}>
            {showSuggestions ? (
              <>
                {searching && <div className="routeDropEmpty">검색 중…</div>}
                {!searching && places.length === 0 && <div className="routeDropEmpty">검색 결과가 없습니다</div>}
                {!searching &&
                  places.map((p) => (
                    <div className="routeDropRow" key={p.id}>
                      <button className="routeDropItem" onClick={() => pickPlace(p)}>
                        <MapPin size={18} className="routeDropIcon" />
                        <span className="routeDropText">
                          <strong>{p.name}</strong>
                          <span>{p.address}</span>
                        </span>
                      </button>
                      <button
                        className={isFavorite(p.name) ? 'routeDropRemove routeDropStar active' : 'routeDropRemove routeDropStar'}
                        onClick={() => toggleFavorite(p)}
                        aria-label={isFavorite(p.name) ? `${p.name} 즐겨찾기 해제` : `${p.name} 즐겨찾기 추가`}
                      >
                        <Star size={15} fill={isFavorite(p.name) ? 'currentColor' : 'none'} />
                      </button>
                    </div>
                  ))}
              </>
            ) : (
              <>
                {activeField === 'origin' && (
                  <button className="routeDropItem" onClick={() => pickOrigin(null)}>
                    <LocateFixed size={18} className="routeDropIcon routeDropIconAccent" />
                    <span className="routeDropText">
                      <strong>현재 위치</strong>
                      {originLabel && <span>{originLabel}</span>}
                    </span>
                  </button>
                )}
                {favorites.length > 0 && <div className="routeDropLabel">즐겨찾기</div>}
                {favorites.map((f) => (
                  <div className="routeDropRow" key={f.marker_uuid}>
                    <button
                      className="routeDropItem"
                      onClick={() =>
                        activeField === 'origin' ? pickOrigin(f.marker_name) : searchRecent({ name: f.marker_name, sub: '' })
                      }
                    >
                      <Star size={18} className="routeDropIcon routeDropIconAccent" fill="currentColor" />
                      <span className="routeDropText">
                        <strong>{f.marker_name}</strong>
                      </span>
                    </button>
                    <button
                      className="routeDropRemove routeDropStar active"
                      onClick={() => removeFavorite(f.marker_uuid)}
                      aria-label={`${f.marker_name} 즐겨찾기 해제`}
                    >
                      <Star size={15} fill="currentColor" />
                    </button>
                  </div>
                ))}
                {recents.length === 0 && favorites.length === 0 && (
                  <div className="routeDropEmpty">최근 검색한 장소가 없어요.</div>
                )}
                {recents.map((r) => (
                  <div className="routeDropRow" key={r.name}>
                    <button
                      className="routeDropItem"
                      onClick={() => (activeField === 'origin' ? pickOrigin(r.name) : searchRecent(r))}
                    >
                      <Clock3 size={18} className="routeDropIcon" />
                      <span className="routeDropText">
                        <strong>{r.name}</strong>
                        {r.sub && <span>{r.sub}</span>}
                      </span>
                    </button>
                    <button
                      className="routeDropRemove"
                      onClick={() => setRecents(removeRecent(r.name))}
                      aria-label={`${r.name} 최근 검색 삭제`}
                    >
                      <X size={15} />
                    </button>
                  </div>
                ))}
                {recents.length > 0 && (
                  <div className="routeDropFooter">
                    <span>최근 검색</span>
                    <button onClick={() => setRecents(clearRecents())}>전체 삭제</button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* 집/회사 바로가기 — 주소는 사용자가 정해 저장하고, 누르면 바로 검색 */}
      <QuickPlaces className="routeQuickRow" onGo={(name, sub) => searchRecent({ name, sub })} />

      {/* 즐겨찾기 — 모바일 경로 입력 화면의 "즐겨찾기" 버튼과 같은 목록. 누르면 바로 길찾기, 별표로 해제 */}
      <button
        className={showFavorites ? 'favToggle open' : 'favToggle'}
        onClick={() => setShowFavorites((v) => !v)}
        aria-expanded={showFavorites}
      >
        <Star size={16} fill={showFavorites ? 'currentColor' : 'none'} />
        즐겨찾기{favorites.length > 0 && ` ${favorites.length}`}
      </button>
      {showFavorites && (
        <div className="favList">
          {favNeedLogin && <p className="routeDropEmpty">로그인하면 즐겨찾기를 저장할 수 있어요.</p>}
          {!favNeedLogin && favorites.length === 0 && (
            <p className="routeDropEmpty">즐겨찾기한 장소가 없어요. 도착지 검색 결과에서 별표를 눌러 추가하세요.</p>
          )}
          {favorites.map((f) => (
            <div className="routeDropRow" key={f.marker_uuid}>
              <button className="routeDropItem" onClick={() => searchRecent({ name: f.marker_name, sub: '' })}>
                <Star size={18} className="routeDropIcon routeDropIconAccent" fill="currentColor" />
                <span className="routeDropText">
                  <strong>{f.marker_name}</strong>
                </span>
              </button>
              <button
                className="routeDropRemove routeDropStar active"
                onClick={() => removeFavorite(f.marker_uuid)}
                aria-label={`${f.marker_name} 즐겨찾기 해제`}
              >
                <Star size={15} fill="currentColor" />
              </button>
            </div>
          ))}
        </div>
      )}

      <h3 className="sectionTitle">경로 옵션</h3>

      <div className="routeOptions">
        {ROUTE_MODES.map((m) => (
          <button
            key={m.id}
            className={selectedMode === m.id ? 'routeOption activeOption' : 'routeOption'}
            onClick={() => setSelectedMode(m.id)}
          >
            <m.icon size={29} />
            <strong>{m.label}</strong>
            <small>{m.desc}</small>
          </button>
        ))}
      </div>

      <button className="searchRouteButton" onClick={() => runSearch()}>
        <Search size={22} />
        경로 검색하기
      </button>
      {(notice || favError) && <p className="routeNotice">{notice || favError}</p>}

      {resultsReady && (
        <div className="routeResultCard">
          <div className="routeResultHeader">
            <div className="mfScoreBadge mfScoreBadge--lg" style={{ '--tone': grade.color, '--tone-soft': grade.soft }}>
              <strong>{selectedRoute.score}</strong>
              <span>{grade.label}</span>
            </div>
            <div>
              <strong>
                {selectedRoute.distance}km · 도보 {selectedRoute.duration}분
              </strong>
              <p>{selectedRoute.note}</p>
            </div>
          </div>

          <div className="mfRouteList">
            {ROUTE_OPTIONS.map((r) => {
              const g = scoreGrade(r.score);
              return (
                <button
                  key={r.id}
                  className={r.id === selectedRouteId ? 'mfRouteOption selected' : 'mfRouteOption'}
                  onClick={() => setSelectedRouteId(r.id)}
                >
                  <div className="mfScoreBadge mfScoreBadge--sm" style={{ '--tone': g.color, '--tone-soft': g.soft }}>
                    <strong>{r.score}</strong>
                  </div>
                  <div>
                    <strong>{r.name}</strong>
                    <span>{r.note}</span>
                  </div>
                  <div className="mfRouteMeta">
                    <strong>{r.duration}분</strong>
                    <span>{r.distance}km</span>
                  </div>
                </button>
              );
            })}
          </div>

          <button className="mfOutlineBtn routeDetailToggle" onClick={() => setShowDetail((v) => !v)}>
            {showDetail ? '구간별 정보 접기' : '구간별 안전 요인 보기'}
          </button>

          {showDetail && (
            <div className="mfSegmentList">
              {SEGMENTS.map((s) => (
                <div className="mfSegmentRow" key={s.name}>
                  <span className="mfSegmentBar" style={{ background: GRADE_COLOR[s.grade] }} />
                  <div
                    className="mfSegmentIcon"
                    style={{ '--tone': GRADE_COLOR[s.grade], '--tone-soft': GRADE_SOFT[s.grade] }}
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
                        style={{ '--tone': GRADE_COLOR[s.grade], '--tone-soft': GRADE_SOFT[s.grade] }}
                      >
                        {s.grade}
                      </span>
                    </div>
                    <p>{s.note}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <button className="mfPrimaryBtn startNavigationButton" onClick={onStartNavigation}>
            안내 시작
          </button>
        </div>
      )}

      <div className="safetyCard">
        <h3>안전 지표 안내</h3>

        <div className="safetyRow">
          <div className="safetyIcon blueSafety">
            <Camera />
          </div>

          <div>
            <strong>CCTV</strong>
            <p>주변 CCTV 설치 지역</p>
          </div>
        </div>

        <div className="safetyRow">
          <div className="safetyIcon yellowSafety">
            <Lightbulb />
          </div>

          <div>
            <strong>가로등</strong>
            <p>가로등이 설치된 구간</p>
          </div>
        </div>

        <div className="safetyRow">
          <div className="safetyIcon purpleSafety">
            <ShieldCheck />
          </div>

          <div>
            <strong>여성지킴이 귀갓길</strong>
            <p>안전 순찰 구간</p>
          </div>
        </div>
      </div>

      <div className="communityCard">
        <div className="peopleIllustration">👩‍🦰👨</div>

        <div>
          <strong>
            함께 만드는
            <br />더 안전한 우리 동네
          </strong>

          <p>친절한 이웃이 함께합니다.</p>
        </div>
      </div>
    </div>
  );
}
