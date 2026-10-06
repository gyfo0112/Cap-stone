# API 명세 — 실시간 위치 공유 (오민석)

- 모두 **로그인 필요** (세션 쿠키). 로그인 없이 부르면 `401 { "message": "로그인이 필요합니다" }`
- 실패 응답은 모두 `{ "message": "..." }`, JSON 키는 스네이크 표기
- 시각(`expires_at`, `updated_at`)은 **밀리초 숫자** — 자바스크립트 `Date.now()` 와 같은 단위라 그대로 비교하면 된다
- "누가 할 수 있는지"는 서버가 직접 검사한다. 권한이 없으면 `403`

## 0. 계정 구분 (role)

위치 공유의 기준이 되는 값이라 서버에 저장한다.

- 가입: `POST /api/users/signup` 요청에 `"role": "guardian"` 또는 `"protected"` 를 넣는다. 안 넣으면 `guardian`. 다른 값이면 400
- 가입 · 로그인 · `GET /api/users/me` 응답에 `role` 이 들어 있다 → 다른 기기에서 로그인해도 유지된다
- 이 기능 전에 가입한 계정은 `guardian` 으로 본다

## 1. 주소 목록

| 기능 | 방식 · 주소 | 누가 | 요청 | 성공 | 실패 |
|---|---|---|---|---|---|
| 연결 코드 발급 | `POST /api/invites` | 보호 대상 | 없음 | 201 `{code, expires_at}` | 403 |
| 코드로 연결 | `POST /api/links/accept` | 보호자 | `{code}` | 201 + 연결 | 400 / 403 / 404 없는 코드 / 410 만료 / 409 이미 연결 |
| 연결 목록 | `GET /api/links` | 둘 다 | 없음 | 200 + 연결 배열 | — |
| 공유 켜기/끄기 | `PATCH /api/links/{link_id}/sharing` | 보호자는 항상, 보호 대상은 `can_toggle` 일 때만 | `{on}` | 200 + 연결 | 400 / 403 / 404 |
| 끄기 권한 부여 | `PATCH /api/links/{link_id}/permission` | 보호자 | `{can_toggle}` | 200 + 연결 | 400 / 403 / 404 |
| 연결 해제 | `DELETE /api/links/{link_id}` | 보호자 | 없음 | 200 + message | 403 / 404 |
| 위치 올리기 | `PUT /api/location` | 보호 대상 | `{latitude, longitude}` | 200 `{saved}` | 400 / 403 |

## 2. 규칙

- **연결 코드**: 숫자 6자리, 10분 유효. 새 코드를 만들면 이전 코드는 무효. 연결에 쓴 코드는 바로 지워진다
- **연결 직후**: `sharing: false`, `can_toggle: false`
- **위치 올리기**: 내 위치를 받고 있는(공유가 켜진) 연결이 하나라도 있을 때만 저장하고 `{"saved": true}`. 없으면 저장하지 않고 `{"saved": false}` (오류 아님)
- **위치 저장 방식**: 회원 1명당 마지막 위치 1개만 덮어쓴다. 이동 기록은 남기지 않는다
- **남의 연결**: 내 것이 아닌 `link_id` 는 404

## 3. 연결 응답

내 계정 기준으로 "상대" 정보를 담는다.

```json
{
  "link_id": "0b9e6c1e-....",
  "user_id": "child1234",
  "user_name": "보호대상",
  "role": "protected",
  "sharing": true,
  "can_toggle": false,
  "changed_by": "guardian",
  "latitude": 37.5665,
  "longitude": 126.978,
  "updated_at": 1791262800000
}
```

- `user_id`, `user_name`, `role`: 상대의 아이디 · 이름 · 계정 구분
- `changed_by`: 마지막으로 공유를 켜거나 끈 쪽 (`guardian` / `protected`). 한 번도 안 바꿨으면 `null`
- `latitude`, `longitude`, `updated_at`: **내가 보호자이고 `sharing` 이 true 일 때만** 값이 들어간다. 보호 대상이 조회하거나, 공유가 꺼져 있거나, 아직 위치가 한 번도 안 올라왔으면 `null`

## 4. 프론트에서 쓰는 순서

```
보호 대상: POST /api/invites                → 화면에 code 표시
보호자:    POST /api/links/accept {code}    → 연결됨 (공유 꺼짐)
보호자:    PATCH /api/links/{id}/sharing {on:true}
보호 대상: PUT /api/location {latitude, longitude}   ← 움직일 때 3초, 가만히 있어도 15초마다
보호자:    GET /api/links                   ← 5~10초마다 다시 불러 지도 갱신 (polling)
```

보호 대상 쪽도 `GET /api/links` 를 주기적으로 불러 `sharing` 이 켜졌는지 확인하고, 켜져 있을 때만 위치를 올리면 된다.

## 5. DB

테이블 3개(`user_link`, `link_invite`, `user_location`)와 `users.role` 컬럼이 추가된다. `ddl-auto=update` 라서 서버를 켜면 자동으로 만들어지고, 따로 실행할 SQL 은 없다.
