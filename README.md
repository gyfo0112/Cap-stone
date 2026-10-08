# 백엔드 브랜치입니다

0915
  10:54 수정 : 쿼리 raw 수정됨, 백엔드 디렉토리 브랜치에 등록됨. 앞으로 여기 브랜치 디렉토리에서 백엔드 코드를 첨삭해주세요

1006
  마커, 즐겨찾기 수정본입니다.
  고친 부분은 MarkerController, FavoriteController, MarkerService, FavoriteService 입니다.
  오늘 생성한 나머지 코드들은 제 oh-백엔드-작업물 브랜치와 제가 내려받은 파일에만 남겨 두고 작성하였습니다.
  위 4개가 쓰는 MarkerRepository(장소 마커 조회)와 FavoriteRegisterDto(장소 이름 · 좌표 필드)도 함께 올렸습니다.
  주소와 응답 방식은 API_marker_favorite.md 에 정리했습니다. (오민석)

1008
  마커, 즐겨찾기에 조장님 공통 예외(exception 패키지)를 적용했습니다.
  고친 부분은 FavoriteController, FavoriteService, MarkerController, MarkerService 입니다.
  - 같은 마커를 다시 즐겨찾기 → 409 (ConflictException)
  - 없는 marker_uuid, 없는 즐겨찾기 → 404 (NotFoundException)
  - 다른 사람의 즐겨찾기는 로그인 사용자 범위로 조회되므로 찾아지지 않아 404
  - 잘못된 요청(marker_uuid 도 장소 이름·좌표도 없는 요청, 좌표 범위 밖, 뒤집힌 지도 범위) → 400 (BadRequestException)
  - 담기 · 이름 변경 · 해제는 true/false 대신 성공 시 빈 응답(200). 주소와 요청 형식은 그대로
  - 지도 조회에서 PLACE 제외하는 기존 정책은 유지
  프로젝트-결합 최신본에 덮어 로컬 서버에서 API 테스트(test_marker_favorite.sh) 결과 FAIL 없이 통과했습니다.
  자세한 내용은 API_marker_favorite.md 에 정리했습니다. (오민석)
