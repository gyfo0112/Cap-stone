import { useState, useEffect } from 'react';
import { countNearby } from '../../api/markersApi.js';
import { ScoreBadge } from '../../components/ScoreBadge.jsx';
import { QUICK_PLACES } from '../../data/routeData.js';

// 실제 시각 기준으로 "주간/야간" 문구만 맞춤 — 안전점수 자체는 아직 mock.
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

export function MainMapCard({ onOpenInput, locationLabel, lat, lng }) {
  const nearbyCaption = useNearbyCaption(lat, lng);
  return (
    <div className="mfMainCard">
      <div className="mfMainCardTop">
        <div>
          <span className="mfCaption">현재 위치</span>
          <h2 className="mfLocationTitle">{locationLabel || '현재 위치'}</h2>
        </div>
        <ScoreBadge score={68} />
      </div>

      <p className="mfMainCaption">
        {timeOfDayLabel()} · {nearbyCaption}
      </p>

      <div className="mfQuickRow">
        {QUICK_PLACES.map((q) => (
          <button key={q.key} className="mfQuickBtn" onClick={() => onOpenInput(q.name)}>
            <q.icon size={16} /> {q.label}
          </button>
        ))}
      </div>

      <button className="mfPrimaryBtn mfMainCta" onClick={() => onOpenInput('')}>
        안전 길찾기
      </button>
    </div>
  );
}

/* ---------- 3. 경로 입력 ---------- */
