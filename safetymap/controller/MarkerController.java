package com.safetymap.safetymap.controller;

import com.safetymap.safetymap.dto.MarkerPublicDto;
import com.safetymap.safetymap.service.MarkerService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/markers")
public class MarkerController {

    private final MarkerService markerService;

    public MarkerController(MarkerService markerService) {
        this.markerService = markerService;
    }

    // 지도 범위 안의 마커 목록 보기
    @GetMapping
    public ResponseEntity<?> markerList(@RequestParam("min_latitude") double min_latitude,
                                        @RequestParam("max_latitude") double max_latitude,
                                        @RequestParam("min_longitude") double min_longitude,
                                        @RequestParam("max_longitude") double max_longitude,
                                        @RequestParam(name = "marker_type", required = false) String marker_type) {

        if (min_latitude > max_latitude || min_longitude > max_longitude) {
            return ResponseEntity.badRequest().body(Map.of("message", "지도 범위가 올바르지 않습니다"));
        }

        List<MarkerPublicDto> list = markerService.getMarkersInBounds(min_latitude, max_latitude, min_longitude, max_longitude, marker_type);

        return ResponseEntity.ok(list);
    }

    // 마커 1개 보기
    @GetMapping("/{marker_uuid}")
    public ResponseEntity<?> markerDetail(@PathVariable("marker_uuid") String marker_uuid) {
        MarkerPublicDto dto = markerService.getMarker(marker_uuid);

        if (dto == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "마커를 찾을 수 없습니다"));
        }

        return ResponseEntity.ok(dto);
    }
}