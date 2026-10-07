// 백엔드(Spring) 호출 공통 — 세션 쿠키(JSESSIONID)를 같이 보내고, 실패 응답({ message })을 Error로 바꿔 던진다.
// VITE_USE_BACKEND=true 일 때만 data/*.js가 이 함수를 쓰고, 아니면 브라우저 저장소 mock으로 동작한다
// (Vercel 시연 배포는 백엔드가 없어 mock). 다른 주소의 서버면 VITE_API_BASE_URL을 지정(그땐 서버 CORS에 credentials 허용 필요).
const BASE = import.meta.env.VITE_API_BASE_URL ?? '';
export const USE_BACKEND = import.meta.env.VITE_USE_BACKEND === 'true';

// 로그인이 필요한 API가 401을 돌려주면(세션 만료 등) 프론트의 로그인 표시도 같이 지운다 — data/auth.js가 등록
let onUnauthorized = () => {};
export const setUnauthorizedHandler = (fn) => {
  onUnauthorized = fn;
};

export async function api(method, path, body) {
  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      credentials: 'include',
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error('서버에 연결할 수 없어요. 잠시 후 다시 시도해주세요.');
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    if (res.status === 401 && path !== '/api/users/login') onUnauthorized();
    throw Object.assign(new Error(data?.message ?? `요청에 실패했어요 (${res.status})`), { status: res.status });
  }
  return data;
}
