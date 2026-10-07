// 백엔드(Spring) 호출 공통 — 세션 쿠키(JSESSIONID)를 같이 보내고, 실패 응답을 Error(message, status)로 바꿔 던진다.
// 서버 오류 본문은 글자(text/plain) 그대로거나 { message } JSON 둘 다 받는다.
// body가 URLSearchParams면 폼 전송(스프링 formLogin의 POST /login)으로 보낸다.
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
  const isForm = body instanceof URLSearchParams;
  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      credentials: 'include',
      headers: body && !isForm ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
    });
  } catch {
    throw new Error('서버에 연결할 수 없어요. 잠시 후 다시 시도해주세요.');
  }
  // 스프링은 로그인이 필요한 요청을 /login 으로 리다이렉트한다(JSON 401이 아님). ?error 는 로그인 실패.
  if (res.redirected && new URL(res.url).pathname === '/login') {
    if (new URL(res.url).searchParams.has('error')) {
      throw Object.assign(new Error('아이디 또는 비밀번호가 올바르지 않아요.'), { status: 401 });
    }
    onUnauthorized();
    throw Object.assign(new Error('로그인이 필요해요.'), { status: 401 });
  }
  const text = await res.text().catch(() => '');
  let data = null;
  try {
    data = JSON.parse(text);
  } catch {
    /* JSON이 아니면 data는 null, 오류 메시지는 text를 쓴다 */
  }
  if (!res.ok) {
    if (res.status === 401) onUnauthorized();
    const message = data?.message ?? (text && text.length < 200 && !text.startsWith('<') ? text : '');
    throw Object.assign(new Error(message || `요청에 실패했어요 (${res.status})`), { status: res.status });
  }
  return data;
}
