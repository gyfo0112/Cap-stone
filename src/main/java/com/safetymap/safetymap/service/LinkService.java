package com.safetymap.safetymap.service;

import com.safetymap.safetymap.dto.LinkInviteDto;
import com.safetymap.safetymap.dto.LinkListDto;
import com.safetymap.safetymap.entity.LinkInvite;
import com.safetymap.safetymap.entity.UserLink;
import com.safetymap.safetymap.entity.UserLocation;
import com.safetymap.safetymap.entity.Users;
import com.safetymap.safetymap.repository.LinkInviteRepository;
import com.safetymap.safetymap.repository.UserLinkRepository;
import com.safetymap.safetymap.repository.UserLocationRepository;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

// 실시간 위치 공유: 연결 코드 → 보호자·보호 대상 연결 → 공유 켜기/끄기 → 위치 올리기·보기
// "누가 할 수 있는지"는 컨트롤러가 이 서비스에 물어본 뒤 상태코드(403 등)로 바꾼다
@Service
public class LinkService {

    // 연결 코드는 만든 뒤 10분 동안만 쓸 수 있다
    private static final long INVITE_TTL_MILLIS = 10 * 60 * 1000L;

    private final UserLinkRepository userLinkRepository;
    private final LinkInviteRepository linkInviteRepository;
    private final UserLocationRepository userLocationRepository;
    private final UserService userService;
    private final SecureRandom random = new SecureRandom();

    public LinkService(UserLinkRepository userLinkRepository,
                       LinkInviteRepository linkInviteRepository,
                       UserLocationRepository userLocationRepository,
                       UserService userService) {
        this.userLinkRepository = userLinkRepository;
        this.linkInviteRepository = linkInviteRepository;
        this.userLocationRepository = userLocationRepository;
        this.userService = userService;
    }

    // ───────── 연결 코드 ─────────

    // 연결 코드 만들기 (회원이 없으면 null). 새 코드를 만들면 이 회원의 이전 코드는 지워져 못 쓰게 된다
    public LinkInviteDto createInvite(String user_uuid) {
        Users user = userService.getUserEntity(user_uuid);
        if (user == null) {
            return null;
        }

        long now = System.currentTimeMillis();

        linkInviteRepository.deleteAll(linkInviteRepository.findAllByUserUuid(user.getUser_uuid()));
        linkInviteRepository.deleteAll(linkInviteRepository.findAllExpired(now));

        // 숫자 6자리. 아직 살아 있는 다른 사람의 코드와 겹치면 다시 뽑는다
        String code = newCode();
        while (linkInviteRepository.findByCode(code).isPresent()) {
            code = newCode();
        }

        LinkInvite invite = new LinkInvite();

        invite.setCode(code);
        invite.setUser(user);
        invite.setExpires_at(now + INVITE_TTL_MILLIS);

        linkInviteRepository.save(invite);

        return new LinkInviteDto(invite.getCode(), invite.getExpires_at());
    }

    // 있는 코드인지
    public boolean existsInvite(String code) {
        return getInvite(code) != null;
    }

    // 만료된 코드인지 (없는 코드는 false)
    public boolean isInviteExpired(String code) {
        LinkInvite invite = getInvite(code);

        return invite != null && invite.getExpires_at() <= System.currentTimeMillis();
    }

    // 이 코드의 주인과 이미 연결된 사이인지
    public boolean existsLinkByInvite(String guardian_uuid, String code) {
        LinkInvite invite = getInvite(code);
        if (invite == null || guardian_uuid == null || guardian_uuid.isBlank()) {
            return false;
        }

        return userLinkRepository.countByGuardianUuidAndProtectedUuid(guardian_uuid.trim(), invite.getUser().getUser_uuid()) > 0;
    }

    // 코드로 연결하기 (코드나 회원이 없으면 null). 연결 직후 공유는 꺼진 상태이고, 쓴 코드는 지운다
    public LinkListDto acceptInvite(String guardian_uuid, String code) {
        LinkInvite invite = getInvite(code);
        if (invite == null) {
            return null;
        }

        Users guardian = userService.getUserEntity(guardian_uuid);
        if (guardian == null) {
            return null;
        }

        UserLink link = new UserLink();

        link.setLink_uuid(UUID.randomUUID().toString());
        link.setGuardian(guardian);
        link.setProtected_user(invite.getUser());
        link.setSharing(false);
        link.setCan_toggle(false);

        userLinkRepository.save(link);
        linkInviteRepository.delete(invite);

        return toLinkListDto(link, UserService.ROLE_GUARDIAN);
    }

    // ───────── 연결 ─────────

    // 내 연결 목록 (보호자면 내가 보호하는 사람들, 보호 대상이면 나를 보호하는 사람들)
    public List<LinkListDto> getLinks(String user_uuid) {
        List<LinkListDto> list = new ArrayList<>();

        String role = userService.getRole(user_uuid);
        if (role == null) {
            return list;
        }

        List<UserLink> listRaw;

        if (UserService.ROLE_PROTECTED.equals(role)) {
            listRaw = userLinkRepository.findAllByProtectedUuid(user_uuid.trim());
        } else {
            listRaw = userLinkRepository.findAllByGuardianUuid(user_uuid.trim());
        }

        for (UserLink link : listRaw) {
            list.add(toLinkListDto(link, role));
        }

        return list;
    }

    // 이 연결에서 내가 어느 쪽인지: guardian / protected. 내 연결이 아니거나 없으면 null
    public String getMySide(String user_uuid, String link_uuid) {
        UserLink link = getLink(link_uuid);
        if (link == null || user_uuid == null) {
            return null;
        }

        if (link.getGuardian().getUser_uuid().equals(user_uuid.trim())) {
            return UserService.ROLE_GUARDIAN;
        }

        if (link.getProtected_user().getUser_uuid().equals(user_uuid.trim())) {
            return UserService.ROLE_PROTECTED;
        }

        return null;
    }

    // 보호자가 이 연결에서 보호 대상에게 켜기/끄기를 허용했는지
    public boolean canToggle(String link_uuid) {
        UserLink link = getLink(link_uuid);

        return link != null && link.isCan_toggle();
    }

    // 공유 켜기/끄기 (내 연결이 아니면 null). 누가 바꿨는지 changed_by 에 남긴다
    public LinkListDto setSharing(String user_uuid, String link_uuid, boolean on) {
        String side = getMySide(user_uuid, link_uuid);
        if (side == null) {
            return null;
        }

        UserLink link = getLink(link_uuid);

        link.setSharing(on);
        link.setChanged_by(side);

        userLinkRepository.save(link);

        return toLinkListDto(link, side);
    }

    // 보호 대상에게 켜기/끄기 권한 주기·거두기 (내 연결이 아니면 null)
    public LinkListDto setPermission(String user_uuid, String link_uuid, boolean can_toggle) {
        String side = getMySide(user_uuid, link_uuid);
        if (side == null) {
            return null;
        }

        UserLink link = getLink(link_uuid);

        link.setCan_toggle(can_toggle);

        userLinkRepository.save(link);

        return toLinkListDto(link, side);
    }

    // 연결 해제 (내 연결이 아니면 false)
    public boolean deleteLink(String user_uuid, String link_uuid) {
        if (getMySide(user_uuid, link_uuid) == null) {
            return false;
        }

        userLinkRepository.delete(getLink(link_uuid));

        return true;
    }

    // ───────── 위치 ─────────

    // 위치 올리기. 내 위치를 받고 있는(공유가 켜진) 연결이 하나도 없으면 저장하지 않고 false
    public boolean saveLocation(String user_uuid, double latitude, double longitude) {
        Users user = userService.getUserEntity(user_uuid);
        if (user == null) {
            return false;
        }

        if (userLinkRepository.countSharingByProtectedUuid(user.getUser_uuid()) == 0) {
            return false;
        }

        // 회원 1명당 1줄: 있으면 덮어쓰고 없으면 새로 만든다
        UserLocation location = userLocationRepository.findByUserUuid(user.getUser_uuid()).orElse(null);
        if (location == null) {
            location = new UserLocation();
            location.setUser(user);
        }

        location.setLatitude(latitude);
        location.setLongitude(longitude);
        location.setUpdated_at(System.currentTimeMillis());

        userLocationRepository.save(location);

        return true;
    }

    // ───────── 내부에서만 쓰는 것 ─────────

    private String newCode() {
        return String.valueOf(100000 + random.nextInt(900000));
    }

    private LinkInvite getInvite(String code) {
        if (code == null || code.isBlank()) {
            return null;
        }

        return linkInviteRepository.findByCode(code.trim()).orElse(null);
    }

    private UserLink getLink(String link_uuid) {
        if (link_uuid == null || link_uuid.isBlank()) {
            return null;
        }

        return userLinkRepository.findByLinkUuid(link_uuid.trim()).orElse(null);
    }

    // 엔티티를 응답용 DTO로 바꾸기. my_side 는 이 응답을 받는 사람이 연결의 어느 쪽인지
    // 상대 위치는 "내가 보호자이고 공유가 켜져 있을 때"만 넣는다 → 그 외에는 서버 밖으로 나가지 않는다
    private LinkListDto toLinkListDto(UserLink link, String my_side) {
        boolean iAmGuardian = UserService.ROLE_GUARDIAN.equals(my_side);
        Users other = iAmGuardian ? link.getProtected_user() : link.getGuardian();

        Double latitude = null;
        Double longitude = null;
        Long updated_at = null;

        if (iAmGuardian && link.isSharing()) {
            UserLocation location = userLocationRepository.findByUserUuid(other.getUser_uuid()).orElse(null);
            if (location != null) {
                latitude = location.getLatitude();
                longitude = location.getLongitude();
                updated_at = location.getUpdated_at();
            }
        }

        return new LinkListDto(
                link.getLink_uuid(),
                other.getUser_id(),
                other.getUser_name(),
                userService.roleOf(other),
                link.isSharing(),
                link.isCan_toggle(),
                link.getChanged_by(),
                latitude,
                longitude,
                updated_at
        );
    }
}
