# API 명세 — 회원 · 보호자 연락처 · 즐겨찾기 (오민석)

- 실패 응답은 모두 `{ "message": "..." }`, JSON 키는 스네이크 표기
- 로그인은 **세션 방식**: 로그인에 성공하면 `JSESSIONID` 쿠키가 내려가고, 이후 요청에 쿠키가 같이 가면 로그인 상태
- 프론트에서 `fetch` 를 쓸 때 주소가 다른 서버(`VITE_API_BASE_URL` 지정)면 `credentials: 'include'` 필요. vite 프록시(5173)나 같은 서버면 필요 없음
- 로그인이 필요한 API 를 로그인 없이 부르면 `401 { "message": "로그인이 필요합니다" }`

## 1. 회원 `/api/users`

| 기능 | 방식 · 주소 | 로그인 | 요청 | 성공 | 실패 |
|---|---|---|---|---|---|
| 회원 가입 | `POST /api/users/signup` | 불필요 | `{user_id, user_pw, user_name, info}` | 201 + 회원 | 400 필수값·길이 / 409 아이디 중복 |
| 로그인 | `POST /api/users/login` | 불필요 | `{user_id, user_pw, keep_login}` | 200 + 회원 + 쿠키 | 400 / 401 아이디·비밀번호 틀림 |
| 로그아웃 | `POST /api/users/logout` | 불필요 | 없음 | 200 + message | — |
| 내 정보 | `GET /api/users/me` | 필요 | 없음 | 200 + 회원 | 401 |
| 아이디 찾기 | `POST /api/users/find-id` | 불필요 | `{user_name, info}` | 200 + 가린 아이디 배열 (없으면 `[]`) | 400 |
| 본인 확인 | `POST /api/users/verify` | 불필요 | `{user_id, user_name, info}` | 200 + message | 400 / 404 일치하는 계정 없음 |
| 비밀번호 재설정 | `POST /api/users/reset-password` | 불필요 | `{user_id, user_name, info, user_pw}` | 200 + message | 400 / 404 |

회원 응답: `{ "user_uuid": "...", "user_id": "minseok", "user_name": "오민석", "info": "010-1234-5678", "role": "guardian" }` (비밀번호는 내보내지 않음)

- `info` 에는 **휴대폰 번호**를 넣는다 (프론트 회원가입 화면의 휴대폰 번호). 아이디 찾기·본인 확인은 이름 + `info` 로 대조하며, 하이픈은 있어도 없어도 같게 본다
- 아이디 찾기 응답 예: `["mi******"]` (앞 2글자만 보임)
- `role` 은 계정 구분: `guardian`(보호자, 기본값) 또는 `protected`(보호 대상). 가입 요청에 넣을 수 있고, 가입 · 로그인 · 내 정보 응답에 들어 있다. 자세한 내용은 `API_links_location.md`
- `user_id` 30자 이하, `user_name` 50자 이하, `user_pw` 4~50자, `info` 는 선택
- `keep_login`: `true` 면 14일, `false`(기본) 면 30분 동안 요청이 없을 때 로그인이 풀림

## 2. 보호자 연락처 `/api/users/me/tels` (모두 로그인 필요)

| 기능 | 방식 · 주소 | 요청 | 성공 | 실패 |
|---|---|---|---|---|
| 목록 | `GET /api/users/me/tels` | 없음 | 200 + 배열 | 401 |
| 추가 | `POST /api/users/me/tels` | `{tel_name, tel_num, tel_type}` | 201 + 연락처 | 400 / 401 / 409 이미 등록된 번호 |
| 삭제 | `DELETE /api/users/me/tels/{tel_uuid}` | 없음 | 200 + message | 401 / 404 |

연락처 응답: `{ "tel_uuid": "...", "user_uuid": "...", "tel_num": "010-1234-5678", "tel_name": "엄마", "tel_type": "기본" }`

- `tel_name` 50자 이하(필수), `tel_num` 20자 이하(필수), `tel_type` 20자 이하(선택)
- 남의 연락처 `tel_uuid` 로 삭제를 부르면 404

## 3. 즐겨찾기 `/api/favorites` (모두 로그인 필요)

주소에서 `user_uuid` 가 빠졌다. 누구의 즐겨찾기인지는 로그인 정보에서 꺼낸다.

| 기능 | 방식 · 주소 | 요청 | 성공 | 실패 |
|---|---|---|---|---|
| 목록 | `GET /api/favorites` | 없음 | 200 + 배열 | 401 |
| 담기 | `POST /api/favorites` | 아래 두 가지 중 하나 | 201 + 즐겨찾기 | 400 / 401 / 404 없는 마커 / 409 이미 담음 |
| 이름 변경 | `PATCH /api/favorites/{marker_uuid}` | `{fav_name}` | 200 + 즐겨찾기 | 401 / 404 |
| 해제 | `DELETE /api/favorites/{marker_uuid}` | 없음 | 200 + message | 401 / 404 |

담기 요청

```json
{ "marker_uuid": "이미 있는 마커의 uuid", "fav_name": "자주 가는 길 CCTV" }
```

```json
{ "marker_name": "우리집", "latitude": 37.5665, "longitude": 126.9780, "fav_name": "집" }
```

두 번째는 카카오에서 검색한 장소용이다. 서버가 `marker_type = "PLACE"` 인 마커를 만들어(같은 이름·좌표가 있으면 재사용) 즐겨찾기로 연결한다.

즐겨찾기 응답: `{ "user_uuid", "marker_uuid", "marker_name", "marker_type", "latitude", "longitude", "fav_name" }`

## 4. 마커 `/api/markers` (로그인 불필요, 주소·응답 변화 없음)

- `PLACE` 마커(사용자가 즐겨찾기한 장소)는 지도 범위 조회 결과에 나오지 않는다

## 5. 다른 컨트롤러에서 로그인한 사용자 꺼내는 법

```java
@PostMapping
public ResponseEntity<?> postUpload(Authentication authentication, @RequestBody ...) {
    String user_uuid = authentication.getName();   // 로그인한 사용자의 user_uuid
}
```

`/api/**` 는 `SecurityConfig` 의 공개 목록에 없으면 자동으로 로그인이 필요하다. 로그인 없이 열어야 하는 API 는 `SecurityConfig` 의 `permitAll()` 목록에 주소를 추가한다.

## 6. DB 에 한 번 실행할 것

비밀번호 암호문이 60자라서 `users.user_pw` 가 30자면 가입이 실패한다. 이미 테이블이 만들어져 있으면 직접 늘려야 한다.

```sql
ALTER TABLE users MODIFY user_pw VARCHAR(100) NOT NULL;
```
