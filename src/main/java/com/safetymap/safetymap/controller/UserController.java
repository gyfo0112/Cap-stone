package com.safetymap.safetymap.controller;

import com.safetymap.safetymap.dto.*;
import com.safetymap.safetymap.security.CustomUserDetails;
import com.safetymap.safetymap.service.UserService;

import org.springframework.data.domain.Slice;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    // 유저 정보 조회
    @GetMapping("/{user_uuid}")
    public UserPublicDto getUserInfo(@PathVariable String user_uuid) {

        UserPublicDto dto =
                userService.getUserInfo(user_uuid);

        return dto;
    }

    // 회원가입
    @PostMapping("/signup")
    public void registerUser(@RequestBody UserRegisterDto dto) {

        userService.registerUser(dto);
    }

    // 전화번호 등록
    @PostMapping("/me/tels")
    public void registerTel(@RequestBody UserTelRegisterDto dto) {

        userService.registerUserTel(dto);
    }

    // 전화번호 조회
    @GetMapping("/me/tels/{user_uuid}")
    public Slice<UserTelListDto> getUserTel(@PathVariable String user_uuid) {

        return userService.getTelList(user_uuid);
    }

    // 전화번호 삭제
    @DeleteMapping("/me/tels/{tel_uuid}")
    public void deleteTel(@PathVariable String tel_uuid, @AuthenticationPrincipal CustomUserDetails userDetails) {

        userService.deleteUserTel(tel_uuid, userDetails.getUserUuid());
    }

    // 비밀번호 변경
    @PatchMapping("/me/password")
    public boolean changePassword(@RequestBody UserPasswordChangeDto dto, @AuthenticationPrincipal CustomUserDetails userDetails) {

        // 구 비번과 다름, 새 비번 확인과 다를 경우 false반환. 정상 변경 시 true 반환
        return userService.changePassword(dto, userDetails.getUserUuid());
    }
}