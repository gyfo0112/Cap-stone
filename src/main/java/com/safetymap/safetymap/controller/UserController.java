package com.safetymap.safetymap.controller;

import com.safetymap.safetymap.dto.*;
import com.safetymap.safetymap.exception.ForbiddenException;
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
    public void registerTel(@RequestBody UserTelRegisterDto dto, @AuthenticationPrincipal CustomUserDetails userDetails) {

        userService.registerUserTel(dto, userDetails.getUserUuid());
    }

    // 전화번호 조회
    @GetMapping("/me/tels/{user_uuid}")
    public Slice<UserTelListDto> getUserTel(@PathVariable String user_uuid, @AuthenticationPrincipal CustomUserDetails userDetails) {

        checkUserUuid(user_uuid, userDetails);

        return userService.getTelList(user_uuid);
    }

    // 전화번호 삭제
    @DeleteMapping("/me/tels/{tel_uuid}")
    public void deleteTel(@PathVariable String tel_uuid, @AuthenticationPrincipal CustomUserDetails userDetails) {

        userService.deleteUserTel(tel_uuid, userDetails.getUserUuid());
    }

    // 비밀번호 변경
    @PatchMapping("/me/password/{user_uuid}")
    public void changePassword(@RequestBody UserPasswordChangeDto dto,
                               @PathVariable String user_uuid,
                               @AuthenticationPrincipal CustomUserDetails userDetails) {

        checkUserUuid(user_uuid, userDetails);

        userService.changePassword(dto, userDetails.getUserUuid());
    }

    // 현재 로그인한 계정의 uuid와 요청 uuid가 같은지 비교하기 위한 메서드
    private void checkUserUuid(String user_uuid, @AuthenticationPrincipal CustomUserDetails userDetails) {

        if (!user_uuid.equals(userDetails.getUserUuid())) {
            throw new ForbiddenException(
                    "다른 사용자의 정보에 접근할 수 없습니다."
            );
        }
    }
}