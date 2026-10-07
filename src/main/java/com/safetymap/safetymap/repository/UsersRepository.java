package com.safetymap.safetymap.repository;

import com.safetymap.safetymap.entity.Users;
import org.springframework.data.domain.Slice;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UsersRepository extends JpaRepository<Users, Integer> {

    // uuid로 유저 정보 가져오기
    Optional<Users> findByUser_uuid(String user_uuid);

    // id로 유저 정보 가져오기
    Optional<Users> findByUser_id(String user_id);

    // id로 데이터가 존재하는지 확인 (예외처리용)
    boolean existsByUser_id(String user_id);

    // uuid로 데이터가 존재하는지 확인 (예외처리용)
    boolean existsByUser_uuid(String user_uuid);
    
}
