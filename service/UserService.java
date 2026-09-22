package com.safetymap.safetymap.service;

import com.safetymap.safetymap.dto.UserRegisterDto;
import com.safetymap.safetymap.dto.UserTelRegisterDto;
import com.safetymap.safetymap.entity.UserTel;
import com.safetymap.safetymap.entity.Users;
import com.safetymap.safetymap.repository.UserTelRepository;
import com.safetymap.safetymap.repository.UsersRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

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
}
