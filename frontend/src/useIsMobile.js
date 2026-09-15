import { useEffect, useState } from 'react';

const QUERY = '(max-width: 767.98px)';

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.matchMedia(QUERY).matches);

  useEffect(() => {
    const mq = window.matchMedia(QUERY);
    const onChange = (e) => setIsMobile(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return isMobile;
}

// 안전점수 0~100 -> 등급/색상. 색상은 앱 기존 팔레트 재사용
// (안전·보통은 새로 추가한 초록 하나로 통일, 주의=기존 옐로우, 위험=기존 레드).
export function scoreGrade(score) {
  if (score >= 80) return { label: '안전', color: '#22a06b', soft: '#e3f5ec' };
  if (score >= 60) return { label: '보통', color: '#22a06b', soft: '#e3f5ec' };
  if (score >= 35) return { label: '주의', color: '#efaa16', soft: '#fff7da' };
  return { label: '위험', color: '#f34b52', soft: '#fdecec' };
}
