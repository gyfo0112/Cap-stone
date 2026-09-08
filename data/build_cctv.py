"""전국CCTV표준데이터 CSV -> 서울 CCTV 좌표 JSON.

공공데이터포털 "전국CCTV표준데이터" 원본 CSV(cp949)를 읽어
서울 영역만 필터링하고 [경도, 위도] 배열로 저장한다.

사용법:
    python data/build_cctv.py [CSV경로]

기본 CSV 경로는 자료/데이터파일/CCTV정보.csv (저장소 밖, 팀 공유 폴더).
출력: frontend/public/data/cctv-seoul.json
"""

import csv
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DEFAULT_CSV = ROOT.parent / "자료" / "데이터파일" / "CCTV정보.csv"
OUT = ROOT / "frontend" / "public" / "data" / "cctv-seoul.json"

# 서울 대략 경계 (WGS84)
LAT_MIN, LAT_MAX = 37.40, 37.72
LNG_MIN, LNG_MAX = 126.76, 127.19


def main() -> None:
    csv_path = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_CSV
    if not csv_path.exists():
        sys.exit(f"CSV를 찾을 수 없음: {csv_path}")

    points = []
    with open(csv_path, encoding="cp949", newline="") as f:
        for row in csv.DictReader(f):
            try:
                lat = float(row["WGS84위도"])
                lng = float(row["WGS84경도"])
            except (ValueError, KeyError):
                continue
            if LAT_MIN <= lat <= LAT_MAX and LNG_MIN <= lng <= LNG_MAX:
                points.append([round(lng, 5), round(lat, 5)])

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(points, separators=(",", ":")), encoding="utf-8")
    print(f"{len(points):,} points -> {OUT.relative_to(ROOT)} ({OUT.stat().st_size / 1024:.0f} KB)")


if __name__ == "__main__":
    main()
