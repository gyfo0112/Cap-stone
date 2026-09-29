import { useState } from 'react';
import {
  TriangleAlert,
} from 'lucide-react';

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

// 범례 칸 배경(초록~빨강)에서 흰색/짙은색 중 대비가 더 큰 글자색을 고른다
function legendTextColor(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const f = (v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  const L = 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  return 1.05 / (L + 0.05) > (L + 0.05) / 0.06 ? '#fff' : '#1c2027';
}

export function CrimeLayerScreen() {
  const [enabled, setEnabled] = useState(true);
  const [opacity, setOpacity] = useState(60);

  return (
    <div className="mfRouteScreen">
      <div className="mfRouteSheet">
        <span className="mfGrabHandle" />

        <div className="mfCrimeHeaderRow">
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
            aria-label="범죄주의구간 표시 토글"
          >
            <span />
          </button>
        </div>

        <div className={enabled ? 'mfCrimeBody' : 'mfCrimeBody mfCrimeBody--off'}>
          <h3 className="mfSectionLabel">위험 등급 범례</h3>
          <div className="mfLegend">
            {CRIME_LEGEND.map((c, i) => (
              <div key={c} className="mfLegendCell" style={{ background: c, color: legendTextColor(c) }}>
                {i + 1}
              </div>
            ))}
          </div>
          <p className="mfLegendCaption">1등급 안전 · 5·6등급 보통 · 10등급 위험</p>

          <div className="mfCrimeAreaCard">
            <span className="mfCrimeAreaDot" />
            <div>
              <strong>이 지역 8등급 · 주의</strong>
              <p>
                서교동 일부 격자는 야간 절도·폭력 신고가 마포구 평균보다 높습니다. 22시 이후
                어울마당로 대로변 이용을 권장합니다.
              </p>
            </div>
          </div>

          <div className="mfSliderHeaderRow">
            <h3 className="mfSectionLabel">레이어 투명도</h3>
            <span className="mfSliderValue">{opacity}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={opacity}
            onChange={(e) => setOpacity(Number(e.target.value))}
            className="mfSlider mfSliderNeutral"
            disabled={!enabled}
          />
        </div>
      </div>
    </div>
  );
}

/* ---------- 8. 설정 ---------- */
