package com.safetymap.safetymap.controller;

import com.safetymap.safetymap.dto.FavoriteEditRequestDto;
import com.safetymap.safetymap.dto.FavoriteListDto;
import com.safetymap.safetymap.dto.FavoriteRegisterDto;
import com.safetymap.safetymap.service.FavoriteService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

// 즐겨찾기. 모두 로그인이 필요하고, 로그인한 사용자 본인의 즐겨찾기만 다룬다
// (누구의 즐겨찾기인지는 주소가 아니라 로그인 정보에서 꺼낸다: authentication.getName() = user_uuid)
@RestController
@RequestMapping("/api/favorites")
public class FavoriteController {

    private final FavoriteService favoriteService;

    public FavoriteController(FavoriteService favoriteService) {
        this.favoriteService = favoriteService;
    }

    // 내 즐겨찾기 목록 보기
    @GetMapping
    public ResponseEntity<?> favoriteList(Authentication authentication) {
        return ResponseEntity.ok(favoriteService.getFavorites(authentication.getName()));
    }

    // 즐겨찾기 담기
    //  1) 이미 있는 마커:  { "marker_uuid": "...", "fav_name": "..." }
    //  2) 검색한 장소:     { "marker_name": "우리집", "latitude": 37.5, "longitude": 127.0, "fav_name": "집" }
    @PostMapping
    public ResponseEntity<?> favoriteAdd(Authentication authentication,
                                         @RequestBody FavoriteRegisterDto dto) {

        String user_uuid = authentication.getName();

        if (dto == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "요청 내용이 비어 있습니다"));
        }

        boolean byMarker = dto.getMarker_uuid() != null && !dto.getMarker_uuid().isBlank();

        if (byMarker) {
            if (favoriteService.existsFavorite(user_uuid, dto.getMarker_uuid())) {
                return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", "이미 즐겨찾기에 등록된 마커입니다"));
            }
        } else {
            if (dto.getMarker_name() == null || dto.getMarker_name().isBlank() || dto.getLatitude() == null || dto.getLongitude() == null) {
                return ResponseEntity.badRequest().body(Map.of("message", "marker_uuid 또는 marker_name, latitude, longitude가 필요합니다"));
            }

            if (dto.getLatitude() < -90 || dto.getLatitude() > 90 || dto.getLongitude() < -180 || dto.getLongitude() > 180) {
                return ResponseEntity.badRequest().body(Map.of("message", "좌표가 올바르지 않습니다"));
            }

            if (favoriteService.existsPlaceFavorite(user_uuid, dto)) {
                return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", "이미 즐겨찾기에 등록된 장소입니다"));
            }
        }

        FavoriteListDto saved = favoriteService.addFavorite(user_uuid, dto);

        if (saved == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "사용자 또는 마커를 찾을 수 없습니다"));
        }

        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    // 즐겨찾기 이름 변경
    @PatchMapping("/{marker_uuid}")
    public ResponseEntity<?> favoriteRename(Authentication authentication,
                                            @PathVariable("marker_uuid") String marker_uuid,
                                            @RequestBody FavoriteEditRequestDto dto) {

        FavoriteListDto renamed = favoriteService.renameFavorite(authentication.getName(), marker_uuid, dto);

        if (renamed == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "즐겨찾기를 찾을 수 없습니다"));
        }

        return ResponseEntity.ok(renamed);
    }

    // 즐겨찾기 해제
    @DeleteMapping("/{marker_uuid}")
    public ResponseEntity<?> favoriteDelete(Authentication authentication,
                                            @PathVariable("marker_uuid") String marker_uuid) {

        boolean res = favoriteService.deleteFavorite(authentication.getName(), marker_uuid);

        if (!res) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "즐겨찾기를 찾을 수 없습니다"));
        }

        return ResponseEntity.ok(Map.of("message", "즐겨찾기를 해제했습니다"));
    }
}
