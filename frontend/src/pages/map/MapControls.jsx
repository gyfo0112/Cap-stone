import {
  Crosshair,
} from 'lucide-react';

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
