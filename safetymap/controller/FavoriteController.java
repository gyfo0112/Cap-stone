package com.safetymap.safetymap.controller;

import com.safetymap.safetymap.dto.FavoriteEditRequestDto;
import com.safetymap.safetymap.dto.FavoriteListDto;
import com.safetymap.safetymap.dto.FavoriteRegisterDto;
import com.safetymap.safetymap.service.FavoriteService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/favorites")
public class FavoriteController {

    private final FavoriteService favoriteService;

    public FavoriteController(FavoriteService favoriteService) {
        this.favoriteService = favoriteService;
    }

    // 내 즐겨찾기 목록 보기
    @GetMapping("/{user_uuid}")
    public ResponseEntity<?> favoriteList(@PathVariable("user_uuid") String user_uuid) {
        return ResponseEntity.ok(favoriteService.getFavorites(user_uuid));
    }

    // 즐겨찾기 담기
    @PostMapping("/{user_uuid}")
    public ResponseEntity<?> favoriteAdd(@PathVariable("user_uuid") String user_uuid,
                                         @RequestBody FavoriteRegisterDto dto) {

        if (dto == null || dto.getMarker_uuid() == null || dto.getMarker_uuid().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "marker_uuid는 필수입니다"));
        }

        if (favoriteService.existsFavorite(user_uuid, dto.getMarker_uuid())) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", "이미 즐겨찾기에 등록된 마커입니다"));
        }

        FavoriteListDto saved = favoriteService.addFavorite(user_uuid, dto);

        if (saved == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "사용자 또는 마커를 찾을 수 없습니다"));
        }

        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    // 즐겨찾기 이름 변경
    @PatchMapping("/{user_uuid}/{marker_uuid}")
    public ResponseEntity<?> favoriteRename(@PathVariable("user_uuid") String user_uuid,
                                            @PathVariable("marker_uuid") String marker_uuid,
                                            @RequestBody FavoriteEditRequestDto dto) {

        FavoriteListDto renamed = favoriteService.renameFavorite(user_uuid, marker_uuid, dto);

        if (renamed == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "즐겨찾기를 찾을 수 없습니다"));
        }

        return ResponseEntity.ok(renamed);
    }

    // 즐겨찾기 해제
    @DeleteMapping("/{user_uuid}/{marker_uuid}")
    public ResponseEntity<?> favoriteDelete(@PathVariable("user_uuid") String user_uuid,
                                            @PathVariable("marker_uuid") String marker_uuid) {

        boolean res = favoriteService.deleteFavorite(user_uuid, marker_uuid);

        if (!res) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "즐겨찾기를 찾을 수 없습니다"));
        }

        return ResponseEntity.ok(Map.of("message", "즐겨찾기를 해제했습니다"));
    }
}