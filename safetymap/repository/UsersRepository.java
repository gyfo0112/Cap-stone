package com.safetymap.safetymap.repository;

import com.safetymap.safetymap.entity.Users;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface UsersRepository extends JpaRepository<Users, Integer> {

    // UUID로 회원 1명 조회
    @Query("""
            SELECT u
            FROM Users u
            WHERE u.user_uuid = :user_uuid
            """)
    Optional<Users> findByUserUuid(@Param("user_uuid") String user_uuid);
}