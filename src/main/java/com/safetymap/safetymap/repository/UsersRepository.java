package com.safetymap.safetymap.repository;

import com.safetymap.safetymap.entity.Users;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UsersRepository extends JpaRepository<Users, Integer> {

    // UUID로 회원 1명 조회 (로그인한 사용자 확인, 즐겨찾기·연락처 연결에 쓴다)
    @Query("""
            SELECT u
            FROM Users u
            WHERE u.user_uuid = :user_uuid
            """)
    Optional<Users> findByUserUuid(@Param("user_uuid") String user_uuid);

    // 아이디로 회원 1명 조회 (로그인에 쓴다)
    @Query("""
            SELECT u
            FROM Users u
            WHERE u.user_id = :user_id
            """)
    Optional<Users> findByUserId(@Param("user_id") String user_id);

    // 이름으로 회원 조회 (아이디 찾기에 쓴다. 동명이인이 있을 수 있어 목록으로 받는다)
    @Query("""
            SELECT u
            FROM Users u
            WHERE u.user_name = :user_name
            ORDER BY u.idx ASC
            """)
    List<Users> findAllByUserName(@Param("user_name") String user_name);

    // 이미 쓰는 아이디인지 확인 (회원 가입에 쓴다)
    @Query("""
            SELECT COUNT(u)
            FROM Users u
            WHERE u.user_id = :user_id
            """)
    long countByUserId(@Param("user_id") String user_id);
}
