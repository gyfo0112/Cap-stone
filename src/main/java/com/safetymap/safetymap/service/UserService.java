package com.safetymap.safetymap.service;

import com.safetymap.safetymap.dto.UserInfoDto;
import com.safetymap.safetymap.dto.UserRegisterDto;
import com.safetymap.safetymap.dto.UserTelListDto;
import com.safetymap.safetymap.dto.UserTelRegisterDto;
import com.safetymap.safetymap.entity.UserTel;
import com.safetymap.safetymap.entity.Users;
import com.safetymap.safetymap.repository.UserTelRepository;
import com.safetymap.safetymap.repository.UsersRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class UserService {

    private final UsersRepository usersRepository;
    private final UserTelRepository userTelRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UsersRepository usersRepository, UserTelRepository userTelRepository, PasswordEncoder passwordEncoder) {
        this.usersRepository = usersRepository;
        this.userTelRepository = userTelRepository;
        this.passwordEncoder = passwordEncoder;
    }

    // 이미 쓰는 아이디인지 확인
    public boolean existsUserId(String user_id) {
        if (user_id == null || user_id.isBlank()) {
            return false;
        }

        return usersRepository.countByUserId(user_id.trim()) > 0;
    }

    // 회원 가입 (비밀번호는 암호화해서 저장한다)
    public UserInfoDto registerUser(UserRegisterDto dto) {
        Users user = new Users();

        user.setUser_uuid(UUID.randomUUID().toString());
        user.setUser_name(dto.getUser_name().trim());
        user.setUser_id(dto.getUser_id().trim());
        user.setUser_pw(passwordEncoder.encode(dto.getUser_pw()));
        user.setInfo(dto.getInfo());

        usersRepository.save(user);

        return toUserInfoDto(user);
    }

    // 로그인 확인 (아이디가 없거나 비밀번호가 틀리면 null)
    public UserInfoDto login(String user_id, String user_pw) {
        if (user_id == null || user_id.isBlank() || user_pw == null || user_pw.isEmpty()) {
            return null;
        }

        Users user = usersRepository.findByUserId(user_id.trim()).orElse(null);
        if (user == null) {
            return null;
        }

        if (!passwordEncoder.matches(user_pw, user.getUser_pw())) {
            return null;
        }

        return toUserInfoDto(user);
    }

    // 아이디 찾기: 이름 + 휴대폰 번호(info)가 같은 회원의 아이디를 일부 가려서(ab****) 돌려준다
    public List<String> findUserIds(String user_name, String phone) {
        List<String> list = new ArrayList<>();

        if (user_name == null || user_name.isBlank() || onlyDigits(phone).isEmpty()) {
            return list;
        }

        for (Users user : usersRepository.findAllByUserName(user_name.trim())) {
            if (onlyDigits(user.getInfo()).equals(onlyDigits(phone))) {
                String id = user.getUser_id();
                list.add(id.substring(0, Math.min(2, id.length())) + "*".repeat(Math.max(id.length() - 2, 2)));
            }
        }

        return list;
    }

    // 본인 확인: 아이디 + 이름 + 휴대폰 번호(info)가 모두 맞는 회원이 있는지
    public boolean verifyUser(String user_id, String user_name, String phone) {
        return getVerifiedUser(user_id, user_name, phone) != null;
    }

    // 비밀번호 재설정 (본인 확인이 안 되면 false)
    public boolean resetPassword(String user_id, String user_name, String phone, String new_pw) {
        Users user = getVerifiedUser(user_id, user_name, phone);
        if (user == null) {
            return false;
        }

        user.setUser_pw(passwordEncoder.encode(new_pw));

        usersRepository.save(user);

        return true;
    }

    // 아이디 + 이름 + 휴대폰 번호가 모두 맞는 회원 찾기 (없으면 null)
    private Users getVerifiedUser(String user_id, String user_name, String phone) {
        if (user_id == null || user_id.isBlank() || user_name == null || user_name.isBlank() || onlyDigits(phone).isEmpty()) {
            return null;
        }

        Users user = usersRepository.findByUserId(user_id.trim()).orElse(null);
        if (user == null) {
            return null;
        }

        if (!user.getUser_name().equals(user_name.trim()) || !onlyDigits(user.getInfo()).equals(onlyDigits(phone))) {
            return null;
        }

        return user;
    }

    // 전화번호에서 숫자만 남기기 (010-1234-5678 과 01012345678 을 같게 본다)
    private String onlyDigits(String value) {
        if (value == null) {
            return "";
        }

        return value.replaceAll("[^0-9]", "");
    }

    // UUID로 회원 정보 가져오기 (없으면 null)
    public UserInfoDto getUserInfo(String user_uuid) {
        Users user = getUserEntity(user_uuid);
        if (user == null) {
            return null;
        }

        return toUserInfoDto(user);
    }

    // 다른 서비스에서 회원 엔티티가 필요할 때 쓴다 (없으면 null)
    public Users getUserEntity(String user_uuid) {
        if (user_uuid == null || user_uuid.isBlank()) {
            return null;
        }

        return usersRepository.findByUserUuid(user_uuid.trim()).orElse(null);
    }

    // 내 보호자 연락처 목록
    public List<UserTelListDto> getUserTels(String user_uuid) {
        List<UserTelListDto> list = new ArrayList<>();

        if (user_uuid == null || user_uuid.isBlank()) {
            return list;
        }

        for (UserTel userTel : userTelRepository.findAllByUserUuid(user_uuid.trim())) {
            list.add(toUserTelListDto(userTel));
        }

        return list;
    }

    // 이미 등록된 전화번호인지 확인
    public boolean existsUserTel(String tel_num) {
        if (tel_num == null || tel_num.isBlank()) {
            return false;
        }

        return userTelRepository.countByTelNum(tel_num.trim()) > 0;
    }

    // 보호자 연락처 등록 (회원이 없으면 null)
    public UserTelListDto registerUserTel(String user_uuid, UserTelRegisterDto dto) {
        if (dto == null) {
            return null;
        }

        Users user = getUserEntity(user_uuid);
        if (user == null) {
            return null;
        }

        UserTel userTel = new UserTel();

        userTel.setUser(user);
        userTel.setTel_uuid(UUID.randomUUID().toString());
        userTel.setTel_num(dto.getTel_num().trim());
        userTel.setTel_name(dto.getTel_name().trim());
        userTel.setTel_type(dto.getTel_type() == null || dto.getTel_type().isBlank() ? null : dto.getTel_type().trim());

        userTelRepository.save(userTel);

        return toUserTelListDto(userTel);
    }

    // 보호자 연락처 삭제 (내 연락처가 아니거나 없으면 false)
    public boolean deleteUserTel(String user_uuid, String tel_uuid) {
        if (user_uuid == null || user_uuid.isBlank() || tel_uuid == null || tel_uuid.isBlank()) {
            return false;
        }

        UserTel userTel = userTelRepository.findByUserUuidAndTelUuid(user_uuid.trim(), tel_uuid.trim()).orElse(null);
        if (userTel == null) {
            return false;
        }

        userTelRepository.delete(userTel);

        return true;
    }

    // 엔티티를 응답용 DTO로 바꾸기 (비밀번호는 넣지 않는다)
    private UserInfoDto toUserInfoDto(Users user) {
        return new UserInfoDto(
                user.getUser_uuid(),
                user.getUser_id(),
                user.getUser_name(),
                user.getInfo()
        );
    }

    private UserTelListDto toUserTelListDto(UserTel userTel) {
        return new UserTelListDto(
                userTel.getTel_uuid(),
                userTel.getUser().getUser_uuid(),
                userTel.getTel_num(),
                userTel.getTel_name(),
                userTel.getTel_type()
        );
    }
}
