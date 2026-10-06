package com.safetymap.safetymap.controller;

import com.safetymap.safetymap.dto.FavoriteEditRequestDto;
import com.safetymap.safetymap.dto.FavoriteListDto;
import com.safetymap.safetymap.dto.FavoriteRegisterDto;
import com.safetymap.safetymap.security.CustomUserDetails;
import com.safetymap.safetymap.service.FavoriteService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

// 즐겨찾기. 모두 로그인이 필요하고, 로그인한 사용자 본인의 즐겨찾기만 다룬다
// 누구의 즐겨찾기인지는 UserController 와 같은 방식으로 로그인 정보에서 꺼낸다 (userDetails.getUserUuid())
@RestController
@RequestMapping("/api/favorites")
public class FavoriteController {

    private final FavoriteService favoriteService;

    public FavoriteController(FavoriteService favoriteService) {
        this.favoriteService = favoriteService;
    }

    // 내 즐겨찾기 목록
    @GetMapping
    public List<FavoriteListDto> favoriteList(@AuthenticationPrincipal CustomUserDetails userDetails) {

        return favoriteService.getFavorites(userDetails.getUserUuid());
    }

    // 즐겨찾기 담기
    //  1) 이미 있는 마커:  { "marker_uuid": "...", "fav_name": "..." }
    //  2) 검색한 장소:     { "marker_name": "우리집", "latitude": 37.5, "longitude": 127.0, "fav_name": "집" }
    @PostMapping
    public boolean favoriteAdd(@RequestBody FavoriteRegisterDto dto, @AuthenticationPrincipal CustomUserDetails userDetails) {

        // 담았으면 true. 이미 담았거나, 마커를 찾을 수 없거나, 요청이 잘못됐으면 false 반환
        return favoriteService.addFavorite(userDetails.getUserUuid(), dto);
    }

    // 즐겨찾기 이름 변경
    @PatchMapping("/{marker_uuid}")
    public boolean favoriteRename(@PathVariable("marker_uuid") String marker_uuid,
                                  @RequestBody FavoriteEditRequestDto dto,
                                  @AuthenticationPrincipal CustomUserDetails userDetails) {

        // 바꿨으면 true. 내 즐겨찾기에 없는 마커면 false 반환
        return favoriteService.renameFavorite(userDetails.getUserUuid(), marker_uuid, dto);
    }

    // 즐겨찾기 해제
    @DeleteMapping("/{marker_uuid}")
    public boolean favoriteDelete(@PathVariable("marker_uuid") String marker_uuid,
                                  @AuthenticationPrincipal CustomUserDetails userDetails) {

        // 해제했으면 true. 내 즐겨찾기에 없는 마커면 false 반환
        return favoriteService.deleteFavorite(userDetails.getUserUuid(), marker_uuid);
    }
}
