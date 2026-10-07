이 브랜치는 여러분들의 파일을 받아 제가 결합하고 업데이트하는 브랜치입니다.
이 브랜치를 다운로드 하는 것으로 프로젝트를 배포한다고 생각하시면 됩니다.

# 09/29 10:30 브랜치 생성 및 프로젝트 업로드

# 10/07 13:08 유저정보, 시큐리티 관련, 예외처리 관련 전부 작성 완료. 프론트 분들과 백엔드 분들이 사용할 AI 맥락 전달 프롬프트도 작성해놓을게요. 

## 프론트 분들은 아래 내용을 AI에게 복붙해서 맥락 전달을 하시면 됩니다(10/07 14:15 업데이트) : 
SafetyMap 프로젝트의 프론트엔드 작업을 이어서 진행해주세요.

현재 백엔드의 User/Security 관련 구현은 아래 기준으로 완료되어 있습니다.
프론트 수정 시 이 내용을 최신 연결 계약으로 간주해주세요.

[프로젝트 구조]
- Spring Boot 백엔드
- React + Vite 프론트엔드
- 개발 시 React는 localhost:5173
- Spring Boot는 localhost:8080
- Vite에서 /api 요청은 Spring Boot로 proxy
- 프론트 API 호출은 가능하면 /api/... 상대경로 사용

[인증 방식]
Spring Security의 formLogin + 세션 인증을 사용합니다.

로그인:
POST /login

요청 형식:
application/x-www-form-urlencoded

파라미터:
- user_id
- user_pw

예:
user_id=test&user_pw=1234

로그인 성공 시:
- Spring Security 세션 생성
- JSESSIONID 사용
- 이후 인증이 필요한 API는 세션을 기준으로 현재 사용자를 판별

로그아웃:
POST /logout

현재 CSRF는 SecurityConfig에서 비활성화되어 있습니다.
따라서 프론트에서 CSRF 토큰을 처리할 필요는 없습니다.

세션 쿠키 처리를 위해 fetch 사용 시 필요한 경우:
credentials: 'include'
를 유지해주세요.

[현재 로그인 사용자 조회]
프론트 연결 요구에 맞춰 다음 API가 추가되었습니다.

GET /api/users/me

이 API는 현재 로그인한 사용자의 정보를 반환합니다.

로그인 이후 흐름은 다음과 같이 사용할 수 있습니다.

POST /login
→ 로그인 성공
→ GET /api/users/me
→ 현재 로그인 사용자 정보 획득

클라이언트가 자기 UUID를 미리 알고 있을 필요는 없습니다.

[회원가입]
POST /api/users/signup

중복 user_id:
409 Conflict

비밀번호는 백엔드에서 BCrypt로 암호화하여 저장합니다.

[사용자 정보]
GET /api/users/{user_uuid}

UserPublicDto를 반환합니다.

주의:
비밀번호 및 BCrypt 해시는 프론트에 반환하지 않습니다.

[전화번호 관리]

등록:
POST /api/users/me/tels

Body:
- tel_num
- tel_name
- tel_type

현재 로그인 사용자의 UUID는 서버가 AuthenticationPrincipal에서 가져가므로
프론트가 user_uuid를 별도로 전송하지 않습니다.

목록:
GET /api/users/me/tels/{user_uuid}

URL의 user_uuid와 현재 로그인 사용자의 UUID가 다르면:
403 Forbidden

삭제:
DELETE /api/users/me/tels/{tel_uuid}

삭제 대상 사용자는 서버에서 현재 로그인 사용자를 기준으로 판별합니다.

[비밀번호 변경]
초기 기획에 포함된 기능이므로 프론트에 구현해주세요.

API:
PATCH /api/users/me/password/{user_uuid}

Body는 다음 필드를 사용합니다.

- oldPassword
- newPassword
- confirmNewPassword

예:
{
  "oldPassword": "현재 비밀번호",
  "newPassword": "새 비밀번호",
  "confirmNewPassword": "새 비밀번호 확인"
}

응답/예외:
- 정상 변경 → 성공
- 새 비밀번호와 확인 비밀번호 불일치 → 400 Bad Request
- 현재 비밀번호 불일치 → 400 Bad Request
- URL의 user_uuid가 현재 로그인 사용자와 다름 → 403 Forbidden
- 사용자를 찾을 수 없음 → 404 Not Found

프론트에서는 400 오류를 별도 오류 페이지로 보내기보다
alert 또는 입력창 주변 오류 메시지로 처리하는 것을 권장합니다.

[아이디 찾기 / 비밀번호 찾기]
이 기능은 제거하는 방향입니다.

현재 회원가입 과정에서 이메일, 휴대폰 인증 등의 본인 인증 수단을 받지 않기 때문에
아이디/비밀번호 찾기를 신뢰성 있게 구현할 방법이 없습니다.

따라서 아래 기능 및 관련 화면/API 호출은 제거해주세요.

- /find-id
- /find-password
- /api/users/find-id
- /api/users/verify
- /api/users/reset-password

관련 React Router, 페이지, 버튼, 링크도 함께 정리해주세요.

[공통 예외]
백엔드는 현재 다음 HTTP 상태 코드를 사용합니다.

400 Bad Request
→ 잘못된 입력

403 Forbidden
→ 로그인했지만 해당 사용자 리소스에 접근 권한 없음

404 Not Found
→ 사용자나 리소스 없음

409 Conflict
→ 중복 데이터

500 Internal Server Error
→ 서버 내부 오류

프론트에서 모든 예외를 오류 페이지로 이동시키지 마세요.

권장:
- 400 → alert / inline validation
- 403 → 권한 없음 안내
- 404 → 상황에 따라 404 UI
- 409 → 중복 안내 alert
- 500 → 공통 서버 오류 안내

[Mock 관련]
현재 프론트에는 USE_BACKEND 또는 localStorage 기반 mock 코드가 일부 남아 있을 수 있습니다.

지금 단계에서는 mock 제거를 반드시 수행할 필요는 없지만,
최종 프론트-백엔드 결합 단계에서는 실제 API만 사용하도록 정리할 예정입니다.

따라서 새로운 기능을 추가할 때는 mock보다는 실제 Spring API 계약을 기준으로 작성해주세요.

[작업 요청]
현재 프론트 프로젝트를 확인한 뒤 다음을 우선 반영해주세요.

1. GET /api/users/me 기반 로그인 사용자 조회 반영
2. 아이디 찾기 / 비밀번호 찾기 기능 제거
3. 비밀번호 변경 UI 및 PATCH API 연결
4. 기존 로그인/회원가입/연락처 연결이 위 계약과 일치하는지 점검
5. 백엔드 API 주소나 DTO 형식을 임의로 변경하지 말고, 불일치가 있으면 먼저 알려주세요.



## Posts / 도움요청 백엔드분은 아래 내용을 전달하시면 됩니다 : 
SafetyMap Spring Boot 프로젝트에서 Posts/PostRequest 도움요청 백엔드를 구현해야 합니다.

User/Security/Exception 공통 기반은 이미 다른 담당자가 구현했습니다.
따라서 사용자 인증이나 별도 예외 시스템을 새로 만들지 말고 아래 구조를 재사용해주세요.

[인증 구조]
로그인은 Spring Security session 방식입니다.

인증된 사용자 정보는 Controller에서:

@AuthenticationPrincipal CustomUserDetails userDetails

로 받을 수 있습니다.

CustomUserDetails에는:
- userId
- userPw
- userUuid

가 있으며, 게시글 작성자/요청자 식별에는:

userDetails.getUserUuid()

를 사용하면 됩니다.

사용자 UUID를 클라이언트가 임의로 보내도록 설계하지 말고,
작성자나 도움 요청자처럼 "현재 로그인 사용자"여야 하는 값은 AuthenticationPrincipal에서 가져오세요.

[공통 예외]
이미 exception 패키지에 다음 클래스가 있습니다.

- BadRequestException
- ForbiddenException
- NotFoundException
- ConflictException
- GlobalExceptionHandler

따라서 Posts에서 새로운 전역 예외 처리기를 만들지 마세요.

사용 예:
- 잘못된 요청/상태 → BadRequestException
- 다른 사용자의 게시글 수정/삭제 → ForbiddenException
- 게시글 없음 → NotFoundException
- 중복 도움 신청 → ConflictException

GlobalExceptionHandler가 각각 HTTP 400/403/404/409로 반환합니다.

[예외 처리 원칙]
Controller는 요청/DTO/AuthenticationPrincipal 전달 위주로 얇게 유지하고,
게시글 존재 여부, 작성자 권한, 상태 검사, 중복 신청 등의 판단은 Service에서 처리해주세요.

예:

Posts post = postsRepository.findByPost_uuid(postUuid)
    .orElseThrow(() ->
        new NotFoundException("게시글을 찾을 수 없습니다.")
    );

if (!post.getUser().getUser_uuid().equals(userUuid)) {
    throw new ForbiddenException("게시글을 수정할 권한이 없습니다.");
}

[기존 DB/Entity 기반]
프로젝트에는 이미:
- Posts Entity
- PostRequest Entity
- PostsRepository
- PostRequestRepository

기반이 존재합니다.

기존 Entity/DB 컬럼명을 먼저 확인하고 그 구조에 맞춰 구현해주세요.
Entity를 임의로 재설계하지 마세요.

[필요 기능]
최소 구현 대상으로 생각하는 기능:

1. 도움요청 게시글 작성
2. 게시글 목록 조회
3. 게시글 상세 조회
4. 게시글 수정 또는 상태 변경
5. 게시글 삭제
6. 도움 요청 참여
7. 도움 요청 취소
8. 필요 시 참여/요청 상태 조회

예상 API 골격은:

GET    /api/posts
GET    /api/posts/{post_uuid}
POST   /api/posts
PATCH  /api/posts/{post_uuid}
DELETE /api/posts/{post_uuid}

POST   /api/posts/{post_uuid}/requests
DELETE /api/posts/{post_uuid}/requests

이지만,
프론트의 기존 요청 코드와 Entity 구조를 먼저 확인하고 실제 URL/DTO를 확정해주세요.

[권한 원칙]
- 게시글 작성자 = 로그인 사용자
- 도움 요청자 = 로그인 사용자
- 수정/삭제 = 원칙적으로 작성자만
- 중복 도움 요청 = 차단
- 없는 게시글 요청 = 404
- 타인의 리소스 조작 = 403

[작업 시 주의]
UserService나 SecurityConfig를 새로 만들거나 변경하지 마세요.
필요하면 기존 CustomUserDetails와 공통 Exception을 import해서 사용하면 됩니다.

구현 전에 현재 Posts/PostRequest Entity와 Repository 코드를 먼저 확인하고,
어떤 DTO/Service/Controller가 필요한지 정리한 뒤 단계적으로 작성해주세요.



## Marker / Favorite 백엔드분은 아래 내용을 전달하시면 됩니다 : 
SafetyMap Spring Boot 프로젝트에서 Marker/Favorite 백엔드를 마무리하고 있습니다.

User/Security/Exception 공통 기반은 이미 구현되어 있으므로,
인증/예외 시스템을 새로 만들지 말고 아래 구조를 사용해주세요.

[인증]
즐겨찾기의 현재 로그인 사용자 식별은:

@AuthenticationPrincipal CustomUserDetails userDetails

를 사용합니다.

UUID는:

userDetails.getUserUuid()

로 얻습니다.

Favorite 등록/수정/삭제 시 사용자의 UUID를 클라이언트가 임의로 전달하게 하지 말고,
가능하면 AuthenticationPrincipal 기반으로 현재 사용자를 식별해주세요.

[공통 예외]
exception 패키지에 이미 다음이 존재합니다.

- BadRequestException
- ForbiddenException
- NotFoundException
- ConflictException
- GlobalExceptionHandler

따라서 별도의 FavoriteAlreadyExistsException 같은 클래스를 굳이 추가할 필요 없습니다.

권장:
- 잘못된 요청 → BadRequestException
- 다른 사용자 리소스 조작 → ForbiddenException
- Marker/Favorite 없음 → NotFoundException
- 즐겨찾기 중복 → ConflictException

중복 즐겨찾기는 반드시 HTTP 409로 반환되도록 해주세요.
기존처럼 boolean false + HTTP 200으로 처리하지 않는 방향입니다.

[현재 Marker API]
프론트에서 기대하는 기본 Marker 조회는:

GET /api/markers

query parameter:
- min_latitude
- max_latitude
- min_longitude
- max_longitude
- marker_type (optional)

응답 필드:
- marker_uuid
- marker_name
- marker_type
- latitude
- longitude

단일 조회:
GET /api/markers/{marker_uuid}

Marker의 일반 지도 조회에서는 PLACE 타입을 제외하는 기존 정책이 있습니다.
기존 MarkerController/Service 구현을 먼저 확인하고 유지해주세요.

[Marker 데이터]
marker_type 예:
- SECURITY_LIGHT
- SAFE_HOUSE
- CCTV
- EMERGENCY_BELL
- PLACE

공공데이터 Marker 적재 기능은 이미 별도 import service/runner로 구현되어 있으므로
새로 만들 필요 없습니다.

[현재 Favorite API]
기본 구조:

GET    /api/favorites
POST   /api/favorites
PATCH  /api/favorites/{marker_uuid}
DELETE /api/favorites/{marker_uuid}

Favorite는 로그인 사용자의 것만 조회/조작되어야 합니다.

기존 Marker를 즐겨찾기할 수도 있고,
사용자 지정 위치의 경우 PLACE Marker를 생성해 즐겨찾기로 등록하는 기존 구조가 있습니다.

[예외 적용]
다음 상황을 명확하게 처리해주세요.

1. 같은 사용자가 같은 Marker를 다시 즐겨찾기
→ ConflictException
→ 409 Conflict

2. marker_uuid가 존재하지 않음
→ NotFoundException
→ 404

3. Favorite가 존재하지 않음
→ NotFoundException
→ 404

4. 타인의 Favorite를 수정/삭제하려는 경우
→ ForbiddenException 또는
현재 로그인 사용자 범위로 조회해서 없으면 404로 처리

둘 중 프로젝트의 기존 Repository 구조에 더 자연스러운 방법을 사용해주세요.

[구현 원칙]
Controller는 AuthenticationPrincipal과 DTO 전달 중심으로 두고,
중복/존재/소유권 검사는 Service에서 처리해주세요.

User/Security 코드는 이미 완료됐으므로 해당 구조를 별도로 변경하지 마세요.

작업 시작 시 현재 MarkerController/Service/Repository와
FavoriteController/Service/Repository를 먼저 확인하고,
기존 API와 위 규칙 사이에서 수정할 부분만 제안해주세요.
