# SafetyMap 지도 묶음 API 명세서

담당: 오민석 · 작성 2026-09-22 · 대상 테이블 `marker`, `favorite`

> 프론트(웹·앱) 담당자는 이 문서만 보면 된다. 백엔드 코드를 볼 필요는 없다.
> 서버 주소는 개발 중 `http://localhost:8080` 을 앞에 붙인다.

---

## 공통 규칙

| 항목 | 값 |
|---|---|
| 주고받는 형식 | JSON |
| 성공 상태코드 | 200 (조회·수정·삭제) / 201 (생성) |
| 실패 응답 모양 | `{ "message": "사람이 읽을 수 있는 설명" }` |
| JSON 키 표기 | **스네이크 표기** (`marker_uuid`, `fav_name`) — DB 컬럼명과 동일 |
| 사용자 식별 | 지금은 주소에 `user_uuid`를 직접 넣는다. 로그인 연동 후 바뀔 수 있음 |

---

## 1. 지도 범위 안의 마커 목록

지도를 움직이거나 확대·축소할 때마다, **현재 화면에 보이는 사각형 영역** 안의 안전시설만 가져온다.

```
GET /api/markers
```

**보내는 것 (주소 뒤 물음표 파라미터)**

| 이름 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `min_latitude` | 숫자 | 필수 | 화면 아래쪽(남) 위도 |
| `max_latitude` | 숫자 | 필수 | 화면 위쪽(북) 위도 |
| `min_longitude` | 숫자 | 필수 | 화면 왼쪽(서) 경도 |
| `max_longitude` | 숫자 | 필수 | 화면 오른쪽(동) 경도 |
| `marker_type` | 문자 | 선택 | 종류로 거르기 (`CCTV`, `LAMP` 등). 없으면 전부 |

**호출 예시**

```
GET /api/markers?min_latitude=37.55&max_latitude=37.57&min_longitude=126.97&max_longitude=127.00
GET /api/markers?min_latitude=37.55&max_latitude=37.57&min_longitude=126.97&max_longitude=127.00&marker_type=CCTV
```

**성공 200**

```json
[
  {
    "marker_uuid": "0c1f...9a2",
    "marker_name": "역삼로 CCTV 3번",
    "marker_type": "CCTV",
    "latitude": 37.5601,
    "longitude": 126.9812
  }
]
```

**실패 400** — 남북·동서가 뒤집혀 들어온 경우

```json
{ "message": "지도 범위가 올바르지 않습니다" }
```

---

## 2. 마커 1개 상세

마커를 탭했을 때 뜨는 하단 시트/말풍선에 쓴다.

```
GET /api/markers/{marker_uuid}
```

**호출 예시** `GET /api/markers/0c1f...9a2`

**성공 200**

```json
{
  "marker_uuid": "0c1f...9a2",
  "marker_name": "역삼로 CCTV 3번",
  "marker_type": "CCTV",
  "latitude": 37.5601,
  "longitude": 126.9812
}
```

**실패 404**

```json
{ "message": "마커를 찾을 수 없습니다" }
```

---

## 3. 내 즐겨찾기 목록

"즐겨찾기" 탭에 뿌릴 목록. 마커 정보가 **함께** 들어 있어 추가 호출이 필요 없다.

```
GET /api/favorites/{user_uuid}
```

**성공 200** (즐겨찾기가 없으면 빈 배열 `[]`)

```json
[
  {
    "user_uuid": "aa11...ff0",
    "marker_uuid": "0c1f...9a2",
    "marker_name": "역삼로 CCTV 3번",
    "marker_type": "CCTV",
    "latitude": 37.5601,
    "longitude": 126.9812,
    "fav_name": "집 앞 CCTV"
  }
]
```

`fav_name`은 사용자가 붙인 별명이다. 안 붙였으면 `null`이므로, 화면에서는 `fav_name ?? marker_name` 으로 표시하면 된다.

---

## 4. 즐겨찾기 담기

마커 상세에서 별 아이콘을 눌렀을 때.

```
POST /api/favorites/{user_uuid}
```

**보내는 것 (본문 JSON)**

```json
{ "marker_uuid": "0c1f...9a2", "fav_name": "집 앞 CCTV" }
```

`fav_name`은 생략 가능하다(`null` 또는 키 자체를 빼도 된다). 50자를 넘으면 잘린다.

**성공 201** — 방금 담긴 즐겨찾기 1건 (모양은 3번과 동일)

**실패**

| 코드 | 언제 | 응답 |
|---|---|---|
| 400 | `marker_uuid`가 비었을 때 | `{ "message": "marker_uuid는 필수입니다" }` |
| 404 | 그런 사용자나 마커가 없을 때 | `{ "message": "사용자 또는 마커를 찾을 수 없습니다" }` |
| 409 | 이미 담아둔 마커일 때 | `{ "message": "이미 즐겨찾기에 등록된 마커입니다" }` |

---

## 5. 즐겨찾기 이름 바꾸기

```
PATCH /api/favorites/{user_uuid}/{marker_uuid}
```

**보내는 것**

```json
{ "fav_name": "새 이름" }
```

**성공 200** — 바뀐 즐겨찾기 1건 (모양은 3번과 동일)
**실패 404** — `{ "message": "즐겨찾기를 찾을 수 없습니다" }`

---

## 6. 즐겨찾기 해제

별 아이콘을 다시 눌렀을 때.

```
DELETE /api/favorites/{user_uuid}/{marker_uuid}
```

**성공 200**

```json
{ "message": "즐겨찾기를 해제했습니다" }
```

**실패 404** — `{ "message": "즐겨찾기를 찾을 수 없습니다" }`

---

## 한눈에 보는 표

| 기능 | 방식 | 주소 | 성공 |
|---|---|---|---|
| 지도 범위 마커 목록 | GET | `/api/markers?min_latitude=…` | 200 + 배열 |
| 마커 1개 | GET | `/api/markers/{marker_uuid}` | 200 + 객체 |
| 내 즐겨찾기 목록 | GET | `/api/favorites/{user_uuid}` | 200 + 배열 |
| 즐겨찾기 담기 | POST | `/api/favorites/{user_uuid}` | 201 + 객체 |
| 이름 바꾸기 | PATCH | `/api/favorites/{user_uuid}/{marker_uuid}` | 200 + 객체 |
| 즐겨찾기 해제 | DELETE | `/api/favorites/{user_uuid}/{marker_uuid}` | 200 + message |

---

## 프론트에서 부르는 예시 (fetch)

```js
// 지도 범위 마커 불러오기
const bounds = map.getBounds();               // 카카오맵에서 현재 화면 범위 얻기
const params = new URLSearchParams({
  min_latitude:  bounds.getSouthWest().getLat(),
  max_latitude:  bounds.getNorthEast().getLat(),
  min_longitude: bounds.getSouthWest().getLng(),
  max_longitude: bounds.getNorthEast().getLng(),
});

const res = await fetch(`/api/markers?${params}`);
const markers = await res.json();

// 즐겨찾기 담기
await fetch(`/api/favorites/${userUuid}`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ marker_uuid: markerUuid, fav_name: "집 앞 CCTV" }),
});
```

---

## 아직 정해지지 않은 것

- 로그인 연동 후 `user_uuid`를 주소에서 빼고 로그인 정보에서 꺼낼지 — 팀장 결정 대기
- `marker_type`에 들어갈 값의 목록(`CCTV` / `LAMP` / …) — 데이터 적재 담당과 확정 필요
