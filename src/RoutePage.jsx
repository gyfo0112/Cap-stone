import { useState } from 'react';

import { ArrowLeft, MapPin, LocateFixed, Star, Sun, Moon } from 'lucide-react';

import './RoutePage.css';

// 화면 확인용 예시 데이터
const RECENT_PLACES = [
  {
    id: 1,
    name: '연남동 501-9',
    detail: '서울 마포구 연남로 · 3시간 전',
    score: 82,
  },
  {
    id: 2,
    name: '홍대입구역 2번출구',
    detail: '서울 마포구 양화로 · 어제',
    score: 76,
  },
  {
    id: 3,
    name: '망원동 396-12 (집)',
    detail: '즐겨찾기',
    score: 84,
  },
  {
    id: 4,
    name: '상수동 골목시장',
    detail: '서울 마포구 와우산로 · 3일 전',
    score: 58,
  },
];

const ROUTES = [
  {
    id: 'safe',
    score: 82,
    title: '안전 우선 경로',
    description: 'CCTV 12대 · 보안등 34개 · 대로변 위주',
    summary: '최단 대비 +6분 · 어두운 구간 80m 회피',
    time: '24분',
    distance: '1.8km',
  },
  {
    id: 'balanced',
    score: 71,
    title: '균형 경로',
    description: '어두운 구간 120m 포함',
    summary: '최단 대비 +3분 · 어두운 구간 120m 포함',
    time: '21분',
    distance: '1.6km',
  },
  {
    id: 'short',
    score: 58,
    title: '최단 거리',
    description: '어두운 골목 320m · 야간 신고 4건',
    summary: '최단 거리 · 어두운 골목 320m 포함',
    time: '18분',
    distance: '1.4km',
  },
];

const ORIGIN_LABEL = '경기 남양주시 진접읍 금곡리 383';

function getScoreClass(score) {
  if (score >= 80) return 'safe';
  if (score >= 70) return 'normal';

  return 'warning';
}

function getScoreLabel(score) {
  if (score >= 80) return '안전';
  if (score >= 70) return '보통';

  return '주의';
}

function getScoreStyle(score) {
  if (score >= 80) {
    return {
      color: '#31795b',
      backgroundColor: '#e8f5ed',
    };
  }

  if (score >= 70) {
    return {
      color: '#9a7217',
      backgroundColor: '#fff5d9',
    };
  }

  return {
    color: '#a55d26',
    backgroundColor: '#ffead7',
  };
}

function RoutePage({ onStartNavigation }) {
  const [destination, setDestination] = useState('');

  // search: 경로 설정 / result: 경로 결과
  // 안내 화면 전환은 App.jsx가 담당
  const [pageMode, setPageMode] = useState('search');

  const [selectedPlace, setSelectedPlace] = useState(null);
  const [safetyLevel, setSafetyLevel] = useState(62);
  const [timeMode, setTimeMode] = useState('now');
  const [selectedRoute, setSelectedRoute] = useState('safe');

  // 선택한 경로에 맞춰 상단 요약 변경
  const currentRoute =
    ROUTES.find((route) => route.id === selectedRoute) ?? ROUTES[0];

  /* =========================
     최근 검색 위치 선택
  ========================= */

  const handleRecentPlace = (place) => {
    setDestination(place.name);
    setSelectedPlace(place);
    setSelectedRoute('safe');
    setPageMode('result');
  };

  /* =========================
     결과 화면에서 뒤로 가기
  ========================= */

  const handleBack = () => {
    setPageMode('search');
  };

  /* =========================
     안내 시작
  ========================= */

  const handleStartNavigation = () => {
    if (typeof onStartNavigation !== 'function') {
      window.alert(
        '안내 시작 기능이 연결되지 않았습니다. App.jsx의 onStartNavigation 연결을 확인해주세요.',
      );

      return;
    }

    onStartNavigation();
  };

  /* =========================
     아직 연결되지 않은 기능
  ========================= */

  const handleNotReady = (featureName) => {
    window.alert(`${featureName} 기능은 아직 연결되지 않았습니다.`);
  };

  /* =========================================================
     경로 설정 화면
  ========================================================= */

  if (pageMode === 'search') {
    return (
      <div className="routePage">
        <div className="routePageHeader">
          <h1>경로 설정</h1>
        </div>

        {/* 출발지 / 목적지 */}
        <div className="routeSearchBox">
          <div className="routeSearchRow">
            <span className="routeLocationDot current"></span>

            <div className="routeLocationText">
              <span className="routeLocationLabel">현재 위치</span>

              <span className="routeLocationDivider">·</span>

              <strong>{ORIGIN_LABEL}</strong>
            </div>
          </div>

          <div className="routeSearchDivider"></div>

          <div className="routeSearchRow">
            <MapPin size={19} className="destinationIcon" />

            <input
              type="text"
              placeholder="어디로 갈까요?"
              aria-label="목적지"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
            />
          </div>
        </div>

        {/* 지도에서 찍기 / 즐겨찾기 */}
        <div className="routeQuickButtons">
          <button
            type="button"
            className="routeQuickButton"
            onClick={() => handleNotReady('지도에서 찍기')}
          >
            <LocateFixed size={20} />
            <span>지도에서 찍기</span>
          </button>

          <button
            type="button"
            className="routeQuickButton"
            onClick={() => handleNotReady('즐겨찾기')}
          >
            <Star size={20} />
            <span>즐겨찾기</span>
          </button>
        </div>

        {/* 최근 검색 */}
        <section className="recentSearchSection">
          <h2>최근 검색</h2>

          <p style={{ fontSize: '12px', color: '#687383' }}>
            예시 장소를 선택해 화면을 확인할 수 있어요. 실제 장소 검색은 아직
            연결되지 않았습니다.
          </p>

          <div className="recentSearchList">
            {RECENT_PLACES.map((place) => (
              <button
                type="button"
                className="recentPlaceItem"
                key={place.id}
                onClick={() => handleRecentPlace(place)}
              >
                <div className="recentPlaceInfo">
                  <strong>{place.name}</strong>
                  <span>{place.detail}</span>
                </div>

                <div className={`routeScore ${getScoreClass(place.score)}`}>
                  {place.score}
                </div>
              </button>
            ))}
          </div>
        </section>
      </div>
    );
  }

  /* =========================================================
     경로 결과 화면
  ========================================================= */

  return (
    <div className="routePage routeResultPage">
      {/* 출발지 → 목적지 */}
      <div className="routeResultHeader">
        <button
          type="button"
          className="routeBackButton"
          onClick={handleBack}
          aria-label="경로 설정으로 돌아가기"
        >
          <ArrowLeft size={22} />
        </button>

        <strong
          className="routeResultTitle"
          title={`${ORIGIN_LABEL} → ${selectedPlace?.name ?? ''}`}
        >
          {ORIGIN_LABEL}
          <span> → </span>
          {selectedPlace?.name}
        </strong>
      </div>

      {/* 선택한 경로 요약 */}
      <div className="routeSummary">
        <div
          className="routeSummaryScore"
          style={getScoreStyle(currentRoute.score)}
        >
          <strong>{currentRoute.score}</strong>

          <span>{getScoreLabel(currentRoute.score)}</span>
        </div>

        <div className="routeSummaryInfo">
          <strong>
            {currentRoute.distance} · 도보 {currentRoute.time}
          </strong>

          <span>{currentRoute.summary}</span>
        </div>
      </div>

      {/* 안전 우선도 */}
      <div className="routeSafetyControl">
        <div className="routeSafetyLabels">
          <span>거리 최우선</span>
          <span>안전 최우선</span>
        </div>

        <input
          type="range"
          min="0"
          max="100"
          value={safetyLevel}
          onChange={(e) => setSafetyLevel(Number(e.target.value))}
          className="routeSafetySlider"
          aria-label="안전 우선도"
        />

        <div className="routeSafetyBottom">
          <strong>안전 우선 {safetyLevel}%</strong>

          <div className="timeModeButtons">
            <button
              type="button"
              className={
                timeMode === 'now' ? 'timeModeButton active' : 'timeModeButton'
              }
              aria-pressed={timeMode === 'now'}
              onClick={() => setTimeMode('now')}
            >
              <Sun size={15} />
              지금
            </button>

            <button
              type="button"
              className={
                timeMode === 'night'
                  ? 'timeModeButton active'
                  : 'timeModeButton'
              }
              aria-pressed={timeMode === 'night'}
              onClick={() => setTimeMode('night')}
            >
              <Moon size={15} />
              야간
            </button>
          </div>
        </div>
      </div>

      {/* 대안 경로 */}
      <section className="alternativeRouteSection">
        <h2>대안 경로</h2>

        <div className="alternativeRouteList">
          {ROUTES.map((route) => (
            <button
              type="button"
              key={route.id}
              className={
                selectedRoute === route.id
                  ? 'alternativeRouteCard selected'
                  : 'alternativeRouteCard'
              }
              aria-pressed={selectedRoute === route.id}
              onClick={() => setSelectedRoute(route.id)}
            >
              <div className={`alternativeScore ${getScoreClass(route.score)}`}>
                {route.score}
              </div>

              <div className="alternativeRouteInfo">
                <strong>{route.title}</strong>
                <span>{route.description}</span>
              </div>

              <div className="alternativeRouteTime">
                <strong>{route.time}</strong>
                <span>{route.distance}</span>
              </div>
            </button>
          ))}
        </div>
      </section>

      <p
        style={{
          margin: '16px 0 0',
          fontSize: '12px',
          lineHeight: 1.6,
          color: '#687383',
        }}
      >
        화면 확인용 예시 데이터입니다. 안전 우선도와 시간대 변경은 아직 경로
        계산에 반영되지 않으며, 안내 시작 후에는 공통 예시 안내 화면이
        표시됩니다.
      </p>

      {/* App.jsx의 안내 화면으로 전환 */}
      <button
        type="button"
        className="startNavigationButton"
        onClick={handleStartNavigation}
      >
        안내 시작
      </button>
    </div>
  );
}

export default RoutePage;
