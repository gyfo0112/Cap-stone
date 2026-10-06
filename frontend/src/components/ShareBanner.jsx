import { MapPin } from 'lucide-react';

// 보호 대상 계정에서 "지금 내 위치가 공유되고 있다"는 걸 계속 보여준다 — 모르는 사이에 공유되는 일을 막는 표시.
// variant: 'desktop'(지도 위 알약) | 'mobile'(화면 맨 위 띠)
export function ShareBanner({ names, variant }) {
  if (names.length === 0) return null;
  const who = names.length > 2 ? `${names[0]}님 외 ${names.length - 1}명` : names.map((n) => `${n}님`).join(', ');
  return (
    <div className={`shareBanner ${variant}`} role="status">
      <MapPin size={14} />
      {who}과 위치를 공유 중이에요
    </div>
  );
}
