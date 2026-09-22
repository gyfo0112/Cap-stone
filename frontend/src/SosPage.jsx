import { useEffect, useRef, useState } from 'react';
import './SosPage.css';
import { MapView } from './KakaoMapView';

// SOS 상황에서는 주변 CCTV 위치가 바로 보이는 게 유용해서 기본으로 켜둔다.
const SOS_LAYERS = { cctv: true };

function SosPage({ onCancel, location }) {
  const [counting, setCounting] = useState(false);
  const [count, setCount] = useState(3);

  const intervalRef = useRef(null);
  const timeoutRef = useRef(null);

  const handleSOSClick = () => {
    // 카운트다운 중에 다시 누르면 취소
    if (counting) {
      clearInterval(intervalRef.current);
      clearTimeout(timeoutRef.current);

      setCounting(false);
      setCount(3);

      // 메인 화면으로 돌아가기
      onCancel();

      return;
    }

    // 처음 SOS 버튼을 눌렀을 때
    setCounting(true);
    setCount(3);

    let current = 3;

    intervalRef.current = setInterval(() => {
      current -= 1;
      setCount(current);

      if (current <= 0) {
        clearInterval(intervalRef.current);
      }
    }, 1000);

    // 3초가 지나면 도움 요청 실행
    timeoutRef.current = setTimeout(() => {
      clearInterval(intervalRef.current);

      setCounting(false);
      setCount(3);

      console.log('SOS 전송');

      alert('도움 요청이 전송되었습니다.');

      // 나중에 여기에 실제 도움 요청 기능 연결
      // 예:
      // 보호자 위치 전송
      // 서버에 SOS 요청 저장
      // 신고 기능 연결
    }, 3000);
  };

  // SOS 페이지를 나갈 때 타이머 정리
  useEffect(() => {
    return () => {
      clearInterval(intervalRef.current);
      clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <div className="sos-page">
      <div className="sos-left">
        <button
          className={`sos-circle ${counting ? 'active' : ''}`}
          onClick={handleSOSClick}
        >
          <span className="sos-text">{counting ? count : 'SOS'}</span>

          <span className="sos-small">
            {counting ? '다시 누르면 취소' : '3초 안에 다시 누르면 취소'}
          </span>
        </button>

        <p className="sos-info">
          {counting ? (
            <>
              {count}초 후 도움 요청이 전송됩니다
              <br />
              취소하려면 SOS 버튼을 다시 누르세요
            </>
          ) : (
            <>
              SOS 버튼을 누르면 도움 요청이 시작됩니다.
              <br />
              3초 안에 다시 누르면 취소됩니다.
            </>
          )}
        </p>

        <div className="guardian-box">
          <div>
            <strong>보호자 실시간 위치 공유</strong>
            <p>엄마 · 김서연 (30분간 공유 중)</p>
          </div>

          <div className="guardian-toggle">
            <div></div>
          </div>
        </div>

        <h3>주변 안전시설</h3>

        <div className="safe-place">
          <div>
            <strong>안심지킴이집 · 서교편의점</strong>
            <p>24시간 운영 중</p>
          </div>

          <strong>80m</strong>
        </div>

        <div className="safe-place">
          <div>
            <strong>안심벨 · 홍대입구역 3번출구</strong>
            <p>경보음 + 112 자동연결</p>
          </div>

          <strong>140m</strong>
        </div>

        <div className="safe-place">
          <div>
            <strong>마포경찰서 서교지구대</strong>
            <p>02-3149-XXXX</p>
          </div>

          <strong>320m</strong>
        </div>
      </div>

      <div className="sos-map">
        <MapView layers={SOS_LAYERS} location={location} />
      </div>
    </div>
  );
}

export default SosPage;
