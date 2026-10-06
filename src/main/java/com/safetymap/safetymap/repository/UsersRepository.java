package com.safetymap.safetymap.repository;

import com.safetymap.safetymap.entity.Users;
import org.springframework.data.domain.Slice;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UsersRepository extends JpaRepository<Users, Integer> {

    // uuid로 유저 정보 가져오기
    Optional<Users> findByUser_uuid(String user_uuid);
    
}
