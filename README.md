이 브랜치는 여러분들의 파일을 받아 제가 결합하고 업데이트하는 브랜치입니다.
이 브랜치를 다운로드 하는 것으로 프로젝트를 배포한다고 생각하시면 됩니다.

# 09/29 10:30 브랜치 생성 및 프로젝트 업로드

# 10/07 13:08 유저정보, 시큐리티 관련, 예외처리 관련 전부 작성 완료. 프론트 분들과 백엔드 분들이 사용할 AI 맥락 전달 프롬프트도 작성해놓을게요. 

## 프론트 분들은 아래 내용을 AI에게 복붙해서 맥락 전달을 하시면 됩니다 : 
현재 Spring Boot + React(Vite) 기반 SafetyMap 프로젝트를 개발 중입니다.

아래는 백엔드 User/Security 구현의 최신 상태입니다. 이 내용을 현재 프로젝트의 확정된 백엔드 계약으로 간주하고, 프론트엔드 API 연결 작업 시 기준으로 사용해주세요.

[기본 구조]
- Spring Boot: localhost:8080
- React/Vite: localhost:5173
- Vite에서 /api 요청은 Spring Boot 8080으로 proxy
- React에서는 가능하면 절대주소가 아니라 /api/... 상대경로 사용
- 최종적으로 npm run build:spring을 통해 Spring static 리소스로 빌드 예정

[Spring Security]
Spring Security의 formLogin + 세션 인증을 사용합니다.

로그인:
POST /login

파라미터명:
- user_id
- user_pw

중요:
Spring Security formLogin이므로 로그인 요청은 JSON이 아니라
application/x-www-form-urlencoded 형식으로 보내야 합니다.

예:
user_id=test&user_pw=1234

로그인 성공:
- 서버 세션 생성
- JSESSIONID 쿠키 사용
- 기본 성공 위치는 /
- 이후 인증 API에서는 세션을 기반으로 사용자 판별

로그아웃:
POST /logout

비로그인 상태에서 보호된 경로 접근 시 현재는 별도의 401 JSON 처리를 만들지 않았고,
Spring Security의 로그인 페이지 /login 리다이렉트 동작을 사용합니다.

[회원가입]
POST /api/users/signup

JSON Body:
UserRegisterDto 형식

회원가입 ID가 중복되면:
409 Conflict

[사용자 정보]
GET /api/users/{user_uuid}

응답은 UserPublicDto입니다.
비밀번호 및 BCrypt 해시는 응답하지 않습니다.

[전화번호]
전화번호 등록:
POST /api/users/me/tels

- 로그인 사용자 UUID는 서버에서 AuthenticationPrincipal을 통해 얻습니다.
- 따라서 user_uuid를 body에 별도로 보낼 필요 없습니다.
- Body는 UserTelRegisterDto

전화번호 목록:
GET /api/users/me/tels/{user_uuid}

- URL의 user_uuid와 로그인 사용자의 UUID가 다르면 403

전화번호 삭제:
DELETE /api/users/me/tels/{tel_uuid}

- 사용자 UUID는 AuthenticationPrincipal에서 판별
- 다른 사용자의 연락처를 삭제할 수 없음

[비밀번호 변경]
PATCH /api/users/me/password/{user_uuid}

Body:
UserPasswordChangeDto
- oldPassword
- newPassword
- confirmNewPassword

URL의 user_uuid와 로그인 사용자의 UUID가 다르면:
403 Forbidden

새 비밀번호와 확인 비밀번호 불일치:
400 Bad Request

현재 비밀번호 불일치:
400 Bad Request

[공통 백엔드 예외]
현재 공통 예외 체계:
- 400 Bad Request
- 403 Forbidden
- 404 Not Found
- 409 Conflict
- 500 Internal Server Error

프론트에서는 모든 오류를 오류 페이지로 이동시키지 말고 상황에 따라 처리해주세요.

권장:
- 400: alert 또는 input 주변 메시지
- 403: 권한 없음 메시지 또는 필요 시 오류 페이지
- 404: 대상 자체가 없으면 404 UI
- 409: 중복 등의 alert
- 500: 공통 서버 오류 처리

[중요]
현재 프론트에 mock/localStorage 구현이 일부 존재할 수 있습니다.
백엔드 연결 대상 기능에서는 실제 API 호출로 전환해주세요.

기존 API 호출 코드와 현재 백엔드 계약이 다를 경우 백엔드 계약을 기준으로 수정하되,
임의로 백엔드 API 주소를 변경하지 말고 차이가 있으면 먼저 알려주세요.

또한 CSRF 설정은 실제 SecurityConfig를 확인한 뒤 작업해주세요.
추측으로 CSRF를 비활성화했다고 가정하지 마세요.



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
