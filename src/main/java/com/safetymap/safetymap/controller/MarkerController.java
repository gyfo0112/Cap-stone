package com.safetymap.safetymap.controller;

import com.safetymap.safetymap.dto.MarkerPublicDto;
import com.safetymap.safetymap.service.MarkerService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

// 지도 마커 조회. 로그인 없이 쓸 수 있다 (SecurityConfig 에서 GET /api/markers/** 공개)
@RestController
@RequestMapping("/api/markers")
public class MarkerController {

    private final MarkerService markerService;

    public MarkerController(MarkerService markerService) {
        this.markerService = markerService;
    }

    // 지도 범위 안의 마커 목록 (marker_type 을 주면 그 종류만)
    @GetMapping
    public List<MarkerPublicDto> markerList(@RequestParam("min_latitude") double min_latitude,
                                            @RequestParam("max_latitude") double max_latitude,
                                            @RequestParam("min_longitude") double min_longitude,
                                            @RequestParam("max_longitude") double max_longitude,
                                            @RequestParam(name = "marker_type", required = false) String marker_type) {

        // 해당하는 마커가 없으면 빈 목록. 범위가 뒤집혀 있으면 400 (MarkerService)
        return markerService.getMarkersInBounds(min_latitude, max_latitude, min_longitude, max_longitude, marker_type);
    }

    // 마커 1개
    @GetMapping("/{marker_uuid}")
    public MarkerPublicDto markerDetail(@PathVariable("marker_uuid") String marker_uuid) {

        // 없는 마커면 404 (MarkerService)
        return markerService.getMarker(marker_uuid);
    }
}
