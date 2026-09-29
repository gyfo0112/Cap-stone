import {
  Bell,
  MapPin,
  Route,
  Settings,
} from 'lucide-react';

// 하단 탭바 (지도 / 경로 / [SOS 자리] / 도움요청 / 설정)
const TABS = [
  { key: 'map', label: '지도', icon: MapPin },
  { key: 'route', label: '경로', icon: Route },
  { key: 'sos', label: '', icon: null },
  { key: 'help', label: '도움요청', icon: Bell },
  { key: 'settings', label: '설정', icon: Settings },
];

export function MobileTabBar({ active, onSelect }) {
  return (
    <nav className="mfTabBar">
      {TABS.map((t) =>
        t.key === 'sos' ? (
          <span key="sos" className="mfTabSpacer" aria-hidden="true" />
        ) : (
          <button
            key={t.key}
            className={active === t.key ? 'mfTabItem active' : 'mfTabItem'}
            onClick={() => onSelect(t.key)}
          >
            <t.icon size={20} />
            <span>{t.label}</span>
          </button>
        ),
      )}
    </nav>
  );
}
