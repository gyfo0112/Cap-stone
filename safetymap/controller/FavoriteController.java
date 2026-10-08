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
// 중복·존재·소유권 검사는 FavoriteService 가 하고, 오류는 공통 예외 → GlobalExceptionHandler 가 상태코드로 응답한다
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
    // 요청이 잘못되면 400, 없는 marker_uuid 면 404, 이미 담았으면 409 (FavoriteService)
    @PostMapping
    public void favoriteAdd(@RequestBody FavoriteRegisterDto dto, @AuthenticationPrincipal CustomUserDetails userDetails) {

        favoriteService.addFavorite(userDetails.getUserUuid(), dto);
    }

    // 즐겨찾기 이름 변경. 내 즐겨찾기에 없는 마커면 404
    @PatchMapping("/{marker_uuid}")
    public void favoriteRename(@PathVariable("marker_uuid") String marker_uuid,
                               @RequestBody FavoriteEditRequestDto dto,
                               @AuthenticationPrincipal CustomUserDetails userDetails) {

        favoriteService.renameFavorite(userDetails.getUserUuid(), marker_uuid, dto);
    }

    // 즐겨찾기 해제. 내 즐겨찾기에 없는 마커면 404
    @DeleteMapping("/{marker_uuid}")
    public void favoriteDelete(@PathVariable("marker_uuid") String marker_uuid,
                               @AuthenticationPrincipal CustomUserDetails userDetails) {

        favoriteService.deleteFavorite(userDetails.getUserUuid(), marker_uuid);
    }
}
