import { useState, useEffect, useRef } from 'react';
import {
  ArrowUpDown,
  Camera,
  CircleCheck,
  Clock3,
  Lightbulb,
  PersonStanding,
  Search,
  ShieldCheck,
  TriangleAlert,
  X,
} from 'lucide-react';
import { hasKakaoRestKey, searchPlaces } from '../../api/kakaoLocal';
import { addRecent, clearRecents, getRecents, removeRecent } from '../../data/recents';
import { GRADE_COLOR, GRADE_SOFT, QUICK_PLACES, ROUTE_OPTIONS, SEGMENTS } from '../../data/routeData';
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
  // 추천 목록에서 고른 장소 — 고른 뒤엔 목록을 다시 띄우지 않고, 최근 검색에 주소를 같이 남긴다
  const [pickedPlace, setPickedPlace] = useState(null);

  const query = destination.trim();
  const canSearch = hasKakaoRestKey();
  const showSuggestions = query && canSearch && pickedPlace?.name !== query;

  // 실제 카카오 장소 검색 (모바일 경로설정 화면과 동일한 방식)
  useEffect(() => {
    if (!showSuggestions) return undefined;
    let cancelled = false;
    const timer = setTimeout(() => {
      setSearching(true);
      searchPlaces(query)
        .then((r) => !cancelled && setPlaces(r))
        .catch(() => !cancelled && setPlaces([]))
        .finally(() => !cancelled && setSearching(false));
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, showSuggestions]);

  const pickPlace = (place) => {
    setDestination(place.name);
    setPickedPlace(place);
    setPlaces([]);
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

      <div className="locationBox">
        <div className="locationInput">
          <span className="dot blue"></span>
          <input
            placeholder="출발지 입력"
            value={origin}
            onChange={(e) => {
              originTouched.current = true;
              setOrigin(e.target.value);
            }}
          />
        </div>

        <div className="divider"></div>

        <div className="locationInput">
          <span className="dot red"></span>
          <input
            placeholder="도착지 입력"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && runSearch()}
          />
        </div>

        <button className="swap" onClick={swap} aria-label="출발지/도착지 바꾸기">
          <ArrowUpDown size={18} />
        </button>
      </div>

      {/* 집/회사 바로가기 — 모바일 홈 카드와 같은 장소(routeData.js QUICK_PLACES), 누르면 바로 검색 */}
      <div className="mfQuickRow routeQuickRow">
        {QUICK_PLACES.map((q) => (
          <button key={q.key} className="mfQuickBtn" onClick={() => searchRecent({ name: q.name, sub: '' })}>
            <q.icon size={16} /> {q.label}
          </button>
        ))}
      </div>

      {showSuggestions && (
        <div className="searchSuggestions">
          {searching && <div className="searchSuggestionEmpty">검색 중…</div>}
          {!searching && places.length === 0 && (
            <div className="searchSuggestionEmpty">검색 결과가 없습니다</div>
          )}
          {!searching &&
            places.map((p) => (
              <button key={p.id} className="searchSuggestionItem" onClick={() => pickPlace(p)}>
                <strong>{p.name}</strong>
                <span>{p.address}</span>
              </button>
            ))}
        </div>
      )}

      {!query && (
        <div className="recentSearches">
          <div className="recentSearchesHeader">
            <h3 className="sectionTitle">최근 검색</h3>
            {recents.length > 0 && (
              <button className="recentClearAll" onClick={() => setRecents(clearRecents())}>
                전체 삭제
              </button>
            )}
          </div>
          {recents.length === 0 ? (
            <p className="searchSuggestionEmpty">최근 검색한 장소가 없어요.</p>
          ) : (
            <div className="searchSuggestions">
              {recents.map((r) => (
                <div className="recentRow" key={r.name}>
                  <button className="searchSuggestionItem" onClick={() => searchRecent(r)}>
                    <strong>{r.name}</strong>
                    {r.sub && <span>{r.sub}</span>}
                  </button>
                  <button
                    className="recentRemove"
                    onClick={() => setRecents(removeRecent(r.name))}
                    aria-label={`${r.name} 최근 검색 삭제`}
                  >
                    <X size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}
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
      {notice && <p className="routeNotice">{notice}</p>}

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
