import {
  Bell,
  Camera,
  Lightbulb,
  Search,
  ShieldCheck,
  TriangleAlert,
} from 'lucide-react';
import { LAYER_STATUS_TEXT, MARKER_LAYERS } from '../../api/markersApi';

// 지도 위 검색바 + 안전시설 오버레이 칩 (메인 지도 탭에서만 표시)
// 안전시설 칩 key는 markersApi.js MARKER_LAYERS와 같다(색 점 = 지도 마커 색)
const OVERLAY_CHIPS = [
  { key: 'cctv', label: 'CCTV', icon: Camera },
  { key: 'streetlight', label: '보안등', icon: Lightbulb },
  { key: 'safeHouse', label: '지킴이집', icon: ShieldCheck },
  { key: 'safetyBell', label: '안심벨', icon: Bell },
];

const LAYER_COLOR = Object.fromEntries(MARKER_LAYERS.map((l) => [l.key, l.color]));

export function MapSearchOverlay({ layers, layerStatus, onToggleLayer, crimeOn, onOpenCrime, onOpenInput }) {
  // 켜진 레이어 중 안내가 필요한 상태가 있으면 칩 아래에 한 줄로 (데이터 없음은 어떤 시설인지 붙여서)
  const noticeChip = OVERLAY_CHIPS.find(
    (c) => layers[c.key] && ['zoom', 'error', 'empty'].includes(layerStatus[c.key]),
  );
  const noticeStatus = noticeChip && layerStatus[noticeChip.key];
  const notice =
    noticeStatus === 'empty'
      ? `${noticeChip.label}: ${LAYER_STATUS_TEXT.empty}`
      : noticeStatus && LAYER_STATUS_TEXT[noticeStatus];

  return (
    <div className="mfMapOverlay">
      <button className="mfSearchBar" onClick={() => onOpenInput('')}>
        <Search size={18} />
        <span>어디로 갈까요?</span>
      </button>

      <div className="mfChipRow">
        {OVERLAY_CHIPS.map((c) => (
          <button
            key={c.key}
            className={layers[c.key] ? 'mfChip active' : 'mfChip'}
            onClick={() => onToggleLayer(c.key)}
          >
            {layers[c.key] && <span className="mfChipDot" style={{ background: LAYER_COLOR[c.key] }} />}
            <c.icon size={15} /> {c.label}
          </button>
        ))}
        <button className={crimeOn ? 'mfChip active' : 'mfChip'} onClick={onOpenCrime}>
          <TriangleAlert size={15} /> 범죄주의구간
        </button>
      </div>

      {notice && <p className="mfMapNotice">{notice}</p>}
    </div>
  );
}
