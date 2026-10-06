package com.safetymap.safetymap.controller;

import com.safetymap.safetymap.dto.RouteDto;
import com.safetymap.safetymap.service.RouteScorer;
import com.safetymap.safetymap.service.RouteService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/routes")
public class RouteController {

    private final RouteService routeService;

    public RouteController(RouteService routeService) {
        this.routeService = routeService;
    }

    // 길찾기: 출발지~도착지의 "안전 우선 경로"와 "최단 거리" 두 가지 (로그인 불필요)
    // time = now(기본, 지금 시각 기준) | night(야간 기준으로 점수 계산)
    @GetMapping
    public ResponseEntity<?> routes(@RequestParam("origin_latitude") double origin_latitude,
                                    @RequestParam("origin_longitude") double origin_longitude,
                                    @RequestParam("destination_latitude") double destination_latitude,
                                    @RequestParam("destination_longitude") double destination_longitude,
                                    @RequestParam(name = "time", required = false) String time) {
        if (!validPoint(origin_latitude, origin_longitude) || !validPoint(destination_latitude, destination_longitude)) {
            return ResponseEntity.badRequest().body(Map.of("message", "위도·경도 값이 올바르지 않습니다"));
        }
        try {
            List<RouteDto> list = routeService.findRoutes(
                    new RouteScorer.Point(origin_latitude, origin_longitude),
                    new RouteScorer.Point(destination_latitude, destination_longitude),
                    time);
            return ResponseEntity.ok(list);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    private boolean validPoint(double latitude, double longitude) {
        return latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180;
    }
}
