package com.safetymap.safetymap.service;

import com.safetymap.safetymap.dto.SafetyScoreDto;
import com.safetymap.safetymap.entity.Marker;
import com.safetymap.safetymap.repository.MarkerRepository;
import org.springframework.stereotype.Service;

import java.time.LocalTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

// 안전점수·주변 시설 개수 — DB 의 마커(CCTV·보안등·안심지킴이집·안심벨)를 읽어서 RouteScorer 로 계산한다
@Service
public class SafetyScoreService {

    private static final int NEARBY_MAX_RADIUS_M = 2000;
    private static final double METERS_PER_DEGREE_LAT = 111320.0;

    private final MarkerRepository markerRepository;

    public SafetyScoreService(MarkerRepository markerRepository) {
        this.markerRepository = markerRepository;
    }

    // time 이 "night" 이면 밤, "now"(또는 없음)이면 지금 서울 시각이 19시~6시인지로 정한다
    public boolean isNight(String time) {
        if ("night".equals(time)) {
            return true;
        }
        if ("day".equals(time)) {
            return false;
        }
        int hour = LocalTime.now(ZoneId.of("Asia/Seoul")).getHour();
        return hour >= 19 || hour < 6;
    }

    // 지도 사각형 안의 안전시설을 종류별로 읽어 와 격자에 담는다
    public RouteScorer.MarkerIndex loadIndex(double minLat, double maxLat, double minLng, double maxLng) {
        Map<String, List<RouteScorer.Point>> byType = new HashMap<>();
        for (String type : RouteScorer.TYPES) {
            List<RouteScorer.Point> points = new ArrayList<>();
            for (Marker marker : markerRepository.findAllInBoundsByType(type, minLat, maxLat, minLng, maxLng)) {
                points.add(new RouteScorer.Point(marker.getLatitude(), marker.getLongitude()));
            }
            byType.put(type, points);
        }
        return new RouteScorer.MarkerIndex(byType);
    }

    // 장소 한 곳의 안전점수 — 장소 주변 ±100m 를 50m 간격 격자로 훑어 본다
    public SafetyScoreDto placeScore(double latitude, double longitude, boolean night) {
        double dLat = 150 / METERS_PER_DEGREE_LAT;
        double dLng = 150 / (METERS_PER_DEGREE_LAT * Math.cos(Math.toRadians(latitude)));
        RouteScorer.MarkerIndex index = loadIndex(latitude - dLat, latitude + dLat, longitude - dLng, longitude + dLng);

        List<RouteScorer.Point> grid = new ArrayList<>();
        for (int row = -2; row <= 2; row++) {
            for (int col = -2; col <= 2; col++) {
                grid.add(new RouteScorer.Point(
                        latitude + row * 50 / METERS_PER_DEGREE_LAT,
                        longitude + col * 50 / (METERS_PER_DEGREE_LAT * Math.cos(Math.toRadians(latitude)))));
            }
        }
        RouteScorer.Score result = RouteScorer.score(grid, index, night, RouteScorer.PLACE_RADIUS_M);
        return new SafetyScoreDto(
                result.score(),
                RouteScorer.grade(result.score()),
                result.has_data(),
                (int) RouteScorer.PLACE_RADIUS_M,
                result.has_data() ? RouteScorer.describe(result.counts()) : "이 지역의 안전시설 데이터가 아직 없어요",
                result.counts());
    }

    // 반경(m) 안의 안전시설 개수를 종류별로 센다
    public Map<String, Integer> countNearby(double latitude, double longitude, int radiusM) {
        int radius = Math.max(1, Math.min(radiusM, NEARBY_MAX_RADIUS_M));
        double dLat = radius / METERS_PER_DEGREE_LAT;
        double dLng = radius / (METERS_PER_DEGREE_LAT * Math.cos(Math.toRadians(latitude)));
        RouteScorer.Point center = new RouteScorer.Point(latitude, longitude);

        Map<String, Integer> counts = new LinkedHashMap<>();
        for (String type : RouteScorer.TYPES) {
            int count = 0;
            for (Marker marker : markerRepository.findAllInBoundsByType(type, latitude - dLat, latitude + dLat, longitude - dLng, longitude + dLng)) {
                if (RouteScorer.distanceM(center, new RouteScorer.Point(marker.getLatitude(), marker.getLongitude())) <= radius) {
                    count++;
                }
            }
            counts.put(type, count);
        }
        return counts;
    }
}
