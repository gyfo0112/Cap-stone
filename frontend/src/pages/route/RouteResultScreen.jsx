import { useState, useEffect } from 'react';
import {
  Moon,
  Sun,
} from 'lucide-react';
import { ScoreBadge } from '../../components/ScoreBadge';
import { ToggleGroup } from '../../components/ToggleGroup';
import { PRIORITY_OPTIONS, ROUTE_OPTIONS } from '../../data/routeData';
import { useSheetToggle } from '../../hooks/useSheetToggle';
import { MobileHeader } from '../../components/layout/MobileHeader';

// 목적지가 바뀔 때마다 이 컴포넌트 자체를 새로 마운트해서(key=destination)
// "계산 중" 스켈레톤을 다시 보여준다 — 아직 실제 경로 API가 없어서 결과는
// mock이지만, 붙일 때를 위해 로딩 자리는 미리 만들어 둔다.
export function RouteResultScreen(props) {
  return <RouteResultBody key={props.destination} {...props} />;
}

function RouteResultBody({
  destination,
  originLabel,
  routePriority,
  onRoutePriorityChange,
  timeMode,
  onTimeModeChange,
  selectedRouteId,
  onSelectRoute,
  onBack,
  onStart,
}) {
  const selected = ROUTE_OPTIONS.find((r) => r.id === selectedRouteId) ?? ROUTE_OPTIONS[0];
  const shortest = ROUTE_OPTIONS[ROUTE_OPTIONS.length - 1];
  const timeDiff = selected.duration - shortest.duration;

  const [ready, setReady] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setReady(true), 550);
    return () => clearTimeout(timer);
  }, []);

  const [expanded, sheetHandlers] = useSheetToggle(true);

  const header = (
    <MobileHeader
      title={`${originLabel || '현재 위치'} → ${destination || '목적지'}`}
      onBack={onBack}
      floating
    />
  );

  if (!ready) {
    return (
      <div className="mfRouteScreen">
        {header}
        <div className="mfRouteSheet">
          <span className="mfGrabHandle" />
          <div className="mfSkeleton mfSkeletonCard" />
          <div className="mfSkeleton mfSkeletonBlock" />
          <div className="mfSkeleton" style={{ height: 40, marginBottom: 18 }} />
          <div className="mfSkeleton mfSkeletonRow" />
          <div className="mfSkeleton mfSkeletonRow" />
          <div className="mfSkeleton mfSkeletonRow" />
        </div>
      </div>
    );
  }

  return (
    <div className="mfRouteScreen">
      {header}

      <div className="mfRouteSheet">
        <button
          className="mfGrabHandleZone"
          aria-label={expanded ? '시트 접기' : '시트 펼치기'}
          aria-expanded={expanded}
          {...sheetHandlers}
        >
          <span className="mfGrabHandle" />
        </button>

        <div className="mfSummaryCard">
          <ScoreBadge score={selected.score} size="lg" />
          <div>
            <strong>
              {selected.distance}km · 도보 {selected.duration}분
            </strong>
            <p>
              {timeDiff === 0 ? '가장 빠른 경로예요' : `최단 대비 +${timeDiff}분`} · {selected.note}
            </p>
          </div>
        </div>

        <div className={expanded ? 'mfCollapsible' : 'mfCollapsible collapsed'}>
          <div className="mfCollapsibleInner">
            <div className="mfSliderBlock">
              <ToggleGroup options={PRIORITY_OPTIONS} value={routePriority} onChange={onRoutePriorityChange} label="기본 안전 우선도" />
              <div className="mfSliderFooter">
                <span className="mfSliderValue">시간대</span>
                <div className="mfToggleBg mfToggleBgCompact">
                  <button
                    className={timeMode === 'now' ? 'mfToggleItem active' : 'mfToggleItem'}
                    onClick={() => onTimeModeChange('now')}
                  >
                    <Sun size={12} /> 지금
                  </button>
                  <button
                    className={timeMode === 'night' ? 'mfToggleItem active' : 'mfToggleItem'}
                    onClick={() => onTimeModeChange('night')}
                  >
                    <Moon size={12} /> 야간
                  </button>
                </div>
              </div>
            </div>

            <h3 className="mfSectionLabel">대안 경로</h3>
            <div className="mfRouteList">
              {ROUTE_OPTIONS.map((r) => (
                <button
                  key={r.id}
                  className={r.id === selectedRouteId ? 'mfRouteOption selected' : 'mfRouteOption'}
                  onClick={() => onSelectRoute(r.id)}
                >
                  <ScoreBadge score={r.score} size="sm" />
                  <div>
                    <strong>{r.name}</strong>
                    <span>{r.note}</span>
                  </div>
                  <div className="mfRouteMeta">
                    <strong>{r.duration}분</strong>
                    <span>{r.distance}km</span>
                  </div>
                </button>
              ))}
            </div>

            <p className="mfEmptyHint">화면 확인용 예시 경로입니다. 실제 경로 계산은 서버 연결 후 반영됩니다.</p>
            <button className="mfPrimaryBtn mfMainCta" onClick={onStart}>
              안내 시작
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- 5. 경로 상세 / 턴바이턴 ---------- */
