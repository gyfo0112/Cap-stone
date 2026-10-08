#!/bin/bash
# SafetyMap 마커 · 즐겨찾기 예외 처리 검사 (10-08, 오민석)
# 스프링 서버(8080)를 켠 상태에서 실행:  bash test_marker_favorite.sh
# 실행할 때마다 검사용 회원 2명(testa시각, testb시각)을 새로 만든다. 지우는 SQL은 맨 아래에 있다.

BASE=${BASE:-http://localhost:8080}
T=$(date +%H%M%S)
A_ID="testa$T"
B_ID="testb$T"
PW="test1234"
PLACE_NAME="검사장소$T"
DIR=$(mktemp -d)
JA=$DIR/a.txt   # A 로그인 쿠키
JB=$DIR/b.txt   # B 로그인 쿠키
PASS=0
FAIL=0
BOX="min_latitude=37.55&max_latitude=37.58&min_longitude=126.96&max_longitude=127.00"

# call 방식 주소 [JSON본문] [쿠키파일]  → CODE(상태코드), OUT(응답 본문)
call() {
  local args=(-s -o "$DIR/out" -w '%{http_code}' -X "$1")
  [ -n "$4" ] && args+=(-b "$4")
  [ -n "$3" ] && args+=(-H 'Content-Type: application/json' --data "$3")
  CODE=$(curl "${args[@]}" "$BASE$2")
  OUT=$(cat "$DIR/out")
}

# check 이름 기대코드
check() {
  if [ "$CODE" = "$2" ]; then
    echo "PASS  $1 → $CODE"
    PASS=$((PASS + 1))
  else
    echo "FAIL  $1 → $CODE (기대 $2)  ${OUT:0:150}"
    FAIL=$((FAIL + 1))
  fi
}

# ok 이름 조건결과(0=참)
ok() {
  if [ "$2" = "0" ]; then echo "PASS  $1"; PASS=$((PASS + 1)); else echo "FAIL  $1"; FAIL=$((FAIL + 1)); fi
}

login() { # 아이디 쿠키파일 → 성공하면 0
  local to
  to=$(curl -s -c "$2" -o /dev/null -w '%{redirect_url}' -d "user_id=$1&user_pw=$PW" "$BASE/login")
  [[ "$to" != *error* && -n "$to" ]]
}

echo "== 서버 연결 확인 ($BASE)"
call GET "/api/markers?$BOX"
if [ "$CODE" = "000" ]; then
  echo "서버에 연결할 수 없습니다. IntelliJ에서 SafetyMapApplication 을 먼저 실행하세요."
  exit 1
fi

echo
echo "== 준비: 검사용 회원 A($A_ID), B($B_ID) 가입·로그인"
call POST /api/users/signup "{\"user_name\":\"검사A\",\"user_id\":\"$A_ID\",\"user_pw\":\"$PW\",\"info\":\"\"}"
check "A 회원가입" 200
call POST /api/users/signup "{\"user_name\":\"검사B\",\"user_id\":\"$B_ID\",\"user_pw\":\"$PW\",\"info\":\"\"}"
check "B 회원가입" 200
login "$A_ID" "$JA"; ok "A 로그인" $?
login "$B_ID" "$JB"; ok "B 로그인" $?

echo
echo "== 마커"
call GET "/api/markers?$BOX"
check "지도 범위 마커 목록" 200
REAL=$(echo "$OUT" | grep -o '"marker_uuid" *: *"[^"]*"' | head -1 | cut -d'"' -f4)
[ -z "$REAL" ] && echo "      (이 범위에 공공데이터 마커가 없어 '기존 마커 즐겨찾기' 검사는 건너뜀)"
call GET "/api/markers?min_latitude=37.58&max_latitude=37.55&min_longitude=126.96&max_longitude=127.00"
check "뒤집힌 지도 범위 → 400" 400
call GET "/api/markers?$BOX&marker_type=PLACE"
check "marker_type=PLACE 조회" 200
ok "  └ PLACE 는 빈 목록" $([ "$OUT" = "[]" ]; echo $?)
call GET /api/markers/없는-마커-uuid
check "없는 마커 단건 조회 → 404" 404
if [ -n "$REAL" ]; then
  call GET "/api/markers/$REAL"
  check "있는 마커 단건 조회" 200
fi

echo
echo "== 즐겨찾기: 로그인·요청 검사"
call GET /api/favorites
check "로그인 없이 목록 → 로그인 화면으로 이동(302)" 302
call POST /api/favorites '{}' "$JA"
check "빈 요청 {} → 400" 400
call POST /api/favorites '{"marker_name":"범위밖","latitude":99,"longitude":127}' "$JA"
check "좌표 범위 밖 → 400" 400
call POST /api/favorites '{"marker_uuid":"없는-마커-uuid"}' "$JA"
check "없는 marker_uuid 담기 → 404" 404

echo
echo "== 즐겨찾기: 장소 담기 · 중복"
call POST /api/favorites "{\"marker_name\":\"$PLACE_NAME\",\"latitude\":37.5665,\"longitude\":126.978,\"fav_name\":\"$PLACE_NAME\"}" "$JA"
check "장소 담기" 200
ok "  └ 성공 응답 본문은 비어 있음" $([ -z "$OUT" ]; echo $?)
call POST /api/favorites "{\"marker_name\":\"$PLACE_NAME\",\"latitude\":37.5665,\"longitude\":126.978,\"fav_name\":\"$PLACE_NAME\"}" "$JA"
check "같은 장소 다시 담기 → 409" 409
echo "      응답 문구: $OUT"
call GET /api/favorites "" "$JA"
check "A 즐겨찾기 목록" 200
PLACE_UUID=$(echo "$OUT" | grep -o '"marker_uuid" *: *"[^"]*"' | head -1 | cut -d'"' -f4)
ok "  └ 담은 장소가 목록에 있음" $(echo "$OUT" | grep -q "$PLACE_NAME"; echo $?)
if [ -z "$PLACE_UUID" ]; then
  echo "목록에서 marker_uuid 를 읽지 못해 이후 검사를 멈춥니다. 응답: ${OUT:0:200}"
  exit 1
fi
call GET "/api/markers?$BOX"
ok "지도 마커 목록에는 PLACE 가 안 나옴" $(echo "$OUT" | grep -q '"marker_type" *: *"PLACE"'; [ $? -ne 0 ]; echo $?)

if [ -n "$REAL" ]; then
  echo
  echo "== 즐겨찾기: 기존 마커 담기 · 중복"
  call POST /api/favorites "{\"marker_uuid\":\"$REAL\",\"fav_name\":\"검사마커\"}" "$JA"
  check "기존 마커 담기" 200
  call POST /api/favorites "{\"marker_uuid\":\"$REAL\",\"fav_name\":\"검사마커\"}" "$JA"
  check "같은 마커 다시 담기 → 409" 409
  call DELETE "/api/favorites/$REAL" "" "$JA"
  check "기존 마커 즐겨찾기 해제" 200
fi

echo
echo "== 즐겨찾기: 이름 변경 · 다른 사람 접근 · 해제"
call PATCH "/api/favorites/$PLACE_UUID" '{"fav_name":"바꾼이름"}' "$JA"
check "이름 변경" 200
call GET /api/favorites "" "$JA"
ok "  └ 목록에 바뀐 이름 반영" $(echo "$OUT" | grep -q '바꾼이름'; echo $?)
call PATCH /api/favorites/없는-마커-uuid '{"fav_name":"x"}' "$JA"
check "없는 즐겨찾기 이름 변경 → 404" 404
call PATCH "/api/favorites/$PLACE_UUID" '{"fav_name":"남이바꿈"}' "$JB"
check "B가 A의 즐겨찾기 이름 변경 → 404" 404
call DELETE "/api/favorites/$PLACE_UUID" "" "$JB"
check "B가 A의 즐겨찾기 해제 → 404" 404
call GET /api/favorites "" "$JA"
ok "  └ A의 즐겨찾기는 그대로 남아 있음" $(echo "$OUT" | grep -q "$PLACE_UUID"; echo $?)
call DELETE "/api/favorites/$PLACE_UUID" "" "$JA"
check "A 즐겨찾기 해제" 200
call DELETE "/api/favorites/$PLACE_UUID" "" "$JA"
check "이미 해제한 것 다시 해제 → 404" 404

echo
echo "== 참고 (점수에 넣지 않음. 지금 구조에서 어떻게 나오는지 보는 용도)"
CODE=$(curl -s -o /dev/null -w '%{http_code}' -X POST -b "$JA" -H 'Content-Type: application/json' "$BASE/api/favorites")
echo "      본문 없이 담기 요청 → $CODE  (500이면 조장님 GlobalExceptionHandler 의 공통 처리에 걸린 것)"
BODY="{\"marker_name\":\"동시$PLACE_NAME\",\"latitude\":37.5,\"longitude\":127.0}"
curl -s -o /dev/null -w '%{http_code}' -X POST -b "$JA" -H 'Content-Type: application/json' --data "$BODY" "$BASE/api/favorites" > "$DIR/c1" &
curl -s -o /dev/null -w '%{http_code}' -X POST -b "$JA" -H 'Content-Type: application/json' --data "$BODY" "$BASE/api/favorites" > "$DIR/c2" &
wait
echo "      같은 장소 동시에 2번 담기 → $(cat "$DIR/c1"), $(cat "$DIR/c2")  (200·409 가 정상, 500이 섞이면 빠른 두 번 클릭 문제)"

echo
echo "결과: PASS $PASS / FAIL $FAIL"
rm -rf "$DIR"

# ── 검사 데이터 지우기 (MySQL Workbench 에서 실행) ──
# SET SQL_SAFE_UPDATES = 0;
# DELETE FROM favorite WHERE user_uuid IN (SELECT user_uuid FROM users WHERE user_id LIKE 'testa%' OR user_id LIKE 'testb%');
# DELETE FROM users WHERE user_id LIKE 'testa%' OR user_id LIKE 'testb%';
# DELETE FROM marker WHERE marker_type = 'PLACE' AND (marker_name LIKE '검사장소%' OR marker_name LIKE '동시검사장소%');
