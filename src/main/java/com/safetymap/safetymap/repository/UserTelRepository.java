package com.safetymap.safetymap.repository;

import com.safetymap.safetymap.entity.UserTel;
import org.springframework.data.domain.Slice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

public interface UserTelRepository extends JpaRepository<UserTel, Integer> {

    // 유저 uuid로 모든 전화번호 가져오기
    @Query("""
            SELECT t
            FROM UserTel t
            WHERE t.user.user_uuid = :userUuid
            """)
    Slice<UserTel> findAllByUser_User_uuid(@Param("userUuid") String user_uuid);

    // 유저 uuid와 tel uuid로 하나 삭제
    @Modifying
    @Transactional
    @Query("""
            DELETE FROM UserTel t
            WHERE t.user.user_uuid = :userUuid
            AND t.tel_uuid = :telUuid
            """)
    void deleteByUser_User_uuidAndTel_uuid(@Param("userUuid") String user_uuid, @Param("telUuid") String tel_uuid);

    // uuid 두 개로 데이터가 존재하는지 확인 (예외처리용)
    @Query("""
            SELECT CASE WHEN COUNT(t) > 0 THEN true ELSE false END
            FROM UserTel t
            WHERE t.user.user_uuid = :userUuid
            AND t.tel_uuid = :telUuid
            """)
    boolean existsByUser_User_uuidAndTel_uuid(@Param("userUuid") String user_uuid, @Param("telUuid") String tel_uuid);
}