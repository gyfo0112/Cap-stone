package com.safetymap.safetymap.repository;

import com.safetymap.safetymap.entity.UserTel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserTelRepository extends JpaRepository<UserTel, Integer> {

    // 사용자의 보호자 연락처 전체 목록 (등록한 순서)
    @Query("""
            SELECT t
            FROM UserTel t
            JOIN FETCH t.user u
            WHERE u.user_uuid = :user_uuid
            ORDER BY t.idx ASC
            """)
    List<UserTel> findAllByUserUuid(@Param("user_uuid") String user_uuid);

    // 사용자 + 연락처 UUID로 1개 조회 (삭제에 쓴다. 남의 연락처는 나오지 않는다)
    @Query("""
            SELECT t
            FROM UserTel t
            JOIN FETCH t.user u
            WHERE u.user_uuid = :user_uuid
              AND t.tel_uuid = :tel_uuid
            """)
    Optional<UserTel> findByUserUuidAndTelUuid(@Param("user_uuid") String user_uuid,
                                               @Param("tel_uuid") String tel_uuid);

    // 이미 등록된 전화번호인지 확인 (tel_num 컬럼이 unique 라서 저장 전에 확인한다)
    @Query("""
            SELECT COUNT(t)
            FROM UserTel t
            WHERE t.tel_num = :tel_num
            """)
    long countByTelNum(@Param("tel_num") String tel_num);
}
