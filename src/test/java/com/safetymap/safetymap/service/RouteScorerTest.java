package com.safetymap.safetymap.service;

import com.safetymap.safetymap.service.RouteScorer.Point;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class RouteScorerTest {

    private static final double M_PER_DEG_LNG = 111320 * Math.cos(Math.toRadians(37.5));

    // 서울 위도에서 동쪽으로 200m 직선
    private final List<Point> path = List.of(new Point(37.5, 127.0), new Point(37.5, 127.0 + 200 / M_PER_DEG_LNG));

    // 길 따라 40m마다(5m 옆) 시설 6개
    private List<Point> alongPath() {
        List<Point> list = new ArrayList<>();
        for (int i = 0; i <= 5; i++) {
            list.add(new Point(37.50005, 127.0 + (i * 40) / M_PER_DEG_LNG));
        }
        return list;
    }

    @Test
    void densify_나누는_개수() {
        assertEquals(11, RouteScorer.densify(path, 20).size());
        assertEquals(200, RouteScorer.lengthM(path), 1);
    }

    @Test
    void 낮과_밤은_가중치가_달라_보안등이_없으면_밤에_더_불리하다() {
        var index = new RouteScorer.MarkerIndex(Map.of(
                RouteScorer.CCTV, alongPath(),
                RouteScorer.SECURITY_LIGHT, List.of(new Point(37.51, 127.01)))); // 보안등은 1km 밖
        List<Point> dense = RouteScorer.densify(path, RouteScorer.STEP_M);

        var day = RouteScorer.score(dense, index, false, RouteScorer.ROUTE_RADIUS_M);
        var night = RouteScorer.score(dense, index, true, RouteScorer.ROUTE_RADIUS_M);

        assertEquals(6, day.counts().get(RouteScorer.CCTV));
        assertEquals(0, day.counts().get(RouteScorer.SECURITY_LIGHT));
        assertEquals(53, day.score());   // 0.45 / (0.45 + 0.40)
        assertEquals(35, night.score()); // 0.30 / (0.30 + 0.55)
    }

    @Test
    void 데이터가_없는_종류는_점수에서_뺀다() {
        List<Point> dense = RouteScorer.densify(path, RouteScorer.STEP_M);
        var onlyCctv = new RouteScorer.MarkerIndex(Map.of(RouteScorer.CCTV, alongPath()));
        assertEquals(100, RouteScorer.score(dense, onlyCctv, false, RouteScorer.ROUTE_RADIUS_M).score());

        var empty = new RouteScorer.MarkerIndex(Map.of());
        var none = RouteScorer.score(dense, empty, false, RouteScorer.ROUTE_RADIUS_M);
        assertFalse(none.has_data());
        assertEquals(0, none.score());
    }

    @Test
    void 반경_밖의_시설은_세지_않는다() {
        Point p = new Point(37.5, 127.0);
        var index = new RouteScorer.MarkerIndex(Map.of(RouteScorer.CCTV, List.of(new Point(37.5, 127.0 + 25 / M_PER_DEG_LNG))));
        assertEquals(1, RouteScorer.score(List.of(p), index, false, 30).counts().get(RouteScorer.CCTV));
        assertEquals(0, RouteScorer.score(List.of(p), index, false, 20).counts().get(RouteScorer.CCTV));
    }

    @Test
    void 등급_경계값은_프론트와_같다() {
        assertEquals("안전", RouteScorer.grade(80));
        assertEquals("보통", RouteScorer.grade(79));
        assertEquals("보통", RouteScorer.grade(60));
        assertEquals("주의", RouteScorer.grade(59));
        assertEquals("주의", RouteScorer.grade(35));
        assertEquals("위험", RouteScorer.grade(34));
    }

    @Test
    void 설명_문구는_0인_종류를_뺀다() {
        assertEquals("CCTV 12대 · 보안등 34개 · 안심지킴이집 1곳",
                RouteScorer.describe(Map.of(RouteScorer.CCTV, 12, RouteScorer.SECURITY_LIGHT, 34, RouteScorer.SAFE_HOUSE, 1, RouteScorer.EMERGENCY_BELL, 0)));
        assertTrue(RouteScorer.describe(Map.of()).contains("없어요"));
    }
}
