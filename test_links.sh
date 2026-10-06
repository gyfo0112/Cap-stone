#!/bin/bash
# SafetyMap 위치 공유 API 확인 스크립트 (보호자 1명 + 보호 대상 1명을 만들어 순서대로 호출)
# 사용법:  bash test_links.sh                         (백엔드 8080 으로 직접)
#          bash test_links.sh http://localhost:5173   (프론트 dev 서버를 거쳐서)
BASE="${1:-http://localhost:8080}"
JAR_G="$(mktemp)"; JAR_P="$(mktemp)"; JAR="$JAR_G"
T="$(date +%s)"; GID="g$T"; PID="p$T"
PASS=0; FAIL=0

as() { if [ "$1" = "보호자" ]; then JAR="$JAR_G"; else JAR="$JAR_P"; fi; WHO="$1"; }
call() { # 이름 기대코드 방식 주소 [본문]
  local name="$1" want="$2" method="$3" path="$4" body="$5" out code
  if [ -n "$body" ]; then
    out=$(curl -s -w '\n%{http_code}' -b "$JAR" -c "$JAR" -X "$method" -H 'Content-Type: application/json' -d "$body" "$BASE$path")
  else
    out=$(curl -s -w '\n%{http_code}' -b "$JAR" -c "$JAR" -X "$method" "$BASE$path")
  fi
  code=$(echo "$out" | tail -n 1)
  BODY=$(echo "$out" | sed '$d')
  if [ "$code" = "$want" ]; then PASS=$((PASS+1)); echo "[성공] ($WHO) $name → $code"; else FAIL=$((FAIL+1)); echo "[실패] ($WHO) $name → $code (기대 $want)"; fi
  echo "       $(echo "$BODY" | cut -c1-220)"
}
has() { # 이름 찾을문자열  — 직전 응답에 문자열이 있어야 성공
  if echo "$BODY" | grep -q "$2"; then PASS=$((PASS+1)); echo "[성공] $1"; else FAIL=$((FAIL+1)); echo "[실패] $1 (응답에 $2 없음)"; fi
}
pick() { echo "$BODY" | sed -n "s/.*\"$1\":\"\([^\"]*\)\".*/\1/p"; }

echo "== 대상: $BASE / 보호자: $GID / 보호 대상: $PID"
as 보호자
call "로그인 전 연결 목록"            401 GET  /api/links
call "가입 (role 잘못된 값)"          400 POST /api/users/signup '{"user_id":"'$GID'","user_pw":"pass1234","user_name":"보호자","role":"admin"}'
call "보호자 가입"                    201 POST /api/users/signup '{"user_id":"'$GID'","user_pw":"pass1234","user_name":"보호자","info":"010-1111-0000","role":"guardian"}'
has  "가입 응답에 role=guardian" '"role":"guardian"'
call "보호자 로그인"                  200 POST /api/users/login  '{"user_id":"'$GID'","user_pw":"pass1234"}'
as "보호 대상"
call "보호 대상 가입"                 201 POST /api/users/signup '{"user_id":"'$PID'","user_pw":"pass1234","user_name":"보호대상","info":"010-2222-0000","role":"protected"}'
call "보호 대상 로그인"               200 POST /api/users/login  '{"user_id":"'$PID'","user_pw":"pass1234"}'
call "내 정보"                        200 GET  /api/users/me
has  "내 정보에 role=protected" '"role":"protected"'

as 보호자
call "보호자가 코드 발급 시도"        403 POST /api/invites
as "보호 대상"
call "연결 코드 발급"                 201 POST /api/invites
call "연결 코드 다시 발급"            201 POST /api/invites
CODE=$(pick code)
call "보호 대상이 코드로 연결 시도"   403 POST /api/links/accept '{"code":"'$CODE'"}'
as 보호자
call "없는 코드로 연결"               404 POST /api/links/accept '{"code":"000000"}'
call "코드 없이 연결"                 400 POST /api/links/accept '{}'
call "코드로 연결"                    201 POST /api/links/accept '{"code":"'$CODE'"}'
LINK=$(pick link_id)
has  "연결 직후 공유는 꺼짐" '"sharing":false'
call "쓴 코드로 다시 연결"            404 POST /api/links/accept '{"code":"'$CODE'"}'

as "보호 대상"
call "공유 꺼진 상태에서 위치 올리기" 200 PUT  /api/location '{"latitude":37.5665,"longitude":126.978}'
has  "저장되지 않음" '"saved":false'
call "허용 없이 공유 켜기 시도"       403 PATCH "/api/links/$LINK/sharing" '{"on":true}'
as 보호자
call "on 없이 공유 켜기"              400 PATCH "/api/links/$LINK/sharing" '{}'
call "공유 켜기"                      200 PATCH "/api/links/$LINK/sharing" '{"on":true}'
has  "changed_by=guardian" '"changed_by":"guardian"'
call "보호자가 위치 올리기 시도"      403 PUT  /api/location '{"latitude":37.5,"longitude":127.0}'
as "보호 대상"
call "잘못된 좌표"                    400 PUT  /api/location '{"latitude":999,"longitude":126.978}'
call "위치 올리기"                    200 PUT  /api/location '{"latitude":37.5665,"longitude":126.978}'
has  "저장됨" '"saved":true'
call "보호 대상의 연결 목록"          200 GET  /api/links
has  "보호 대상에게는 위치가 안 나감" '"latitude":null'
as 보호자
call "보호자의 연결 목록"             200 GET  /api/links
has  "보호자에게 상대 위치가 보임" '"latitude":37.5665'

as "보호 대상"
call "보호 대상이 권한 변경 시도"     403 PATCH "/api/links/$LINK/permission" '{"can_toggle":true}'
as 보호자
call "켜기/끄기 권한 주기"            200 PATCH "/api/links/$LINK/permission" '{"can_toggle":true}'
as "보호 대상"
call "허용받은 뒤 공유 끄기"          200 PATCH "/api/links/$LINK/sharing" '{"on":false}'
has  "changed_by=protected" '"changed_by":"protected"'
as 보호자
call "공유 꺼진 뒤 연결 목록"         200 GET  /api/links
has  "공유가 꺼지면 위치가 안 나감" '"latitude":null'

as "보호 대상"
call "보호 대상이 연결 해제 시도"     403 DELETE "/api/links/$LINK"
as 보호자
call "연결 해제"                      200 DELETE "/api/links/$LINK"
call "해제한 연결 다시 해제"          404 DELETE "/api/links/$LINK"
call "해제 후 연결 목록"              200 GET  /api/links
has  "목록이 비어 있음" '^\[\]$'

rm -f "$JAR_G" "$JAR_P"
echo "== 결과: 성공 $PASS / 실패 $FAIL"
