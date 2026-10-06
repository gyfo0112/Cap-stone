package com.safetymap.safetymap.service;

import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

// TMAP 보행자 경로 응답(GeoJSON)을 후보 경로로 바꾸는 부분 — 실제 응답 모양을 흉내 낸 값으로 확인한다
class RouteServiceTest {

    private static Map<String, Object> point(String description) {
        return Map.of("type", "Feature",
                "geometry", Map.of("type", "Point", "coordinates", List.of(126.9, 37.5)),
                "properties", Map.of("description", description));
    }

    private static Map<String, Object> line(String name, int distance, double[][] coords) {
        List<List<Double>> list = new java.util.ArrayList<>();
        for (double[] c : coords) {
            list.add(List.of(c[0], c[1]));
        }
        return Map.of("type", "Feature",
                "geometry", Map.of("type", "LineString", "coordinates", list),
                "properties", Map.of("name", name, "distance", distance, "time", distance));
    }

    @Test
    void 길_이름이_같으면_한_구간으로_합치고_Point는_건너뛴다() {
        Map<String, Object> first = Map.of("type", "Feature",
                "geometry", Map.of("type", "Point", "coordinates", List.of(126.9, 37.5)),
                "properties", Map.of("totalDistance", 320, "totalTime", 250));
        Map<String, Object> response = Map.of("type", "FeatureCollection", "features", List.of(
                first,
                line("서교로", 100, new double[][]{{126.9000, 37.5000}, {126.9010, 37.5000}}),
                line("서교로", 100, new double[][]{{126.9010, 37.5000}, {126.9020, 37.5000}}),
                point("직진"),
                line("", 120, new double[][]{{126.9020, 37.5000}, {126.9020, 37.5010}})));

        RouteService.Candidate c = RouteService.parseTmap(response);

        assertEquals(320, c.distance_m());
        assertEquals(250, c.time_s());
        assertEquals("tmap", c.source());
        assertEquals(4, c.path().size());        // 이어지는 점(중복)은 한 번만: A-B-C-D
        assertEquals(2, c.segs().size());        // 서교로(합침) + 이름 없는 길
        assertEquals("서교로", c.segs().get(0).name());
        assertEquals("보행자도로", c.segs().get(1).name()); // 이름이 비어 오면 일반 보행로로 본다
        assertEquals(37.5, c.path().get(0).lat());
        assertEquals(126.9, c.path().get(0).lng()); // 좌표는 [경도, 위도] 순서로 온다
    }

    @Test
    void 아주_짧은_구간은_앞_구간에_합친다() {
        Map<String, Object> response = Map.of("features", List.of(
                line("큰길", 200, new double[][]{{126.9000, 37.5000}, {126.9020, 37.5000}}),
                line("계단", 5, new double[][]{{126.9020, 37.5000}, {126.90201, 37.5000}})));
        RouteService.Candidate c = RouteService.parseTmap(response);
        assertEquals(1, c.segs().size());
        assertEquals("큰길", c.segs().get(0).name());
    }

    @Test
    void 전체_거리가_없으면_좌표로_계산한다() {
        Map<String, Object> response = Map.of("features", List.of(
                line("길", 0, new double[][]{{126.9000, 37.5000}, {126.9010, 37.5000}})));
        RouteService.Candidate c = RouteService.parseTmap(response);
        assertTrue(c.distance_m() > 80 && c.distance_m() < 100, "약 88m: " + c.distance_m());
    }

    @Test
    void 이상한_응답은_null() {
        assertNull(RouteService.parseTmap(null));
        assertNull(RouteService.parseTmap(Map.of()));
        assertNull(RouteService.parseTmap(Map.of("features", List.of(point("출발")))));
    }

    // 실제 TMAP 응답(서울역→시청)처럼 큰길 사이에 짧은 보행로·횡단보도 조각이 끼어 오는 경우
    @Test
    void 실제처럼_잘게_쪼개진_구간은_큰길_중심으로_정리된다() {
        String[] names = {"보행자도로", "보행자도로", "보행자도로", "퇴계로", "보행자도로", "퇴계로", "보행자도로", "보행자도로", "보행자도로", "퇴계로",
                "세종대로", "보행자도로", "보행자도로", "보행자도로", "세종대로", "보행자도로", "세종대로", "보행자도로", "세종대로", "보행자도로",
                "보행자도로", "소공로", "을지로", "보행자도로", "보행자도로"};
        int[] meters = {22, 32, 28, 114, 23, 18, 7, 19, 19, 11, 502, 38, 16, 42, 375, 15, 64, 19, 14, 33, 67, 24, 111, 15, 16};
        List<RouteScorer.Point> whole = new java.util.ArrayList<>();
        List<RouteService.Seg> raw = new java.util.ArrayList<>();
        double lat = 37.55;
        for (int i = 0; i < names.length; i++) {
            List<RouteScorer.Point> part = List.of(new RouteScorer.Point(lat, 126.97), new RouteScorer.Point(lat + meters[i] / 111320.0, 126.97));
            raw.add(new RouteService.Seg(names[i], part));
            lat += meters[i] / 111320.0;
        }
        double rawTotal = raw.stream().mapToDouble(sg -> RouteScorer.lengthM(sg.path())).sum();

        List<RouteService.Seg> tidy = RouteService.tidySegments(raw);

        double tidyTotal = tidy.stream().mapToDouble(sg -> RouteScorer.lengthM(sg.path())).sum();
        assertEquals(rawTotal, tidyTotal, 1);                                   // 길이는 그대로
        assertTrue(tidy.size() <= 7, "구간 수: " + tidy.size());
        assertTrue(tidy.stream().allMatch(sg -> RouteScorer.lengthM(sg.path()) >= 50), "50m 미만 구간이 남음");
        // 중간에 96m 보행로가 끼어 세종대로는 두 구간이 되지만, 잔 조각 없이 합쳐서 큰길 길이가 거의 그대로 남는다
        double sejong = tidy.stream().filter(sg -> sg.name().equals("세종대로")).mapToDouble(sg -> RouteScorer.lengthM(sg.path())).sum();
        assertTrue(sejong >= 950, "세종대로 합계: " + sejong);
    }
}
