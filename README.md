이 브랜치는 여러분들의 파일을 받아 제가 결합하고 업데이트하는 브랜치입니다.
이 브랜치를 다운로드 하는 것으로 프로젝트를 배포한다고 생각하시면 됩니다.

# 09/29 10:30 브랜치 생성 및 프로젝트 업로드

# 10/07 13:08 유저정보, 시큐리티 관련, 예외처리 관련 전부 작성 완료. 프론트 분들과 백엔드 분들이 사용할 AI 맥락 전달 프롬프트도 작성해놓을게요. 

# 10/10 10:52 마커, 즐겨찾기 백엔드 결합 및 테스트 완료

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
