import { useState } from 'react';
import {
  ArrowUp,
  CircleCheck,
  TriangleAlert,
  Users,
} from 'lucide-react';
import { GRADE_COLOR, GRADE_SOFT } from '../../data/routeData';

// 데스크탑 길 안내 화면 — frontend-junwoo의 NavigationPage와 같은 구성(턴 배너 +
// 구간별 안전요인 + 안내종료/보호자공유). 모바일 RouteDetailScreen과 같은
// 구간 목록(route.segments)을 쓰고, mf* 클래스를 그대로 재사용해 별도 CSS 없이 붙였다.
export function NavigationPanel({ route, onEnd }) {
  const segments = route?.segments ?? [];
  const [sharing, setSharing] = useState(false);

  return (
    <div className="panelContent">
      <div className="mfTurnBanner">
        <ArrowUp size={26} />
        <div>
          <strong>250m 직진</strong>
          <span>어울마당로 · 다음 좌회전까지</span>
        </div>
      </div>

      <h3 className="sectionTitle" style={{ marginTop: 20 }}>
        구간별 안전 요인 · 총 {segments.length}구간 · {route?.distance ?? '-'}km
      </h3>

      <div className="mfSegmentList">
        {segments.map((s, i) => (
          <div className="mfSegmentRow" key={`${s.name}-${i}`}>
            <span className="mfSegmentBar" style={{ background: GRADE_COLOR[s.grade] }} />
            <div className="mfSegmentIcon" style={{ '--tone': GRADE_COLOR[s.grade], '--tone-soft': GRADE_SOFT[s.grade] }}>
              {s.grade === '안전' ? <CircleCheck size={16} /> : <TriangleAlert size={16} />}
            </div>
            <div className="mfSegmentBody">
              <div className="mfSegmentTitleRow">
                <strong>
                  {s.name} · {s.meters}m
                </strong>
                <span className="mfSegmentGradeTag" style={{ '--tone': GRADE_COLOR[s.grade], '--tone-soft': GRADE_SOFT[s.grade] }}>
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
  );
}
