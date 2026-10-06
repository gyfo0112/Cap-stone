package com.safetymap.safetymap.controller;

import com.safetymap.safetymap.dto.LinkAcceptRequestDto;
import com.safetymap.safetymap.dto.LinkInviteDto;
import com.safetymap.safetymap.dto.LinkListDto;
import com.safetymap.safetymap.dto.LinkPermissionRequestDto;
import com.safetymap.safetymap.dto.LinkSharingRequestDto;
import com.safetymap.safetymap.dto.LocationRequestDto;
import com.safetymap.safetymap.service.LinkService;
import com.safetymap.safetymap.service.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

// 실시간 위치 공유. 모두 로그인이 필요하다 (authentication.getName() = 로그인한 사용자의 user_uuid)
//  - 보호 대상(protected): 연결 코드 만들기, 위치 올리기
//  - 보호자(guardian)    : 코드로 연결, 권한 주기, 연결 해제
//  - 공유 켜기/끄기      : 보호자는 항상, 보호 대상은 보호자가 허용(can_toggle)한 연결에서만
// 화면에서 버튼을 숨기더라도 서버에서 한 번 더 막는다 → 권한이 없으면 403
@RestController
@RequestMapping("/api")
public class LinkController {

    private final LinkService linkService;
    private final UserService userService;

    public LinkController(LinkService linkService, UserService userService) {
        this.linkService = linkService;
        this.userService = userService;
    }

    // 연결 코드 발급 (보호 대상만)
    @PostMapping("/invites")
    public ResponseEntity<?> inviteCreate(Authentication authentication) {

        String user_uuid = authentication.getName();

        if (!UserService.ROLE_PROTECTED.equals(userService.getRole(user_uuid))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "보호 대상 계정만 연결 코드를 만들 수 있습니다"));
        }

        LinkInviteDto invite = linkService.createInvite(user_uuid);

        return ResponseEntity.status(HttpStatus.CREATED).body(invite);
    }

    // 코드로 연결 (보호자만). 연결 직후 공유는 꺼진 상태
    @PostMapping("/links/accept")
    public ResponseEntity<?> linkAccept(Authentication authentication,
                                        @RequestBody LinkAcceptRequestDto dto) {

        String user_uuid = authentication.getName();

        if (!UserService.ROLE_GUARDIAN.equals(userService.getRole(user_uuid))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "보호자 계정만 연결할 수 있습니다"));
        }

        if (dto == null || dto.getCode() == null || dto.getCode().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "code는 필수입니다"));
        }

        if (!linkService.existsInvite(dto.getCode())) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "연결 코드가 올바르지 않거나 새 코드로 바뀌었습니다"));
        }

        if (linkService.isInviteExpired(dto.getCode())) {
            return ResponseEntity.status(HttpStatus.GONE).body(Map.of("message", "연결 코드가 만료됐습니다 (10분)"));
        }

        if (linkService.existsLinkByInvite(user_uuid, dto.getCode())) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", "이미 연결돼 있습니다"));
        }

        LinkListDto saved = linkService.acceptInvite(user_uuid, dto.getCode());

        if (saved == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "연결 코드가 올바르지 않거나 새 코드로 바뀌었습니다"));
        }

        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    // 내 연결 목록. 보호자에게만 (공유가 켜진) 상대 위치와 갱신 시각이 들어간다
    @GetMapping("/links")
    public ResponseEntity<?> linkList(Authentication authentication) {
        return ResponseEntity.ok(linkService.getLinks(authentication.getName()));
    }

    // 공유 켜기/끄기 (보호자는 항상, 보호 대상은 can_toggle 일 때만)
    @PatchMapping("/links/{link_id}/sharing")
    public ResponseEntity<?> linkSharing(Authentication authentication,
                                         @PathVariable("link_id") String link_id,
                                         @RequestBody LinkSharingRequestDto dto) {

        String user_uuid = authentication.getName();

        if (dto == null || dto.getOn() == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "on(true/false)은 필수입니다"));
        }

        String side = linkService.getMySide(user_uuid, link_id);

        if (side == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "연결을 찾을 수 없습니다"));
        }

        if (UserService.ROLE_PROTECTED.equals(side) && !linkService.canToggle(link_id)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "보호자가 허용해야 위치 공유를 켜고 끌 수 있습니다"));
        }

        return ResponseEntity.ok(linkService.setSharing(user_uuid, link_id, dto.getOn()));
    }

    // 보호 대상에게 켜기/끄기 권한 주기·거두기 (보호자만)
    @PatchMapping("/links/{link_id}/permission")
    public ResponseEntity<?> linkPermission(Authentication authentication,
                                            @PathVariable("link_id") String link_id,
                                            @RequestBody LinkPermissionRequestDto dto) {

        String user_uuid = authentication.getName();

        if (dto == null || dto.getCan_toggle() == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "can_toggle(true/false)은 필수입니다"));
        }

        String side = linkService.getMySide(user_uuid, link_id);

        if (side == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "연결을 찾을 수 없습니다"));
        }

        if (!UserService.ROLE_GUARDIAN.equals(side)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "권한은 보호자만 줄 수 있습니다"));
        }

        return ResponseEntity.ok(linkService.setPermission(user_uuid, link_id, dto.getCan_toggle()));
    }

    // 연결 해제 (보호자만)
    @DeleteMapping("/links/{link_id}")
    public ResponseEntity<?> linkDelete(Authentication authentication,
                                        @PathVariable("link_id") String link_id) {

        String user_uuid = authentication.getName();

        String side = linkService.getMySide(user_uuid, link_id);

        if (side == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "연결을 찾을 수 없습니다"));
        }

        if (!UserService.ROLE_GUARDIAN.equals(side)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "연결 해제는 보호자만 할 수 있습니다"));
        }

        linkService.deleteLink(user_uuid, link_id);

        return ResponseEntity.ok(Map.of("message", "연결을 해제했습니다"));
    }

    // 위치 올리기 (보호 대상만). 공유가 켜진 연결이 없으면 저장하지 않고 saved: false
    @PutMapping("/location")
    public ResponseEntity<?> locationUpdate(Authentication authentication,
                                            @RequestBody LocationRequestDto dto) {

        String user_uuid = authentication.getName();

        if (!UserService.ROLE_PROTECTED.equals(userService.getRole(user_uuid))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "보호 대상 계정만 위치를 올릴 수 있습니다"));
        }

        if (dto == null || dto.getLatitude() == null || dto.getLongitude() == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "latitude, longitude는 필수입니다"));
        }

        if (dto.getLatitude() < -90 || dto.getLatitude() > 90 || dto.getLongitude() < -180 || dto.getLongitude() > 180) {
            return ResponseEntity.badRequest().body(Map.of("message", "좌표가 올바르지 않습니다"));
        }

        boolean saved = linkService.saveLocation(user_uuid, dto.getLatitude(), dto.getLongitude());

        return ResponseEntity.ok(Map.of("saved", saved));
    }
}
