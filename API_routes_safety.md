# API 명세 — 길찾기 · 안전점수 · 주변 시설 개수

- 모두 **로그인 불필요**(SecurityConfig 의 `permitAll` 에 `/api/routes`, `/api/safety-score` 추가, `/api/markers/**` 는 이미 공개)
- 실패 응답은 `{ "message": "..." }`, JSON 키는 스네이크 표기
- 안전점수는 DB 의 마커(`CCTV`, `SECURITY_LIGHT`, `SAFE_HOUSE`, `EMERGENCY_BELL`)로 계산한다. 마커 데이터가 적재돼 있어야 점수가 정확하다.

## 1. 길찾기 `GET /api/routes`

| 파라미터 | 설명 |
|---|---|
| `origin_latitude`, `origin_longitude` | 출발지 위도·경도 (필수) |
| `destination_latitude`, `destination_longitude` | 도착지 위도·경도 (필수) |
| `time` | `now`(기본, 지금 서울 시각 19~6시면 야간 기준) · `night`(야간 기준 강제) · `day`(주간 기준 강제) |

성공: `200` + 경로 2개 배열 — `safe`(안전 우선: 후보 중 점수 최고), `shortest`(최단 거리: 후보 중 가장 짧은 길). 두 경로가 같은 길일 수 있다(그땐 `safe` 의 `note` 에 표시).

```json
[
  {
    "route_id": "safe",
    "name": "안전 우선 경로",
    "score": 82,
    "grade": "안전",
    "score_available": true,
    "distance_km": 0.6,
    "duration_min": 8,
    "note": "CCTV 27대 · 보안등 20개 · 안심벨 1개",
    "source": "tmap",
    "counts": { "CCTV": 27, "SECURITY_LIGHT": 20, "SAFE_HOUSE": 0, "EMERGENCY_BELL": 1 },
    "path": [[37.55, 126.92], [37.5513, 126.92]],
    "segments": [
      { "name": "큰길로", "meters": 449, "score": 93, "grade": "안전", "note": "CCTV 22대 · 보안등 20개 · 안심벨 1개" }
    ]
  },
  { "route_id": "shortest", "name": "최단 거리", "...": "..." }
]
```

- `path` : `[위도, 경도]` 쌍 (지도에 선으로 그린다). 최대 400개로 줄여서 준다.
- `grade` : 80↑ 안전 · 60↑ 보통 · 35↑ 주의 · 그 아래 위험 (프론트 `scoreGrade` 와 같은 기준)
- `source` : `tmap`(TMAP 실제 보행자 경로) 또는 `estimate`(TMAP 키가 없거나 호출 실패 → 출발지~도착지 직선 추정, `note` 에 안내 문구)
- `score_available` : 그 지역에 시설 데이터가 하나도 없으면 `false`(점수 0, 등급 "보통")
- 실패: `400` 위도·경도 범위 오류 / 출발지=도착지(10m 이내) / 10km 초과

### 점수 계산 (RouteScorer)
경로를 20m 간격 지점으로 나누고, 지점마다 반경 30m 안에 시설이 있는지 본다. 종류별 "시설이 가까운 지점 비율"의 가중 평균(낮: CCTV 45 · 보안등 40 · 도움시설 15 / 밤: CCTV 30 · 보안등 55 · 도움시설 15). 도움시설(안심지킴이집·안심벨)은 지점의 25%만 덮어도 만점. DB 에 그 종류가 하나도 없으면 그 종류는 빼고 계산한다.

### TMAP 설정
- 환경변수 `TMAP_APP_KEY` (또는 `tmap.app-key` 설정)에 TMAP 앱 키를 넣는다. **코드·저장소에 키를 적지 않는다.**
- 후보 경로: TMAP 보행자 경로(`POST apis.openapi.sk.com/tmap/routes/pedestrian`)를 `searchOption` 4(추천+대로우선) · 10(최단) · 0(추천) 으로 호출. 검색 요청 1번에 TMAP 호출 최대 3번이라 무료 한도(경로탐색 하루 1,000건 안내)를 아끼려고 같은 경로는 10분간 메모리에 둔다.
- `searchOption` 값과 응답 형식은 TMAP 문서 기준으로 작성했고, 실제 키로 한 번 확인이 필요하다.

## 2. 장소 안전점수 `GET /api/safety-score`

`latitude`, `longitude`, (선택) `time` → 장소 주변 ±100m 를 50m 격자로 훑어(반경 60m) 계산.

```json
{ "score": 24, "grade": "위험", "score_available": true, "radius_m": 60, "note": "CCTV 6대 · 보안등 13개", "counts": { "CCTV": 6, "SECURITY_LIGHT": 13, "SAFE_HOUSE": 0, "EMERGENCY_BELL": 0 } }
```

## 3. 주변 시설 개수 `GET /api/markers/nearby-count`

`latitude`, `longitude`, (선택) `radius`(m, 기본 500, 최대 2000) → `{ "CCTV": 12, "SECURITY_LIGHT": 34, "SAFE_HOUSE": 1, "EMERGENCY_BELL": 0 }`

## 테스트
`src/test/java/.../service/RouteScorerTest`(점수 계산), `RouteServiceTest`(TMAP 응답 → 구간 변환). 로컬 확인은 `./mvnw test -Dtest='Route*Test'`.
