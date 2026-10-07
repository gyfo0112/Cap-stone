package com.safetymap.safetymap.repository;

import com.safetymap.safetymap.entity.Users;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface UsersRepository extends JpaRepository<Users, Integer> {

    /*
    * 굳이 쿼리문을 붙인 이유 :
    * user_uuid라고 컬럼이 되어있는데, JPA가 _를 .이라고 인식합니다. 그래서 쿼리문으로 명시하는게 좋아요
    */

    // uuid로 유저 정보 가져오기
    @Query("SELECT u FROM Users u WHERE u.user_uuid = :userUuid")
    Optional<Users> findByUser_uuid(@Param("userUuid") String user_uuid);

    // id로 유저 정보 가져오기
    @Query("SELECT u FROM Users u WHERE u.user_id = :userId")
    Optional<Users> findByUser_id(@Param("userId") String user_id);

    // id로 데이터가 존재하는지 확인 (예외처리용)
    @Query("""
            SELECT CASE WHEN COUNT(u) > 0 THEN true ELSE false END
            FROM Users u
            WHERE u.user_id = :userId
            """)
    boolean existsByUser_id(@Param("userId") String user_id);

    // uuid로 데이터가 존재하는지 확인 (예외처리용)
    @Query("""
            SELECT CASE WHEN COUNT(u) > 0 THEN true ELSE false END
            FROM Users u
            WHERE u.user_uuid = :userUuid
            """)
    boolean existsByUser_uuid(@Param("userUuid") String user_uuid);
}