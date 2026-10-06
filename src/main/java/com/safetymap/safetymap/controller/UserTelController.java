package com.safetymap.safetymap.controller;

import com.safetymap.safetymap.dto.UserTelListDto;
import com.safetymap.safetymap.dto.UserTelRegisterDto;
import com.safetymap.safetymap.service.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

// 보호자 연락처. 모두 로그인이 필요하고, 로그인한 사용자 본인의 연락처만 다룬다
@RestController
@RequestMapping("/api/users/me/tels")
public class UserTelController {

    private static final int TEL_NAME_MAX_LENGTH = 50;
    private static final int TEL_NUM_MAX_LENGTH = 20;
    private static final int TEL_TYPE_MAX_LENGTH = 20;

    private final UserService userService;

    public UserTelController(UserService userService) {
        this.userService = userService;
    }

    // 내 보호자 연락처 목록 보기
    @GetMapping
    public ResponseEntity<?> telList(Authentication authentication) {
        return ResponseEntity.ok(userService.getUserTels(authentication.getName()));
    }

    // 보호자 연락처 추가
    @PostMapping
    public ResponseEntity<?> telAdd(Authentication authentication,
                                    @RequestBody UserTelRegisterDto dto) {

        if (dto == null || isBlank(dto.getTel_name()) || isBlank(dto.getTel_num())) {
            return ResponseEntity.badRequest().body(Map.of("message", "tel_name, tel_num은 필수입니다"));
        }

        if (dto.getTel_name().trim().length() > TEL_NAME_MAX_LENGTH) {
            return ResponseEntity.badRequest().body(Map.of("message", "이름은 50자 이하여야 합니다"));
        }

        if (dto.getTel_num().trim().length() > TEL_NUM_MAX_LENGTH) {
            return ResponseEntity.badRequest().body(Map.of("message", "전화번호는 20자 이하여야 합니다"));
        }

        if (dto.getTel_type() != null && dto.getTel_type().trim().length() > TEL_TYPE_MAX_LENGTH) {
            return ResponseEntity.badRequest().body(Map.of("message", "tel_type은 20자 이하여야 합니다"));
        }

        if (userService.existsUserTel(dto.getTel_num())) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", "이미 등록된 전화번호입니다"));
        }

        UserTelListDto saved = userService.registerUserTel(authentication.getName(), dto);

        if (saved == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "로그인이 필요합니다"));
        }

        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    // 보호자 연락처 삭제
    @DeleteMapping("/{tel_uuid}")
    public ResponseEntity<?> telDelete(Authentication authentication,
                                       @PathVariable("tel_uuid") String tel_uuid) {

        boolean res = userService.deleteUserTel(authentication.getName(), tel_uuid);

        if (!res) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "연락처를 찾을 수 없습니다"));
        }

        return ResponseEntity.ok(Map.of("message", "연락처를 삭제했습니다"));
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
