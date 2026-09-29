"""공공데이터포털 오픈API -> 전국보안등정보표준데이터 전체 CSV.

포털의 파일 다운로드는 5만 건에서 잘리므로(포털 안내 문구) API로 전부 받는다.
출력 CSV는 포털 CSV와 같은 한글 헤더·CP949 인코딩이라 백엔드 MarkerImportService가
그대로 읽는다(위도/경도 컬럼 이름 동일).

사용법:
    DATA_GO_KR_KEY=발급받은_일반인증키(Decoding) python3 data/fetch_streetlights.py [출력경로]

기본 출력: 자료/데이터파일/전국보안등정보표준데이터_전체.csv (저장소 밖, 팀 공유 폴더)
API: https://www.data.go.kr/data/15017320/standard.do  (오픈 API 탭, 자동승인)
"""

import csv
import json
import os
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DEFAULT_OUT = ROOT.parent / "자료" / "데이터파일" / "전국보안등정보표준데이터_전체.csv"
API_URL = "https://api.data.go.kr/openapi/tn_pubr_public_scrty_lmp_api"
PAGE_SIZE = 1000  # API 최대값

# API 필드 -> 포털 CSV 한글 헤더 (순서도 포털 CSV와 같게).
# 실제 응답은 camelCase(latitude 등)로 오고, 포털 문서에는 LATITUDE 식으로 적혀 있어 둘 다 받는다.
FIELDS = [
    (("lmpLcNm", "LMP_LC_NM"), "보안등위치명"),
    (("installationCo", "INSTALLATION_CO"), "설치개수"),
    (("rdnmadr", "RDNMADR"), "소재지도로명주소"),
    (("lnmadr", "LNMADR"), "소재지지번주소"),
    (("latitude", "LATITUDE"), "위도"),
    (("longitude", "LONGITUDE"), "경도"),
    (("installationYear", "INSTALLATION_YEAR"), "설치연도"),
    (("installationType", "INSTALLATION_TYPE"), "설치형태"),
    (("phoneNumber", "PHONE_NUMBER"), "관리기관전화번호"),
    (("institutionNm", "INSTITUTION_NM"), "관리기관명"),
    (("referenceDate", "REFERENCE_DATE"), "데이터기준일자"),
    (("insttCode", "instt_code"), "제공기관코드"),
    (("insttNm", "instt_nm"), "제공기관명"),
]


def field(item: dict, names: tuple) -> str:
    return next((item[n] for n in names if item.get(n) not in (None, "")), "")


def fetch_page(key: str, page: int) -> dict:
    query = urllib.parse.urlencode(
        {"serviceKey": key, "pageNo": page, "numOfRows": PAGE_SIZE, "type": "json"}
    )
    for attempt in range(3):
        try:
            with urllib.request.urlopen(f"{API_URL}?{query}", timeout=60) as res:
                text = res.read().decode("utf-8")
            try:
                data = json.loads(text)
            except json.JSONDecodeError:
                # 인증키 오류 등은 JSON이 아니라 XML 에러로 온다
                sys.exit(f"API 오류 응답:\n{text[:500]}")
            data = data.get("response", data)  # 실제 응답엔 response 래퍼가 없다
            header = data["header"]
            if header.get("resultCode") not in ("00", "0"):
                sys.exit(f"API 오류: {header}")
            return data["body"]
        except OSError as err:  # 네트워크 일시 오류는 잠깐 쉬고 다시
            print(f"  {page}페이지 재시도 {attempt + 1}/3: {err}")
            time.sleep(3 * (attempt + 1))
    sys.exit(f"{page}페이지를 받지 못했습니다.")


def items_of(body: dict) -> list:
    items = body.get("items") or []
    if isinstance(items, dict):  # {"item": [...]} 형태로 오는 경우
        items = items.get("item") or []
    return [items] if isinstance(items, dict) else items


def main() -> None:
    key = os.environ.get("DATA_GO_KR_KEY")
    if not key:
        sys.exit("DATA_GO_KR_KEY 환경변수에 공공데이터포털 일반 인증키(Decoding)를 넣어주세요.")
    out = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_OUT

    first = fetch_page(key, 1)
    total = int(first.get("totalCount", 0))
    pages = (total + PAGE_SIZE - 1) // PAGE_SIZE
    print(f"전체 {total:,}건 / {pages:,}페이지")

    written = 0
    with out.open("w", encoding="cp949", errors="replace", newline="") as f:
        writer = csv.writer(f)
        writer.writerow([ko for _, ko in FIELDS])
        for page in range(1, pages + 1):
            body = first if page == 1 else fetch_page(key, page)
            for item in items_of(body):
                writer.writerow([field(item, names) for names, _ in FIELDS])
                written += 1
            if page % 50 == 0 or page == pages:
                print(f"  {page:,}/{pages:,}페이지 · {written:,}건")

    print(f"완료: {written:,}건 → {out}")
    if written != total:
        print(f"주의: totalCount({total:,})와 받은 건수가 다릅니다. 다시 실행해 보세요.")


if __name__ == "__main__":
    main()
