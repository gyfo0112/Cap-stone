// 도움요청 게시글 로컬 저장 — 백엔드 Posts(post_uuid/post_title/body/user_uuid/post_type/
// post_status/created_at)와 PostRequest(user_uuid/post_uuid, 수락 기록) 필드명을 맞춰뒀다.
// distance는 표시용 mock(백엔드 컬럼 아님). 게시/수락 API가 생기면 이 파일만 fetch로 바꾸면 된다.
const POSTS_KEY = 'mf-posts';
const REQUESTS_KEY = 'mf-post-requests';

// 로그인 연동 전까지 "나"를 대신하는 값
export const MY_USER_UUID = 'local-user';

export const POST_TYPES = ['일반', '주의', '긴급'];

const minutesAgo = (m) => new Date(Date.now() - m * 60000).toISOString();

const DEFAULT_POSTS = [
  { post_uuid: 'sample-1', post_title: '귀갓길 동행이 필요해요', body: '성수역 2번 출구 근처', user_uuid: 'neighbor-1', post_type: '주의', post_status: 'OPEN', created_at: minutesAgo(5), distance: 0.8 },
  { post_uuid: 'sample-2', post_title: '긴급하게 도움이 필요합니다', body: '서울숲 인근 골목', user_uuid: 'neighbor-2', post_type: '긴급', post_status: 'OPEN', created_at: minutesAgo(2), distance: 1.2 },
  { post_uuid: 'sample-3', post_title: '무거운 짐 옮기는 것을 도와주세요', body: '왕십리역 근처', user_uuid: 'neighbor-3', post_type: '일반', post_status: 'OPEN', created_at: minutesAgo(12), distance: 1.5 },
];

function load(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}

function save(key, list) {
  localStorage.setItem(key, JSON.stringify(list));
  return list;
}

export const getPosts = () => load(POSTS_KEY, DEFAULT_POSTS);

export function addPost({ post_title, body, post_type }) {
  const post = {
    post_uuid: crypto.randomUUID(),
    post_title,
    body,
    user_uuid: MY_USER_UUID,
    post_type,
    post_status: 'OPEN',
    created_at: new Date().toISOString(),
  };
  return save(POSTS_KEY, [post, ...getPosts()]);
}

// PostRequest 행 = { user_uuid(수락한 사람), post_uuid }
const getRequestRows = () => load(REQUESTS_KEY, []);
const withoutPost = (post_uuid) => getRequestRows().filter((r) => r.post_uuid !== post_uuid);

export const getAcceptedIds = () => getRequestRows().map((r) => r.post_uuid);

export function acceptPost(post_uuid) {
  save(REQUESTS_KEY, [...withoutPost(post_uuid), { user_uuid: MY_USER_UUID, post_uuid }]);
  return getAcceptedIds();
}

export function cancelAccept(post_uuid) {
  save(REQUESTS_KEY, withoutPost(post_uuid));
  return getAcceptedIds();
}

export function removePost(post_uuid) {
  save(REQUESTS_KEY, withoutPost(post_uuid));
  return save(POSTS_KEY, getPosts().filter((p) => p.post_uuid !== post_uuid));
}

export function timeAgo(iso) {
  const min = Math.max(0, Math.round((Date.now() - new Date(iso)) / 60000));
  if (min < 1) return '방금 전';
  if (min < 60) return `${min}분 전`;
  if (min < 1440) return `${Math.floor(min / 60)}시간 전`;
  return `${Math.floor(min / 1440)}일 전`;
}
