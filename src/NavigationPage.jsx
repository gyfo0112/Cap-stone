import { CircleCheck, TriangleAlert, Users, ArrowUp } from 'lucide-react';

import './NavigationPage.css';

function NavigationPage({ onEnd }) {
  const safetySections = [
    {
      id: 1,
      road: '어울마당로',
      distance: '260m',
      level: 'safe',
      levelText: '안전',
      description: 'CCTV 3대 · 보안등 8개 · 유동인구 많음',
    },
    {
      id: 2,
      road: '서교로 골목',
      distance: '180m',
      level: 'normal',
      levelText: '보통',
      description: '보안등 2개 · 야간 조도 낮음 · 안심벨 40m',
    },
    {
      id: 3,
      road: '동교로 뒷길',
      distance: '200m',
      level: 'warning',
      levelText: '주의',
      description: '어두운 구간 · 최근 6개월 야간 신고 4건',
    },
    {
      id: 4,
      road: '연남로',
      distance: '340m',
      level: 'safe',
      levelText: '안전',
      description: '안심벨 1개 · CCTV 5대 · 상가 밀집',
    },
  ];

  const handleGuardianShare = () => {
    alert('보호자에게 현재 경로를 공유했습니다.');
  };

  return (
    <div className="navigationPage">
      {/* 현재 길 안내 */}
      <div className="navigationGuide">
        <ArrowUp
          size={38}
          className="navigationGuideArrow"
          aria-hidden="true"
        />

        <div className="navigationGuideText">
          <strong>250m 직진</strong>
          <span>어울마당로 · 다음 좌회전까지</span>
          <small>화면 예시 · 실제 길 안내가 아닙니다</small>
        </div>
      </div>

      <div className="navigationDivider" />

      {/* 구간별 안전 요인 */}
      <div className="navigationPanelHeader">
        <div>
          <span>구간별 안전 요인</span>
          <strong>총 4구간 · 1.8km</strong>
        </div>
      </div>

      <div className="navigationSectionList">
        {safetySections.map((section) => {
          const StatusIcon =
            section.level === 'safe' ? CircleCheck : TriangleAlert;

          return (
            <div
              className={`navigationSection ${section.level}`}
              key={section.id}
            >
              <div className="navigationSectionBar" />

              <div className="navigationStatusIcon">
                <StatusIcon size={21} />
              </div>

              <div className="navigationSectionInfo">
                <div className="navigationRoadTitle">
                  <strong>
                    {section.road} · {section.distance}
                  </strong>

                  <span className={`navigationLevel ${section.level}`}>
                    {section.levelText}
                  </span>
                </div>

                <p>{section.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="navigationButtons">
        <button type="button" className="navigationEndButton" onClick={onEnd}>
          안내 종료
        </button>

        <button
          type="button"
          className="guardianShareButton"
          onClick={handleGuardianShare}
        >
          <Users size={20} />
          보호자 공유
        </button>
      </div>
    </div>
  );
}

export default NavigationPage;
