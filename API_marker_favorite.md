# SafetyMap 지도 묶음 API 명세서 (마커 · 즐겨찾기)

담당: 오민석 · 수정 2026-10-06 · 대상 테이블 `marker`, `favorite`

> 마커, 즐겨찾기 수정본입니다.
> 고친 부분은 `MarkerController`, `FavoriteController`, `MarkerService`, `FavoriteService` 입니다.
> 오늘 생성한 나머지 코드들은 제 `oh-백엔드-작업물` 브랜치와 제가 내려받은 파일에만 남겨 두고 작성하였습니다.
>
> 위 4개가 쓰는 `MarkerRepository`(장소 마커 조회)와 `FavoriteRegisterDto`(장소 이름 · 좌표 필드)도 함께 올렸습니다.

---

## 공통 규칙

| 항목 | 값 |
|---|---|
| 주고받는 형식 | JSON, 키는 스네이크 표기 (`marker_uuid`, `fav_name`) |
| 응답 | 조장님 `UserController` 와 같은 방식. 문구(`message`)와 상태코드 분기 없이 결과만 돌려준다 |
| 조회 | DTO 또는 DTO 배열 |
| 담기 · 이름 변경 · 해제 | `true`(처리함) / `false`(처리하지 않음) |
| 사용자 식별 | 주소에 `user_uuid` 를 넣지 않는다. 로그인 정보에서 꺼낸다 (`@AuthenticationPrincipal CustomUserDetails` → `getUserUuid()`) |
| 로그인 | 마커 조회는 불필요, 즐겨찾기는 전부 필요 |

---

## 한눈에 보는 표

| 기능 | 방식 | 주소 | 응답 |
|---|---|---|---|
| 지도 범위 마커 목록 | GET | `/api/markers?min_latitude=&max_latitude=&min_longitude=&max_longitude=&marker_type=` | 마커 배열 |
| 마커 1개 | GET | `/api/markers/{marker_uuid}` | 마커 (없으면 빈 응답) |
| 내 즐겨찾기 목록 | GET | `/api/favorites` | 즐겨찾기 배열 |
| 즐겨찾기 담기 | POST | `/api/favorites` | `true` / `false` |
| 이름 바꾸기 | PATCH | `/api/favorites/{marker_uuid}` | `true` / `false` |
| 즐겨찾기 해제 | DELETE | `/api/favorites/{marker_uuid}` | `true` / `false` |

---

## 1. 지도 범위 안의 마커 목록

`GET /api/markers`

| 이름 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `min_latitude` | 숫자 | 필수 | 화면 아래쪽(남) 위도 |
| `max_latitude` | 숫자 | 필수 | 화면 위쪽(북) 위도 |
| `min_longitude` | 숫자 | 필수 | 화면 왼쪽(서) 경도 |
| `max_longitude` | 숫자 | 필수 | 화면 오른쪽(동) 경도 |
| `marker_type` | 문자 | 선택 | 종류로 거르기 (`CCTV`, `SECURITY_LIGHT`, `SAFE_HOUSE`, `EMERGENCY_BELL`). 없으면 전부 |

```json
[
  { "marker_uuid": "…", "marker_name": "…", "marker_type": "CCTV", "latitude": 37.5665, "longitude": 126.978 }
]
```

- 범위가 잘못됐거나(최소 > 최대) 해당하는 마커가 없으면 빈 배열 `[]`
- 사용자가 즐겨찾기한 장소(`marker_type = "PLACE"`)는 이 목록에 나오지 않는다

## 2. 마커 1개

`GET /api/markers/{marker_uuid}` → 위와 같은 모양의 마커 1개. 없는 마커면 빈 응답

## 3. 내 즐겨찾기 목록

`GET /api/favorites`

```json
[
  { "user_uuid": "…", "marker_uuid": "…", "marker_name": "서울시청", "marker_type": "PLACE", "latitude": 37.5665, "longitude": 126.978, "fav_name": "서울시청" }
]
```

## 4. 즐겨찾기 담기

`POST /api/favorites` — 아래 두 가지 중 하나로 보낸다

```json
{ "marker_uuid": "이미 있는 마커의 uuid", "fav_name": "자주 가는 길 CCTV" }
```

```json
{ "marker_name": "서울시청", "latitude": 37.5665, "longitude": 126.978, "fav_name": "서울시청" }
```

- 담았으면 `true`
- `false` 인 경우: 이미 담은 마커(장소), 없는 `marker_uuid`, 요청이 비었거나 좌표가 잘못됨
- 두 번째 방식은 프론트의 카카오 검색 장소용이다. 서버가 `marker_type = "PLACE"` 인 마커를 만들어(같은 이름 · 좌표가 있으면 다시 씀) 즐겨찾기로 잇는다. 테이블은 그대로지만 원래 기획에 없던 동작이라 유지 여부 확인이 필요하다

## 5. 즐겨찾기 이름 바꾸기

`PATCH /api/favorites/{marker_uuid}` 요청 `{ "fav_name": "우리집" }` → 바꿨으면 `true`, 내 즐겨찾기에 없는 마커면 `false`. 이름은 50자까지만 저장한다

## 6. 즐겨찾기 해제

`DELETE /api/favorites/{marker_uuid}` → 해제했으면 `true`, 내 즐겨찾기에 없는 마커면 `false`

---

## 확인이 필요한 것

1. 장소 즐겨찾기(`PLACE` 마커 자동 생성)를 유지할지
2. `SecurityConfig` 에서 CSRF 가 켜져 있으면 프론트의 `POST` · `PATCH` · `DELETE /api/favorites` 가 토큰 없이는 403 으로 막힌다
3. 즐겨찾기는 로그인 정보에 `CustomUserDetails` 가 들어 있어야 동작한다
4. 서버를 띄워 호출해 보는 확인은 아직 못 했다 (로그인 연결이 끝나면 가능)
