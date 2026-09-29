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

// 안전점수 0~100 -> 등급/색상. 안전만 초록(check), 나머지는 경고 계열(triangle) —
// 보통은 기존 가로등 아이콘 배경(#fff7da)을 재사용하고 대비용으로 텍스트만 어둡게,
// 주의는 기존 주의색(#ff8b38) 계열에서 파생. 위험은 기존 레드 그대로.
export function scoreGrade(score) {
  if (score >= 80) return { label: '안전', color: '#137050', soft: '#e3f5ec' };
  if (score >= 60) return { label: '보통', color: '#875c0c', soft: '#fff7da' };
  if (score >= 35) return { label: '주의', color: '#a5510f', soft: '#ffe9d6' };
  return { label: '위험', color: '#f34b52', soft: '#fdecec' };
}
