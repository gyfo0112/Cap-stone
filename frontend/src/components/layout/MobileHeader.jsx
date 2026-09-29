import {
  ChevronLeft,
} from 'lucide-react';

// 화면 상단 헤더 — 뒤로가기+제목(일반/지도 위 floating) 또는 뒤로가기 없는 제목만,
// 세 가지 모양을 한 곳에서 관리한다. 화면들은 제목·뒤로가기 핸들러만 넘기고
// 자기 바디만 갖고 있으면 되게 하기 위한 공통 컴포넌트.
export function MobileHeader({ title, onBack, floating = false, backLabel = '뒤로' }) {
  if (!onBack) {
    return <h1 className="mfPageTitle">{title}</h1>;
  }
  const content = (
    <>
      <button className="mfIconBtn" onClick={onBack} aria-label={backLabel}>
        <ChevronLeft size={22} />
      </button>
      <h1>{title}</h1>
    </>
  );
  return floating ? (
    <div className="mfFloatingHeader">{content}</div>
  ) : (
    <header className="mfHeader">{content}</header>
  );
}

/* ---------- 1. 온보딩 ---------- */
