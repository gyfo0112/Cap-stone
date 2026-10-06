package com.safetymap.safetymap.service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

// 경로·장소의 안전점수를 계산한다. 스프링과 상관없는 순수 계산이라 단독으로 테스트할 수 있다.
//
// 점수 방식: 경로를 20m 간격 지점으로 나누고, 지점마다 가까운 시설이 있는지 본다(가까운 시설 = 반경 50m 안).
// 시설 종류별로 "시설이 가까이 있는 지점의 비율(커버율)"을 구해 가중 평균을 내고 0~100점으로 만든다.
//   - 낮: CCTV 45% · 보안등 40% · 도움시설(안심지킴이집·안심벨) 15%
//   - 밤: CCTV 30% · 보안등 55% · 도움시설 15%
// DB에 그 종류 시설이 하나도 없으면(데이터 미적재) 그 종류는 점수에서 빼고 나머지로 계산해 억울하게 깎이지 않게 한다.
public class RouteScorer {

    public static final String CCTV = "CCTV";
    public static final String SECURITY_LIGHT = "SECURITY_LIGHT";
    public static final String SAFE_HOUSE = "SAFE_HOUSE";
    public static final String EMERGENCY_BELL = "EMERGENCY_BELL";
    public static final List<String> TYPES = List.of(CCTV, SECURITY_LIGHT, SAFE_HOUSE, EMERGENCY_BELL);

    public static final double STEP_M = 20;          // 경로를 나누는 간격
    // 반경은 서울 CCTV 71,134대로 도심·주택가 5곳을 재서 정했다: 30m는 커버율이 9~30%라 점수가 거의 다 위험으로 나오고,
    // 50m는 21~63%(주택가는 낮고 도심은 높다)로 지역 차이가 보인다. CCTV·보안등이 비추는 거리를 50m 안팎으로 본다.
    public static final double ROUTE_RADIUS_M = 50;  // 경로 점수: 이 안의 시설을 "가까운 시설"로 본다
    public static final double PLACE_RADIUS_M = 80;  // 장소 점수: 장소 주변은 조금 넓게 본다

    public record Point(double lat, double lng) {
    }

    // 점수 결과: 점수(0~100), 종류별 가까운 시설 개수, 계산에 쓸 데이터가 있었는지
    public record Score(int score, Map<String, Integer> counts, boolean has_data) {
    }

    // 두 좌표 사이 거리(m) — 하버사인
    public static double distanceM(Point a, Point b) {
        double r = 6371000;
        double dLat = Math.toRadians(b.lat() - a.lat());
        double dLng = Math.toRadians(b.lng() - a.lng());
        double h = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(a.lat())) * Math.cos(Math.toRadians(b.lat())) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        return 2 * r * Math.asin(Math.min(1, Math.sqrt(h)));
    }

    // 꺾은선 길이(m)
    public static double lengthM(List<Point> path) {
        double sum = 0;
        for (int i = 1; i < path.size(); i++) {
            sum += distanceM(path.get(i - 1), path.get(i));
        }
        return sum;
    }

    // 꺾은선을 stepM 간격으로 촘촘하게 나눈다(처음·끝 점 포함)
    public static List<Point> densify(List<Point> path, double stepM) {
        List<Point> out = new ArrayList<>();
        if (path.isEmpty()) {
            return out;
        }
        out.add(path.get(0));
        for (int i = 1; i < path.size(); i++) {
            Point a = path.get(i - 1);
            Point b = path.get(i);
            double len = distanceM(a, b);
            int parts = (int) Math.floor(len / stepM);
            for (int k = 1; k <= parts; k++) {
                double t = (k * stepM) / len;
                out.add(new Point(a.lat() + (b.lat() - a.lat()) * t, a.lng() + (b.lng() - a.lng()) * t));
            }
            if (len - parts * stepM > 1) {
                out.add(b);
            }
        }
        return out;
    }

    // 시설을 격자(칸 하나 약 35~44m)에 넣어 두고, 지점 반경에 걸치는 칸만 본다
    public static class MarkerIndex {
        private static final double CELL = 0.0004;
        private final Map<String, List<Point>> pointsByType = new HashMap<>();
        private final Map<String, Map<Long, List<Integer>>> gridByType = new HashMap<>();

        public MarkerIndex(Map<String, List<Point>> markersByType) {
            for (String type : TYPES) {
                List<Point> list = markersByType.getOrDefault(type, List.of());
                pointsByType.put(type, list);
                Map<Long, List<Integer>> grid = new HashMap<>();
                for (int i = 0; i < list.size(); i++) {
                    grid.computeIfAbsent(cellKey(list.get(i)), k -> new ArrayList<>()).add(i);
                }
                gridByType.put(type, grid);
            }
        }

        public boolean hasData(String type) {
            return !pointsByType.get(type).isEmpty();
        }

        private static long cellKey(Point p) {
            return cellKey((long) Math.floor(p.lat() / CELL), (long) Math.floor(p.lng() / CELL));
        }

        private static long cellKey(long row, long col) {
            return row * 1_000_003L + col;
        }

        // p에서 radiusM 안에 있는 시설의 번호들
        List<Integer> near(String type, Point p, double radiusM) {
            List<Integer> found = new ArrayList<>();
            long row = (long) Math.floor(p.lat() / CELL);
            long col = (long) Math.floor(p.lng() / CELL);
            Map<Long, List<Integer>> grid = gridByType.get(type);
            List<Point> list = pointsByType.get(type);
            // 반경이 칸보다 크면 그만큼 바깥 칸까지 본다(경도 1칸은 위도 1칸보다 좁다)
            long rowSpan = (long) Math.ceil(radiusM / (CELL * 111320.0));
            long colSpan = (long) Math.ceil(radiusM / (CELL * 111320.0 * Math.cos(Math.toRadians(p.lat()))));
            for (long dr = -rowSpan; dr <= rowSpan; dr++) {
                for (long dc = -colSpan; dc <= colSpan; dc++) {
                    List<Integer> cell = grid.get(cellKey(row + dr, col + dc));
                    if (cell == null) {
                        continue;
                    }
                    for (int idx : cell) {
                        if (distanceM(p, list.get(idx)) <= radiusM) {
                            found.add(idx);
                        }
                    }
                }
            }
            return found;
        }
    }

    // 지점 목록(이미 촘촘히 나눈 경로 또는 장소 주변 격자)의 안전점수
    public static Score score(List<Point> points, MarkerIndex index, boolean night, double radiusM) {
        Map<String, Integer> counts = new LinkedHashMap<>();
        Map<String, Double> coverage = new HashMap<>();
        for (String type : TYPES) {
            Set<Integer> distinct = new HashSet<>();
            int covered = 0;
            for (Point p : points) {
                List<Integer> near = index.near(type, p, radiusM);
                if (!near.isEmpty()) {
                    covered++;
                    distinct.addAll(near);
                }
            }
            counts.put(type, distinct.size());
            coverage.put(type, points.isEmpty() ? 0 : (double) covered / points.size());
        }

        double wCctv = night ? 0.30 : 0.45;
        double wLight = night ? 0.55 : 0.40;
        double wHelp = 0.15;
        double sum = 0;
        double weights = 0;
        if (index.hasData(CCTV)) {
            sum += wCctv * coverage.get(CCTV);
            weights += wCctv;
        }
        if (index.hasData(SECURITY_LIGHT)) {
            sum += wLight * coverage.get(SECURITY_LIGHT);
            weights += wLight;
        }
        if (index.hasData(SAFE_HOUSE) || index.hasData(EMERGENCY_BELL)) {
            // 도움시설은 드물어서, 지점의 25%에만 있어도 만점으로 본다
            double help = Math.min(1, 4 * (coverage.get(SAFE_HOUSE) + coverage.get(EMERGENCY_BELL)));
            sum += wHelp * help;
            weights += wHelp;
        }
        if (weights == 0) {
            return new Score(0, counts, false);
        }
        return new Score((int) Math.round(100 * sum / weights), counts, true);
    }

    // 점수 → 등급 (프론트 scoreGrade와 같은 기준: 80↑ 안전, 60↑ 보통, 35↑ 주의, 그 아래 위험)
    public static String grade(int score) {
        if (score >= 80) {
            return "안전";
        }
        if (score >= 60) {
            return "보통";
        }
        if (score >= 35) {
            return "주의";
        }
        return "위험";
    }

    // 개수 → "CCTV 12대 · 보안등 34개 · 안심지킴이집 1곳" (0인 종류는 뺀다)
    public static String describe(Map<String, Integer> counts) {
        List<String> parts = new ArrayList<>();
        addPart(parts, "CCTV", counts.get(CCTV), "대");
        addPart(parts, "보안등", counts.get(SECURITY_LIGHT), "개");
        addPart(parts, "안심지킴이집", counts.get(SAFE_HOUSE), "곳");
        addPart(parts, "안심벨", counts.get(EMERGENCY_BELL), "개");
        return parts.isEmpty() ? "주변에 등록된 안전시설이 없어요" : String.join(" · ", parts);
    }

    private static void addPart(List<String> parts, String label, Integer count, String unit) {
        if (count != null && count > 0) {
            parts.add(label + " " + count + unit);
        }
    }
}
