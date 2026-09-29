import { useState, useEffect } from 'react';
import {
  MapPin,
} from 'lucide-react';
import { coordToAddress, hasKakaoRestKey } from '../../api/kakaoLocal.js';
import { MobileHeader } from '../../components/layout/MobileHeader.jsx';

// 지도 중심에 항상 고정된 핀을 두고, 사용자가 지도를 움직이면(idle) App에서
// 내려주는 center로 역지오코딩해 주소를 보여준다. 확정하면 그 주소를 목적지로 씀.
export function MapPickScreen({ center, onCancel, onConfirm }) {
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const restKeyMissing = !hasKakaoRestKey();

  useEffect(() => {
    if (!center || restKeyMissing) return undefined;
    let cancelled = false;
    const timer = setTimeout(() => {
      setLoading(true);
      coordToAddress(center.lat, center.lng)
        .then((result) => {
          if (cancelled) return;
          setAddress(result || '');
          setFailed(!result);
        })
        .catch(() => {
          if (cancelled) return;
          setFailed(true);
        })
        .finally(() => !cancelled && setLoading(false));
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [center, restKeyMissing]);

  return (
    <div className="mfRouteScreen">
      <MobileHeader title="지도에서 위치 선택" onBack={onCancel} floating backLabel="취소" />

      <span className="mfPickCrosshair" aria-hidden="true">
        <MapPin size={36} color="#ff4b50" fill="#ff4b50" />
      </span>

      <div className="mfRouteSheet">
        <span className="mfGrabHandle" />
        <h3 className="mfSectionLabel">선택한 위치</h3>
        <p className="mfPickAddress">
          {loading ? '주소를 확인하는 중…' : failed ? '주소를 확인할 수 없습니다' : address || '지도를 움직여 위치를 맞춰보세요'}
        </p>
        <button
          className="mfPrimaryBtn mfMainCta"
          disabled={!address || loading}
          onClick={() => onConfirm(address)}
        >
          이 위치로 설정
        </button>
      </div>
    </div>
  );
}

/* ---------- 4. 경로 결과 ---------- */
