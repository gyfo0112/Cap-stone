#!/bin/bash
# SafetyMap 회원·연락처·즐겨찾기 API 확인 스크립트
# 사용법:  bash test_api.sh                         (백엔드 8080 으로 직접)
#          bash test_api.sh http://localhost:5173   (프론트 dev 서버를 거쳐서)
BASE="${1:-http://localhost:8080}"
JAR="$(mktemp)"
ID="test$(date +%s)"
PASS=0; FAIL=0

call() { # 이름 기대코드 방식 주소 [본문]
  local name="$1" want="$2" method="$3" path="$4" body="$5" out code
  if [ -n "$body" ]; then
    out=$(curl -s -w '\n%{http_code}' -b "$JAR" -c "$JAR" -X "$method" -H 'Content-Type: application/json' -d "$body" "$BASE$path")
  else
    out=$(curl -s -w '\n%{http_code}' -b "$JAR" -c "$JAR" -X "$method" "$BASE$path")
  fi
  code=$(echo "$out" | tail -n 1)
  BODY=$(echo "$out" | sed '$d')
  if [ "$code" = "$want" ]; then PASS=$((PASS+1)); echo "[성공] $name → $code"; else FAIL=$((FAIL+1)); echo "[실패] $name → $code (기대 $want)"; fi
  echo "       $(echo "$BODY" | cut -c1-200)"
}
pick() { echo "$BODY" | sed -n "s/.*\"$1\":\"\([^\"]*\)\".*/\1/p"; }

echo "== 대상: $BASE / 테스트 아이디: $ID"
call "로그인 전 내 정보"        401 GET  /api/users/me
call "로그인 전 즐겨찾기"       401 GET  /api/favorites
call "가입 필수값 누락"         400 POST /api/users/signup '{"user_id":"'$ID'"}'
call "회원 가입"                201 POST /api/users/signup '{"user_id":"'$ID'","user_pw":"pass1234","user_name":"테스트","info":"010-1234-5678"}'
call "아이디 중복 가입"         409 POST /api/users/signup '{"user_id":"'$ID'","user_pw":"pass1234","user_name":"테스트"}'
call "틀린 비밀번호 로그인"     401 POST /api/users/login  '{"user_id":"'$ID'","user_pw":"wrong"}'
call "로그인"                   200 POST /api/users/login  '{"user_id":"'$ID'","user_pw":"pass1234","keep_login":true}'
call "내 정보"                  200 GET  /api/users/me

TEL="010-$(date +%H%M)-$(date +%S)$((RANDOM%90+10))"
call "연락처 추가"              201 POST /api/users/me/tels '{"tel_name":"엄마","tel_num":"'$TEL'","tel_type":"기본"}'
TEL_UUID=$(pick tel_uuid)
call "같은 번호 다시 추가"      409 POST /api/users/me/tels '{"tel_name":"엄마","tel_num":"'$TEL'","tel_type":"기본"}'
call "연락처 이름 누락"         400 POST /api/users/me/tels '{"tel_num":"010-0000-0000"}'
call "연락처 목록"              200 GET  /api/users/me/tels
call "연락처 삭제"              200 DELETE "/api/users/me/tels/$TEL_UUID"
call "없는 연락처 삭제"         404 DELETE "/api/users/me/tels/$TEL_UUID"

call "장소 즐겨찾기 담기"       201 POST /api/favorites '{"marker_name":"테스트집 '$ID'","latitude":37.5665,"longitude":126.978,"fav_name":"집"}'
MARKER_UUID=$(pick marker_uuid)
call "같은 장소 다시 담기"      409 POST /api/favorites '{"marker_name":"테스트집 '$ID'","latitude":37.5665,"longitude":126.978}'
call "같은 마커 uuid로 담기"    409 POST /api/favorites '{"marker_uuid":"'$MARKER_UUID'"}'
call "없는 마커 담기"           404 POST /api/favorites '{"marker_uuid":"no-such-marker"}'
call "좌표 없이 담기"           400 POST /api/favorites '{"marker_name":"좌표없음"}'
call "즐겨찾기 목록"            200 GET  /api/favorites
call "즐겨찾기 이름 변경"       200 PATCH "/api/favorites/$MARKER_UUID" '{"fav_name":"우리집"}'
call "지도 마커 목록(공개)"     200 GET  "/api/markers?min_latitude=37.56&max_latitude=37.57&min_longitude=126.97&max_longitude=126.98"
if echo "$BODY" | grep -q "테스트집 $ID"; then FAIL=$((FAIL+1)); echo "[실패] 장소(PLACE) 마커가 지도 목록에 노출됨"; else PASS=$((PASS+1)); echo "[성공] 장소(PLACE) 마커는 지도 목록에 안 나옴"; fi
call "즐겨찾기 해제"            200 DELETE "/api/favorites/$MARKER_UUID"
call "해제한 것 다시 해제"      404 DELETE "/api/favorites/$MARKER_UUID"
call "로그아웃"                 200 POST /api/users/logout
call "로그아웃 후 내 정보"      401 GET  /api/users/me

call "아이디 찾기"              200 POST /api/users/find-id '{"user_name":"테스트","info":"01012345678"}'
if echo "$BODY" | grep -q '"te\*'; then PASS=$((PASS+1)); echo "[성공] 찾은 아이디가 가려져서 나옴"; else FAIL=$((FAIL+1)); echo "[실패] 가려진 아이디가 목록에 없음"; fi
call "틀린 번호로 본인 확인"    404 POST /api/users/verify '{"user_id":"'$ID'","user_name":"테스트","info":"010-9999-9999"}'
call "본인 확인"                200 POST /api/users/verify '{"user_id":"'$ID'","user_name":"테스트","info":"010-1234-5678"}'
call "비밀번호 재설정"          200 POST /api/users/reset-password '{"user_id":"'$ID'","user_name":"테스트","info":"010-1234-5678","user_pw":"newpass99"}'
call "옛 비밀번호 로그인"       401 POST /api/users/login  '{"user_id":"'$ID'","user_pw":"pass1234"}'
call "새 비밀번호 로그인"       200 POST /api/users/login  '{"user_id":"'$ID'","user_pw":"newpass99"}'
call "마지막 로그아웃"          200 POST /api/users/logout

rm -f "$JAR"
echo "== 결과: 성공 $PASS / 실패 $FAIL"
