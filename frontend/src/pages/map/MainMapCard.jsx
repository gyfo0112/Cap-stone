import { useState, useEffect } from 'react';
import { USE_BACKEND } from '../../api/http';
import { countNearby } from '../../api/markersApi';
import { ScoreBadge } from '../../components/ScoreBadge';
import { QuickPlaces } from '../../components/QuickPlaces';
import { fetchPlaceScore } from '../../data/routes';

// 실제 시각 기준으로 "주간/야간" 문구를 맞춘다.
function timeOfDayLabel() {
  const hour = new Date().getHours();
  const isNight = hour >= 19 || hour < 6;
  return `${isNight ? '야간' : '주간'}(${hour}시) 기준`;
}

// 반경 500m 안전시설 개수 문구 — 마커 API로 실제로 센다(서버 없으면 서울 CCTV 파일로 CCTV만)
function useNearbyCaption(lat, lng) {
  const key = lat == null ? null : `${lat},${lng}`;
  const [result, setResult] = useState({ key: null, counts: null });

  useEffect(() => {
    if (lat == null) return undefined;
    const controller = new AbortController();
    countNearby(lat, lng, controller.signal)
      .then((counts) => setResult({ key: `${lat},${lng}`, counts }))
      .catch(() => {});
    return () => controller.abort();
  }, [lat, lng]);

  if (key == null) return '위치를 켜면 반경 500m 안전시설 수를 알려드려요';
  if (result.key !== key) return '반경 500m 안전시설 확인 중…';
  const { cctv, streetlight } = result.counts;
  const parts = [cctv != null && `CCTV ${cctv}대`, streetlight != null && `보안등 ${streetlight}개`].filter(Boolean);
  return parts.length ? `반경 500m 내 ${parts.join(', ')}` : '주변 안전시설 정보를 불러오지 못했어요';
}

// 현재 위치 안전점수 — 백엔드(/api/safety-score)가 계산한다. 예시 모드(Vercel)는 고정값 68.
// undefined = 확인 중, null = 이 지역은 안전시설 데이터가 없어 계산 불가
function usePlaceScore(lat, lng) {
  // GPS가 조금씩 흔들려도 다시 묻지 않게 소수 4자리(약 10m)로 맞춘다
  const rLat = lat == null ? null : Math.round(lat * 1e4) / 1e4;
  const rLng = lng == null ? null : Math.round(lng * 1e4) / 1e4;
  const key = rLat == null ? null : `${rLat},${rLng}`;
  const [state, setState] = useState({ key: null, score: null });

  useEffect(() => {
    if (!USE_BACKEND || rLat == null) return undefined;
    let cancelled = false;
    const done = (score) => !cancelled && setState({ key: `${rLat},${rLng}`, score });
    fetchPlaceScore(rLat, rLng)
      .then((r) => done(r.score))
      .catch(() => done(null));
    return () => {
      cancelled = true;
    };
  }, [rLat, rLng]);

  if (!USE_BACKEND) return 68;
  if (key == null) return null;
  return state.key === key ? state.score : undefined;
}

export function MainMapCard({ onOpenInput, locationLabel, lat, lng }) {
  const nearbyCaption = useNearbyCaption(lat, lng);
  const score = usePlaceScore(lat, lng);
  return (
    <div className="mfMainCard">
      <div className="mfMainCardTop">
        <div>
          <span className="mfCaption">현재 위치</span>
          <h2 className="mfLocationTitle">{locationLabel || '현재 위치'}</h2>
        </div>
        {score !== undefined && <ScoreBadge score={score} />}
      </div>

      <p className="mfMainCaption">
        {timeOfDayLabel()} · {nearbyCaption}
      </p>

      <QuickPlaces onGo={(name, sub, place) => onOpenInput(name, place)} />

      <button className="mfPrimaryBtn mfMainCta" onClick={() => onOpenInput('')}>
        안전 길찾기
      </button>
    </div>
  );
}

/* ---------- 3. 경로 입력 ---------- */
