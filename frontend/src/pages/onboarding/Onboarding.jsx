import {
  Moon,
  ShieldCheck,
  Siren,
} from 'lucide-react';

const FEATURES = [
  { icon: ShieldCheck, title: '안전도 기반 경로', desc: 'CCTV·보안등·안심벨·112 신고 데이터로 구간마다 점수를 계산합니다.' },
  { icon: Moon, title: '밤에는 다르게 계산', desc: '같은 길도 시간대에 따라 위험도가 달라집니다. 야간 조도를 반영합니다.' },
  { icon: Siren, title: '한 번에 도움요청', desc: '위험할 때 SOS 한 번으로 보호자와 112에 위치를 전송합니다.' },
];

export function Onboarding({ onDone }) {
  const handleAllow = () => {
    try {
      navigator.geolocation?.getCurrentPosition(onDone, onDone, { timeout: 4000 });
    } catch {
      onDone();
    }
  };

  return (
    <div className="mfScreen mfOnboarding">
      <div className="mfOnbIcon">
        <ShieldCheck size={34} color="#fff" />
      </div>

      <h1 className="mfOnbHeadline">
        밤길도 가까운 길보다
        <br />
        안전한 길로
      </h1>
      <p className="mfOnbSub">CCTV·보안등·안심벨·112 신고 데이터를 시간대별로 계산해 안전한 경로를 알려드립니다.</p>

      <ul className="mfOnbFeatures">
        {FEATURES.map((f) => (
          <li key={f.title}>
            <span className="mfOnbFeatureIcon">
              <f.icon size={18} />
            </span>
            <div>
              <strong>{f.title}</strong>
              <p>{f.desc}</p>
            </div>
          </li>
        ))}
      </ul>

      <div className="mfOnbPermCard">
        <strong>위치 권한이 필요합니다</strong>
        <p>현재 위치를 기준으로 주변 안전시설과 경로를 계산합니다.</p>
        <button className="mfPrimaryBtn" onClick={handleAllow}>
          앱 사용 중에만 허용
        </button>
        <button className="mfTextBtn" onClick={onDone}>
          나중에 설정하기
        </button>
      </div>
    </div>
  );
}

/* ---------- 2. 메인 지도 (하단시트 카드) ---------- */
