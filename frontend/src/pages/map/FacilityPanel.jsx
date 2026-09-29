import {
  Camera,
  Lightbulb,
  ShieldCheck,
  Siren,
  TriangleAlert,
} from 'lucide-react';
import { LAYER_STATUS_TEXT } from '../../api/markersApi';

// 지도에 켜고 끌 수 있는 안전시설 — key는 markersApi.js MARKER_LAYERS와 같다
const FACILITY_BUTTONS = [
  { key: 'cctv', icon: Camera, title: 'CCTV 위치' },
  { key: 'streetlight', icon: Lightbulb, title: '가로등(보안등) 위치' },
  { key: 'safeHouse', icon: ShieldCheck, title: '여성안심지킴이집' },
  { key: 'safetyBell', icon: Siren, title: '안심벨(비상벨) 위치' },
];

export function FacilityPanel({ layers, layerStatus, onToggle }) {
  return (
    <div className="panelContent">
      <h1>지도</h1>

      <p className="subtitle">주변의 안전시설과 위험구간을 확인하세요.</p>

      {FACILITY_BUTTONS.map((f) => {
        const on = layers[f.key];
        return (
          <button
            key={f.key}
            className={on ? 'facilityButton active' : 'facilityButton'}
            onClick={() => onToggle(f.key)}
          >
            <f.icon />

            <div>
              <strong>{f.title}</strong>
              <span>
                {on ? LAYER_STATUS_TEXT[layerStatus[f.key]] ?? '불러오는 중…' : '지도에 표시'}
              </span>
            </div>
          </button>
        );
      })}

      <button className="facilityButton" disabled>
        <TriangleAlert />

        <div>
          <strong>범죄주의구간</strong>
          <span>준비 중</span>
        </div>
      </button>
    </div>
  );
}
