package com.safetymap.safetymap.service;

import com.safetymap.safetymap.dto.*;
import com.safetymap.safetymap.entity.UserTel;
import com.safetymap.safetymap.entity.Users;
import com.safetymap.safetymap.repository.UserTelRepository;
import com.safetymap.safetymap.repository.UsersRepository;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.RequestParam;

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

    // 회원 가입
    public void registerUser(UserRegisterDto dto) {
        Users user = new Users();

        user.setUser_uuid(UUID.randomUUID().toString());
        user.setUser_name(dto.getUser_name());
        user.setUser_id(dto.getUser_id());
        user.setUser_pw(passwordEncoder.encode(dto.getUser_pw()));
        user.setInfo(dto.getInfo());

        usersRepository.save(user);
    }

    // 전화번호 등록
    public void registerUserTel(UserTelRegisterDto dto) {
        UserTel userTel = new UserTel();

        userTel.setTel_uuid(UUID.randomUUID().toString());
        userTel.setTel_num(dto.getTel_num());
        userTel.setTel_name(dto.getTel_name());
        userTel.setTel_type(dto.getTel_type());

        userTelRepository.save(userTel);
    }

    // 유저 정보 로드
    public UserPublicDto getUserInfo(String user_uuid) {
        Users dto = usersRepository.findByUser_uuid(user_uuid).orElseThrow();
        return new UserPublicDto(dto.getUser_uuid(), dto.getUser_name(), dto.getUser_id(), dto.getUser_pw(), dto.getInfo());
    }

    // 유저 uuid 기반 전화번호 리턴
    public Slice<UserTelListDto> getTelList(String user_uuid) {
        Slice<UserTel> list = userTelRepository.findAllByUser_User_uuid(user_uuid);

        return list.map(userTel -> {
            UserTelListDto dto = new UserTelListDto(
                    userTel.getTel_uuid(),
                    userTel.getUser().getUser_uuid(),
                    userTel.getTel_num(),
                    userTel.getTel_name(),
                    userTel.getTel_type()
            );
            return dto;
        });
    }

    // 비밀번호 변경 메서드. 비밀번호 확인과 불일치, 기존 비밀번호 불일치시 false반환, 정상의 경우 true 반환
    public boolean changePassword(UserPasswordChangeDto dto, String user_uuid) {
        Users user = usersRepository.findByUser_uuid(user_uuid).orElseThrow();

        if(!dto.getNewPassword().equals(dto.getConfirmNewPassword())) {
            return false;
        }

        if(passwordEncoder.matches(dto.getOldPassword(), user.getUser_pw())) {
            user.setUser_pw(passwordEncoder.encode(dto.getNewPassword()));
            usersRepository.save(user);
            return true;
        } else {
            return false;
        }

    }

    // 전화번호 삭제 메서드
    public void deleteUserTel(String tel_uuid, String user_uuid) {
        userTelRepository.deleteByUser_User_uuidAndTel_uuid(user_uuid, tel_uuid);
    }
}
