// 경로 결과/상세에서 쓰는 mock 데이터 — 모바일(MobileFlow.jsx)과 데스크탑(App.jsx)
// RoutePanel이 함께 쓰기 때문에 컴포넌트 파일이 아닌 별도 모듈로 둔다.
// (컴포넌트 파일에 상수를 export하면 react-refresh 경고가 뜬다)

export const ROUTE_OPTIONS = [
  { id: 'safe', name: '안전 우선 경로', score: 82, note: 'CCTV 12대 · 보안등 34개 · 대로변 위주', duration: 24, distance: 1.8 },
  { id: 'balanced', name: '균형 경로', score: 71, note: '어두운 구간 120m 포함', duration: 21, distance: 1.6 },
  { id: 'shortest', name: '최단 거리', score: 58, note: '어두운 골목 320m · 야간 신고 4건', duration: 18, distance: 1.4 },
];

export const SEGMENTS = [
  { name: '어울마당로', meters: 260, grade: '안전', note: 'CCTV 3대, 보안등 8개 · 유동인구 많음' },
  { name: '서교로 골목', meters: 180, grade: '보통', note: '보안등 2개 · 야간 조도 낮음, 안심벨 40m' },
  { name: '동교로 뒷길', meters: 200, grade: '주의', note: '어두운 구간 · 최근 6개월 야간 신고 4건' },
  { name: '연남로', meters: 340, grade: '안전', note: '안심벨 1개, CCTV 5대 · 상가 밀집' },
];

export const GRADE_COLOR = { 안전: '#137050', 보통: '#875c0c', 주의: '#a5510f', 위험: '#f34b52' };
export const GRADE_SOFT = { 안전: '#e3f5ec', 보통: '#fff7da', 주의: '#ffe9d6', 위험: '#fdecec' };
