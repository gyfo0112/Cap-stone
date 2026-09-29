import { useState } from 'react';
import {
  ArrowUp,
  CircleCheck,
  TriangleAlert,
  Users,
} from 'lucide-react';
import { GRADE_COLOR, GRADE_SOFT, SEGMENTS } from '../../data/routeData.js';
import { useSheetToggle } from '../../hooks/useSheetToggle.js';

export function RouteDetailScreen({ onEnd }) {
  const [sharing, setSharing] = useState(false);
  const [expanded, sheetHandlers] = useSheetToggle(true);

  return (
    <div className="mfRouteScreen">
      <div className="mfTurnBanner">
        <ArrowUp size={26} />
        <div>
          <strong>250m 직진</strong>
          <span>어울마당로 · 다음 좌회전까지 (예시 안내)</span>
        </div>
      </div>

      <div className="mfRouteSheet">
        <button
          className="mfGrabHandleZone"
          aria-label={expanded ? '시트 접기' : '시트 펼치기'}
          aria-expanded={expanded}
          {...sheetHandlers}
        >
          <span className="mfGrabHandle" />
        </button>

        <div className="mfSegmentHeader">
          <h3 className="mfSectionLabel" style={{ margin: 0 }}>
            구간별 안전 요인
          </h3>
          <span className="mfSegmentSummary">총 {SEGMENTS.length}구간 · 1.8km</span>
        </div>

        <div className={expanded ? 'mfCollapsible' : 'mfCollapsible collapsed'}>
          <div className="mfCollapsibleInner">
            <div className="mfSegmentList">
              {SEGMENTS.map((s) => (
                <div className="mfSegmentRow" key={s.name}>
                  <span className="mfSegmentBar" style={{ background: GRADE_COLOR[s.grade] }} />
                  <div
                    className="mfSegmentIcon"
                    style={{ '--tone': GRADE_COLOR[s.grade], '--tone-soft': GRADE_SOFT[s.grade] }}
                  >
                    {s.grade === '안전' ? <CircleCheck size={16} /> : <TriangleAlert size={16} />}
                  </div>
                  <div className="mfSegmentBody">
                    <div className="mfSegmentTitleRow">
                      <strong>
                        {s.name} · {s.meters}m
                      </strong>
                      <span
                        className="mfSegmentGradeTag"
                        style={{ '--tone': GRADE_COLOR[s.grade], '--tone-soft': GRADE_SOFT[s.grade] }}
                      >
                        {s.grade}
                      </span>
                    </div>
                    <p>{s.note}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mfDetailActions">
              <button className="mfOutlineBtn mfFlex1" onClick={onEnd}>
                안내 종료
              </button>
              <button className="mfShareBtn mfFlex1_4" onClick={() => setSharing((v) => !v)}>
                <Users size={16} /> {sharing ? '공유 예시' : '보호자 공유'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- 6. 도움요청 (SOS) ---------- */
