package com.safetymap.safetymap.controller;

import com.safetymap.safetymap.service.SafetyScoreService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api")
public class SafetyScoreController {

    private final SafetyScoreService safetyScoreService;

    public SafetyScoreController(SafetyScoreService safetyScoreService) {
        this.safetyScoreService = safetyScoreService;
    }

    // 장소 한 곳의 안전점수 (홈 카드·최근 검색에 보여줄 점수). 로그인 불필요
    @GetMapping("/safety-score")
    public ResponseEntity<?> safetyScore(@RequestParam("latitude") double latitude,
                                         @RequestParam("longitude") double longitude,
                                         @RequestParam(name = "time", required = false) String time) {
        if (!validPoint(latitude, longitude)) {
            return ResponseEntity.badRequest().body(Map.of("message", "위도·경도 값이 올바르지 않습니다"));
        }
        return ResponseEntity.ok(safetyScoreService.placeScore(latitude, longitude, safetyScoreService.isNight(time)));
    }

    // 반경(m) 안의 안전시설 개수를 종류별로: { "CCTV": 12, "SECURITY_LIGHT": 34, "SAFE_HOUSE": 1, "EMERGENCY_BELL": 0 }
    // radius 기본 500, 최대 2000. 주소가 /api/markers 아래라 마커 공개 설정(permitAll)을 그대로 쓴다.
    @GetMapping("/markers/nearby-count")
    public ResponseEntity<?> nearbyCount(@RequestParam("latitude") double latitude,
                                         @RequestParam("longitude") double longitude,
                                         @RequestParam(name = "radius", defaultValue = "500") int radius) {
        if (!validPoint(latitude, longitude) || radius < 1) {
            return ResponseEntity.badRequest().body(Map.of("message", "위도·경도 또는 반경 값이 올바르지 않습니다"));
        }
        return ResponseEntity.ok(safetyScoreService.countNearby(latitude, longitude, radius));
    }

    private boolean validPoint(double latitude, double longitude) {
        return latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180;
    }
}
