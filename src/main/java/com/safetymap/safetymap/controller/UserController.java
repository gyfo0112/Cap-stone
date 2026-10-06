package com.safetymap.safetymap.controller;

import com.safetymap.safetymap.dto.UserPublicDto;
import com.safetymap.safetymap.dto.UserRegisterDto;
import com.safetymap.safetymap.dto.UserTelListDto;
import com.safetymap.safetymap.dto.UserTelRegisterDto;
import com.safetymap.safetymap.entity.UserTel;
import com.safetymap.safetymap.service.UserService;
import org.springframework.data.domain.Slice;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

@Controller
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    // uuid기반 유저 정보 api
    @GetMapping("/user/{user_uuid}")
    public UserPublicDto getUserInfo(@RequestParam String user_uuid) {

        UserPublicDto dto = userService.getUserInfo(user_uuid);

        return dto;
    }

    // 가입 api
    @PostMapping("/user/register")
    public void registerUser(@RequestBody UserRegisterDto dto) {
        userService.registerUser(dto);
    }

    // 전화번호 등록 api
    @GetMapping("/user/registerTel")
    public void registerTel(@RequestBody UserTelRegisterDto dto) {
        userService.registerUserTel(dto);
    }

    // 전화번호 로드 api
    @GetMapping("/user/getTel/{user_uuid}")
    public Slice<UserTelListDto> getUserTel(@PathVariable String user_uuid) {
        return userService.getTelList(user_uuid);
    }



}
