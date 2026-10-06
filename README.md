# oh-백엔드-작업물 (오민석)

회원 · 보호자 연락처 · 즐겨찾기 백엔드 작업물만 모아 둔 브랜치입니다.
`프로젝트-결합` 브랜치(09-29 `ae3f87b`)와 **같은 경로**로 들어 있어서, 그대로 복사해 덮어쓰면 붙습니다.

## 붙이는 법

1. 이 브랜치의 `src` 폴더를 결합 프로젝트의 `src` 폴더 위에 그대로 복사합니다 (같은 이름의 파일은 덮어쓰기).
2. `users` 테이블이 이미 만들어져 있으면 DB에서 한 번 실행합니다. 비밀번호 암호문(BCrypt)이 60자라서 30자 칸에는 저장되지 않습니다.
   ```sql
   ALTER TABLE users MODIFY user_pw VARCHAR(100) NOT NULL;
   ```
3. `SafetyMapApplication` 을 실행하고, 터미널에서 `bash test_api.sh` 를 돌려 마지막 줄이 `실패 0` 인지 확인합니다.

## 파일 목록

경로는 모두 `src/main/java/com/safetymap/safetymap/` 아래입니다.

| 폴더 | 파일 | 구분 | 역할 |
|---|---|---|---|
| `config` | `SecurityConfig` | **공용 파일 수정** | 어떤 주소가 로그인 없이 열리는지 정함. 로그인 안 하고 보호된 API 를 부르면 401 JSON |
| `controller` | `UserApiController` | 새 파일 | 가입 · 로그인 · 로그아웃 · 내 정보 · 아이디 찾기 · 비밀번호 재설정 (`/api/users`) |
| `controller` | `UserTelController` | 새 파일 | 보호자 연락처 목록 · 추가 · 삭제 (`/api/users/me/tels`) |
| `controller` | `FavoriteController` | 수정 | 즐겨찾기 목록 · 담기 · 이름 변경 · 해제 (`/api/favorites`). 주소에서 `user_uuid` 를 뺌 |
| `service` | `UserService` | 수정 | 회원 · 연락처의 실제 처리 (비밀번호 암호화, 로그인 확인, 본인 확인) |
| `service` | `FavoriteService` | 수정 | 즐겨찾기 처리. 주석이던 담기 기능을 살리고 장소 담기 추가 |
| `service` | `MarkerService` | 수정 | 장소(`PLACE`) 마커 만들기 추가, 지도 목록에서는 `PLACE` 제외 |
| `repository` | `UsersRepository` | 수정 | uuid · 아이디 · 이름으로 회원 조회, 아이디 중복 확인 |
| `repository` | `UserTelRepository` | 수정 | 내 연락처 목록, 내 연락처 1개, 번호 중복 확인 |
| `repository` | `MarkerRepository` | 수정 | 같은 이름 · 좌표의 장소 마커 조회 추가, 범위 조회에서 `PLACE` 제외 |
| `dto` | `UserInfoDto` | 새 파일 | 프론트에 돌려주는 회원 정보 (비밀번호 없음) |
| `dto` | `UserLoginRequestDto` | 새 파일 | 로그인 요청 (`user_id`, `user_pw`, `keep_login`) |
| `dto` | `UserFindRequestDto` | 새 파일 | 아이디 찾기 · 본인 확인 · 비밀번호 재설정 요청 |
| `dto` | `FavoriteRegisterDto` | 수정 | 즐겨찾기 담기 요청. 장소 이름 · 좌표 필드 추가 |
| `dto` | `UserRegisterDto`, `UserTelRegisterDto`, `UserTelListDto` | 수정 | JSON 을 받을 수 있게 빈 생성자만 추가 |
| `entity` | `Users` | **공용 파일 수정** | `user_pw` 길이 30 → 100 (한 줄) |

그 밖에 맨 위 폴더에 `API_users_tel_favorite.md`(프론트 전달용 API 명세서)와 `test_api.sh`(API 전체를 호출해 보는 확인 스크립트)가 있습니다.

## API 한눈에

| 영역 | 주소 | 로그인 |
|---|---|---|
| 회원 | `POST /api/users/signup` · `login` · `logout` | 불필요 |
| 회원 | `GET /api/users/me` | 필요 |
| 계정 찾기 | `POST /api/users/find-id` · `verify` · `reset-password` | 불필요 |
| 보호자 연락처 | `GET` · `POST /api/users/me/tels`, `DELETE /api/users/me/tels/{tel_uuid}` | 필요 |
| 즐겨찾기 | `GET` · `POST /api/favorites`, `PATCH` · `DELETE /api/favorites/{marker_uuid}` | 필요 |

요청 · 응답 예시는 `API_users_tel_favorite.md` 에 있습니다.

## 다른 컨트롤러에서 로그인한 사용자 꺼내는 법

```java
@PostMapping
public ResponseEntity<?> postUpload(Authentication authentication, @RequestBody ...) {
    String user_uuid = authentication.getName();   // 로그인한 사용자의 user_uuid
}
```

`/api/**` 는 `SecurityConfig` 의 공개 목록에 없으면 자동으로 로그인이 필요합니다. 로그인 없이 열어야 하는 API(예: 도움요청 글 보기)는 `SecurityConfig` 의 `permitAll()` 목록에 주소를 추가해 주세요.

## 조장님 확인이 필요한 결정

1. 로그인은 **세션 방식**(JSESSIONID 쿠키)입니다. JWT 가 아닙니다.
2. 공용 파일 `SecurityConfig` 와 `Users` 를 수정했습니다. CSRF 검사는 껐습니다.
3. 휴대폰 번호를 `users.info` 컬럼에 저장합니다. 전용 컬럼이 낫다면 스키마 변경이 필요합니다.
4. 비밀번호 재설정이 이름 + 휴대폰 번호만 맞으면 됩니다 (프론트 화면 흐름 그대로, 문자 인증 같은 본인 인증은 없음).
5. `user_tel.tel_num` 이 전체에서 unique 라, 다른 회원이 이미 등록한 번호는 409 가 납니다.
6. `UserController` 의 `GET /login`(템플릿 반환)은 손대지 않았습니다.

## 추가: 실시간 위치 공유 (10-06)

보호자와 보호 대상 계정을 연결 코드로 잇고, 보호 대상의 위치를 보호자에게 보여주는 기능입니다. 로컬에서 `bash test_links.sh` 로 43개 항목을 확인했습니다.

| 폴더 | 파일 | 구분 | 역할 |
|---|---|---|---|
| `entity` | `Users` | **공용 파일 수정** | 계정 구분 `role` 컬럼 추가 (`guardian` / `protected`) |
| `entity` | `UserLink`, `LinkInvite`, `UserLocation` | 새 파일 | 연결, 연결 코드, 마지막 위치 (테이블 3개가 새로 생김) |
| `repository` | `UserLinkRepository`, `LinkInviteRepository`, `UserLocationRepository` | 새 파일 | 위 세 테이블 조회 |
| `service` | `LinkService` | 새 파일 | 코드 발급 · 연결 · 공유 켜기/끄기 · 권한 · 해제 · 위치 저장 |
| `controller` | `LinkController` | 새 파일 | `/api/invites`, `/api/links`, `/api/location` |
| `dto` | `Link*Dto`, `LocationRequestDto` | 새 파일 | 요청 · 응답 모양 |
| `dto` · `service` · `controller` | `UserRegisterDto`, `UserInfoDto`, `UserService`, `UserApiController` | 수정 | 가입 요청과 회원 응답에 `role` 추가 |

| 기능 | 주소 | 누가 |
|---|---|---|
| 연결 코드 발급 | `POST /api/invites` | 보호 대상 |
| 코드로 연결 | `POST /api/links/accept` | 보호자 |
| 연결 목록 | `GET /api/links` | 둘 다 (보호자에게만 상대 위치) |
| 공유 켜기/끄기 | `PATCH /api/links/{link_id}/sharing` | 보호자는 항상, 보호 대상은 허용받았을 때만 |
| 끄기 권한 부여 | `PATCH /api/links/{link_id}/permission` | 보호자 |
| 연결 해제 | `DELETE /api/links/{link_id}` | 보호자 |
| 위치 올리기 | `PUT /api/location` | 보호 대상 |

- 요청 · 응답 예시와 규칙은 `API_links_location.md` 에 있습니다.
- DB: `user_link`, `link_invite`, `user_location` 테이블과 `users.role` 컬럼이 서버를 켤 때 자동으로 만들어집니다 (`ddl-auto=update`). 따로 실행할 SQL 은 없습니다.
- 조장님 확인: 공용 엔티티 `Users` 에 컬럼을 추가했고 테이블 3개가 늘었습니다 (ERD 변경). 위치는 회원당 마지막 1건만 저장합니다.
- 프론트의 위치 공유 화면은 아직 브라우저 저장 방식이라, 이 API 로 바꾸는 프론트 작업이 따로 필요합니다.

## 들어 있지 않은 것

- 프론트 연결 파일(`frontend/src/api/usersApi.js`, `data/auth.js` 등)은 이 브랜치에 없습니다. 화면이 이 API 를 부르게 하려면 프론트 쪽 수정이 따로 필요합니다.
- `application.properties`, 마커 CSV 데이터는 없습니다.
