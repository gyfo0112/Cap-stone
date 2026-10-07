package com.safetymap.safetymap.service;

import com.safetymap.safetymap.dto.*;
import com.safetymap.safetymap.entity.UserTel;
import com.safetymap.safetymap.entity.Users;
import com.safetymap.safetymap.exception.BadRequestException;
import com.safetymap.safetymap.exception.ConflictException;
import com.safetymap.safetymap.exception.NotFoundException;
import com.safetymap.safetymap.repository.UserTelRepository;
import com.safetymap.safetymap.repository.UsersRepository;
import org.springframework.data.domain.Slice;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class UserService {

    private final UsersRepository usersRepository;
    private final UserTelRepository userTelRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(
            UsersRepository usersRepository,
            UserTelRepository userTelRepository,
            PasswordEncoder passwordEncoder) {

        this.usersRepository = usersRepository;
        this.userTelRepository = userTelRepository;
        this.passwordEncoder = passwordEncoder;
    }

    // 회원 가입
    public void registerUser(UserRegisterDto dto) {

        if(usersRepository.existsByUser_id(dto.getUser_id())) {
            throw new ConflictException("이미 사용 중인 아이디입니다.");
        }

        Users user = new Users();

        user.setUser_uuid(UUID.randomUUID().toString());
        user.setUser_name(dto.getUser_name());
        user.setUser_id(dto.getUser_id());
        user.setUser_pw(passwordEncoder.encode(dto.getUser_pw()));
        user.setInfo(dto.getInfo());

        usersRepository.save(user);
    }

    // 전화번호 등록
    public void registerUserTel(UserTelRegisterDto dto, String user_uuid) {

        Users user = usersRepository.findByUser_uuid(user_uuid)
                .orElseThrow(() -> new NotFoundException("사용자를 찾을 수 없습니다."));

        UserTel userTel = new UserTel();

        userTel.setTel_uuid(UUID.randomUUID().toString());
        userTel.setUser(user);
        userTel.setTel_num(dto.getTel_num());
        userTel.setTel_name(dto.getTel_name());
        userTel.setTel_type(dto.getTel_type());

        userTelRepository.save(userTel);
    }

    // 유저 정보 로드
    public UserPublicDto getUserInfo(String user_uuid) {

        Users user = usersRepository.findByUser_uuid(user_uuid)
                .orElseThrow(() -> new NotFoundException("사용자를 찾을 수 없습니다."));

        return new UserPublicDto(
                user.getUser_uuid(),
                user.getUser_name(),
                user.getUser_id(),
                user.getInfo()
        );
    }

    // 유저 uuid 기반 전화번호 리턴
    public Slice<UserTelListDto> getTelList(String user_uuid) {

        if(!usersRepository.existsByUser_uuid(user_uuid)) {
            throw new NotFoundException("사용자를 찾을 수 없습니다.");
        }

        Slice<UserTel> list = userTelRepository.findAllByUser_User_uuid(user_uuid);

        return list.map(userTel ->
                new UserTelListDto(
                        userTel.getTel_uuid(),
                        userTel.getUser().getUser_uuid(),
                        userTel.getTel_num(),
                        userTel.getTel_name(),
                        userTel.getTel_type()
                )
        );
    }

    // 비밀번호 변경
    public void changePassword(UserPasswordChangeDto dto, String user_uuid) {

        Users user = usersRepository.findByUser_uuid(user_uuid)
                .orElseThrow(() -> new NotFoundException("사용자를 찾을 수 없습니다."));

        if(!dto.getNewPassword().equals(dto.getConfirmNewPassword())) {

            throw new BadRequestException("새 비밀번호와 비밀번호 확인이 일치하지 않습니다.");
        }

        if(!passwordEncoder.matches(dto.getOldPassword(), user.getUser_pw())) {

            throw new BadRequestException("현재 비밀번호가 일치하지 않습니다.");
        }

        user.setUser_pw(passwordEncoder.encode(dto.getNewPassword()));

        usersRepository.save(user);
    }

    // 전화번호 삭제
    public void deleteUserTel(
            String tel_uuid,
            String user_uuid) {

        boolean exists = userTelRepository.existsByUser_User_uuidAndTel_uuid(user_uuid, tel_uuid);

        if(!exists) {
            throw new NotFoundException("등록된 연락처를 찾을 수 없습니다.");
        }

        userTelRepository.deleteByUser_User_uuidAndTel_uuid(user_uuid, tel_uuid);
    }
}