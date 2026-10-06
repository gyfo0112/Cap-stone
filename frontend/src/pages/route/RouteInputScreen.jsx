import { useState, useEffect } from 'react';
import {
  Crosshair,
  MapPin,
  Star,
  X,
} from 'lucide-react';
import { hasKakaoRestKey, searchPlaces } from '../../api/kakaoLocal';
import { ScoreBadge } from '../../components/ScoreBadge';
import { useFavorites } from '../../hooks/useFavorites';
import { addRecent, clearRecents, getRecents, removeRecent } from '../../data/recents';
import { MobileHeader } from '../../components/layout/MobileHeader';

export function RouteInputScreen({ initialDestination, originLabel, onBack, onPickOnMap, onSelect: goToResult }) {
  const [recents, setRecents] = useState(getRecents);
  // 어디서 고르든(검색결과/즐겨찾기/최근/Enter) 최근 검색에 남긴 뒤 결과로 이동
  const onSelect = (name, sub) => {
    addRecent({ name, sub });
    goToResult(name);
  };
  const [destination, setDestination] = useState(initialDestination || '');
  const [places, setPlaces] = useState(null); // 마지막으로 완료된 검색 결과
  const [placesQuery, setPlacesQuery] = useState(''); // places가 어떤 검색어의 결과인지
  const [searching, setSearching] = useState(false);
  const { favorites, error: favError, isFavorite, toggle: toggleFavorite, remove: removeFavorite } = useFavorites();
  const [showFavorites, setShowFavorites] = useState(false);
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

  const filtered = query ? recents.filter((r) => r.name.includes(query)) : recents;
  const resultsReady = showingSearch && !searching && placesQuery === query;

  return (
    <div className="mfScreen mfScreenTabbed">
      <MobileHeader title="경로 설정" onBack={onBack} />

      <div className="mfOdCard">
        <div className="mfOdRow">
          <span className="mfOdDotOrigin" />
          <span>{originLabel ? `현재 위치 · ${originLabel}` : '현재 위치'}</span>
        </div>
        <div className="mfOdDivider" />
        <div className="mfOdRow">
          <MapPin size={16} color="#ff4b50" />
          <input
            className="mfOdInput"
            placeholder="어디로 갈까요?"
            aria-label="어디로 갈까요?"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && destination && onSelect(destination)}
          />
        </div>
      </div>

      <div className="mfOdActions">
        <button className="mfOutlineBtn" onClick={onPickOnMap}>
          <Crosshair size={16} /> 지도에서 찍기
        </button>
        <button
          className={showFavorites ? 'mfOutlineBtn active' : 'mfOutlineBtn'}
          onClick={() => setShowFavorites((v) => !v)}
        >
          <Star size={16} /> 즐겨찾기
        </button>
      </div>

      {favError && <p className="mfEmptyHint">{favError}</p>}

      {showingSearch ? (
        <>
          <h3 className="mfSectionLabel">검색 결과</h3>
          <div className="mfRecentList">
            {!resultsReady && <p className="mfEmptyHint">검색 중…</p>}
            {resultsReady &&
              places.map((p) => {
                const fav = isFavorite(p.name);
                return (
                  <div className="mfRecentRow" key={p.id}>
                    <button className="mfRecentRowMain" onClick={() => onSelect(p.name, p.address)}>
                      <div className="mfRecentInfo">
                        <strong>{p.name}</strong>
                        <span>{p.address}</span>
                      </div>
                    </button>
                    <button
                      className={fav ? 'mfFavoriteToggle active' : 'mfFavoriteToggle'}
                      onClick={() => toggleFavorite(p)}
                      aria-label={fav ? '즐겨찾기 해제' : '즐겨찾기 추가'}
                    >
                      <Star size={16} fill={fav ? 'currentColor' : 'none'} />
                    </button>
                  </div>
                );
              })}
            {resultsReady && places.length === 0 && (
              <p className="mfEmptyHint">
                일치하는 장소가 없어요. Enter를 누르면 입력한 위치로 길찾기를 시작합니다.
              </p>
            )}
          </div>
        </>
      ) : showFavorites ? (
        <>
          <h3 className="mfSectionLabel">즐겨찾기</h3>
          <div className="mfRecentList">
            {favorites.length === 0 && (
              <p className="mfEmptyHint">즐겨찾기한 장소가 없어요. 검색 결과에서 별표를 눌러 추가하세요.</p>
            )}
            {favorites.map((f) => (
              <div className="mfRecentRow" key={f.marker_uuid}>
                <button className="mfRecentRowMain" onClick={() => onSelect(f.marker_name)}>
                  <div className="mfRecentInfo">
                    <strong>{f.marker_name}</strong>
                  </div>
                </button>
                <button
                  className="mfFavoriteToggle active"
                  onClick={() => removeFavorite(f.marker_uuid)}
                  aria-label="즐겨찾기 해제"
                >
                  <Star size={16} fill="currentColor" />
                </button>
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="mfSectionHeader">
            <h3 className="mfSectionLabel">{query ? '검색 결과' : '최근 검색'}</h3>
            {!query && recents.length > 0 && (
              <button className="mfSectionAction" onClick={() => setRecents(clearRecents())}>
                전체 삭제
              </button>
            )}
          </div>
          <div className="mfRecentList">
            {filtered.map((r) => (
              <div className="mfRecentRow" key={r.name}>
                <button className="mfRecentRowMain" onClick={() => onSelect(r.name, r.sub)}>
                  <div className="mfRecentInfo">
                    <strong>{r.name}</strong>
                    {r.sub && <span>{r.sub}</span>}
                  </div>
                </button>
                {r.score && <ScoreBadge score={r.score} size="sm" />}
                <button
                  className="mfContactRemove"
                  onClick={() => setRecents(removeRecent(r.name))}
                  aria-label={`${r.name} 최근 검색 삭제`}
                >
                  <X size={14} />
                </button>
              </div>
            ))}
            {filtered.length === 0 && (
              <p className="mfEmptyHint">
                {query
                  ? '일치하는 검색 결과가 없어요. Enter를 누르면 입력한 위치로 길찾기를 시작합니다.'
                  : '최근 검색한 장소가 없어요.'}
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/* ---------- 3-1. 지도에서 찍기 ---------- */
