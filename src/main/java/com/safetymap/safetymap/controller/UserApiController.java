package com.safetymap.safetymap.controller;

import com.safetymap.safetymap.dto.UserFindRequestDto;
import com.safetymap.safetymap.dto.UserInfoDto;
import com.safetymap.safetymap.dto.UserLoginRequestDto;
import com.safetymap.safetymap.dto.UserRegisterDto;
import com.safetymap.safetymap.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
public class UserApiController {

    private static final int USER_ID_MAX_LENGTH = 30;
    private static final int USER_NAME_MAX_LENGTH = 50;
    private static final int USER_PW_MIN_LENGTH = 4;
    private static final int USER_PW_MAX_LENGTH = 50;

    // 로그인 유지 시간 (초). 기본 30분, "로그인 유지"를 체크하면 14일
    private static final int SESSION_SECONDS = 30 * 60;
    private static final int SESSION_SECONDS_KEEP = 14 * 24 * 60 * 60;

    private final UserService userService;
    private final HttpSessionSecurityContextRepository securityContextRepository = new HttpSessionSecurityContextRepository();

    public UserApiController(UserService userService) {
        this.userService = userService;
    }

    // 회원 가입
    @PostMapping("/signup")
    public ResponseEntity<?> signup(@RequestBody UserRegisterDto dto) {

        if (dto == null || isBlank(dto.getUser_id()) || isBlank(dto.getUser_pw()) || isBlank(dto.getUser_name())) {
            return ResponseEntity.badRequest().body(Map.of("message", "user_id, user_pw, user_name은 필수입니다"));
        }

        if (dto.getUser_id().trim().length() > USER_ID_MAX_LENGTH) {
            return ResponseEntity.badRequest().body(Map.of("message", "아이디는 30자 이하여야 합니다"));
        }

        if (dto.getUser_name().trim().length() > USER_NAME_MAX_LENGTH) {
            return ResponseEntity.badRequest().body(Map.of("message", "이름은 50자 이하여야 합니다"));
        }

        if (dto.getUser_pw().length() < USER_PW_MIN_LENGTH || dto.getUser_pw().length() > USER_PW_MAX_LENGTH) {
            return ResponseEntity.badRequest().body(Map.of("message", "비밀번호는 4자 이상 50자 이하여야 합니다"));
        }

        if (dto.getRole() != null && !dto.getRole().isBlank() && !userService.isValidRole(dto.getRole())) {
            return ResponseEntity.badRequest().body(Map.of("message", "role은 guardian 또는 protected 여야 합니다"));
        }

        if (userService.existsUserId(dto.getUser_id())) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", "이미 사용 중인 아이디입니다"));
        }

        UserInfoDto saved = userService.registerUser(dto);

        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    // 로그인 (성공하면 세션 쿠키 JSESSIONID 가 내려간다)
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody UserLoginRequestDto dto,
                                   HttpServletRequest request,
                                   HttpServletResponse response) {

        if (dto == null || isBlank(dto.getUser_id()) || isBlank(dto.getUser_pw())) {
            return ResponseEntity.badRequest().body(Map.of("message", "user_id, user_pw는 필수입니다"));
        }

        UserInfoDto user = userService.login(dto.getUser_id(), dto.getUser_pw());

        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "아이디 또는 비밀번호가 올바르지 않습니다"));
        }

        // 이전 세션은 버리고 새 세션을 만든다
        HttpSession oldSession = request.getSession(false);
        if (oldSession != null) {
            oldSession.invalidate();
        }

        HttpSession session = request.getSession(true);
        session.setMaxInactiveInterval(Boolean.TRUE.equals(dto.getKeep_login()) ? SESSION_SECONDS_KEEP : SESSION_SECONDS);

        // 로그인한 사용자의 user_uuid 를 세션에 기억시킨다
        // → 다른 컨트롤러에서는 authentication.getName() 으로 user_uuid 를 꺼낸다
        Authentication authentication = new UsernamePasswordAuthenticationToken(user.getUser_uuid(), null, AuthorityUtils.createAuthorityList("ROLE_USER"));

        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(authentication);
        SecurityContextHolder.setContext(context);
        securityContextRepository.saveContext(context, request, response);

        return ResponseEntity.ok(user);
    }

    // 로그아웃 (로그인하지 않은 상태에서 불러도 200)
    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletRequest request) {

        HttpSession session = request.getSession(false);
        if (session != null) {
            session.invalidate();
        }

        SecurityContextHolder.clearContext();

        return ResponseEntity.ok(Map.of("message", "로그아웃했습니다"));
    }

    // 아이디 찾기 (이름 + 휴대폰 번호 → 일부를 가린 아이디 목록. 없으면 빈 배열)
    @PostMapping("/find-id")
    public ResponseEntity<?> findId(@RequestBody UserFindRequestDto dto) {

        if (dto == null || isBlank(dto.getUser_name()) || isBlank(dto.getInfo())) {
            return ResponseEntity.badRequest().body(Map.of("message", "user_name, info(휴대폰 번호)는 필수입니다"));
        }

        List<String> ids = userService.findUserIds(dto.getUser_name(), dto.getInfo());

        return ResponseEntity.ok(ids);
    }

    // 본인 확인 (비밀번호 재설정의 1단계: 아이디 + 이름 + 휴대폰 번호)
    @PostMapping("/verify")
    public ResponseEntity<?> verify(@RequestBody UserFindRequestDto dto) {

        if (dto == null || isBlank(dto.getUser_id()) || isBlank(dto.getUser_name()) || isBlank(dto.getInfo())) {
            return ResponseEntity.badRequest().body(Map.of("message", "user_id, user_name, info(휴대폰 번호)는 필수입니다"));
        }

        if (!userService.verifyUser(dto.getUser_id(), dto.getUser_name(), dto.getInfo())) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "일치하는 계정을 찾을 수 없습니다"));
        }

        return ResponseEntity.ok(Map.of("message", "본인 확인이 되었습니다"));
    }

    // 비밀번호 재설정 (2단계: 본인 확인 정보 + 새 비밀번호)
    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody UserFindRequestDto dto) {

        if (dto == null || isBlank(dto.getUser_id()) || isBlank(dto.getUser_name()) || isBlank(dto.getInfo()) || isBlank(dto.getUser_pw())) {
            return ResponseEntity.badRequest().body(Map.of("message", "user_id, user_name, info(휴대폰 번호), user_pw는 필수입니다"));
        }

        if (dto.getUser_pw().length() < USER_PW_MIN_LENGTH || dto.getUser_pw().length() > USER_PW_MAX_LENGTH) {
            return ResponseEntity.badRequest().body(Map.of("message", "비밀번호는 4자 이상 50자 이하여야 합니다"));
        }

        boolean res = userService.resetPassword(dto.getUser_id(), dto.getUser_name(), dto.getInfo(), dto.getUser_pw());

        if (!res) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "일치하는 계정을 찾을 수 없습니다"));
        }

        return ResponseEntity.ok(Map.of("message", "비밀번호를 변경했습니다"));
    }

    // 내 정보 (새로고침했을 때 로그인이 유지되고 있는지 확인하는 데 쓴다)
    @GetMapping("/me")
    public ResponseEntity<?> me(Authentication authentication) {

        UserInfoDto user = userService.getUserInfo(authentication.getName());

        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "로그인이 필요합니다"));
        }

        return ResponseEntity.ok(user);
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
