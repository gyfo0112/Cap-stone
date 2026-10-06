package com.safetymap.safetymap.repository;

import com.safetymap.safetymap.entity.UserLink;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserLinkRepository extends JpaRepository<UserLink, Integer> {

    // 보호자 기준 연결 목록 (내가 보호자인 연결)
    @Query("""
            SELECT l
            FROM UserLink l
            JOIN FETCH l.guardian g
            JOIN FETCH l.protected_user p
            WHERE g.user_uuid = :user_uuid
            ORDER BY l.idx ASC
            """)
    List<UserLink> findAllByGuardianUuid(@Param("user_uuid") String user_uuid);

    // 보호 대상 기준 연결 목록 (내가 보호 대상인 연결)
    @Query("""
            SELECT l
            FROM UserLink l
            JOIN FETCH l.guardian g
            JOIN FETCH l.protected_user p
            WHERE p.user_uuid = :user_uuid
            ORDER BY l.idx ASC
            """)
    List<UserLink> findAllByProtectedUuid(@Param("user_uuid") String user_uuid);

    // 연결 UUID로 1개 조회
    @Query("""
            SELECT l
            FROM UserLink l
            JOIN FETCH l.guardian g
            JOIN FETCH l.protected_user p
            WHERE l.link_uuid = :link_uuid
            """)
    Optional<UserLink> findByLinkUuid(@Param("link_uuid") String link_uuid);

    // 이미 연결된 사이인지 확인
    @Query("""
            SELECT COUNT(l)
            FROM UserLink l
            WHERE l.guardian.user_uuid = :guardian_uuid
              AND l.protected_user.user_uuid = :protected_uuid
            """)
    long countByGuardianUuidAndProtectedUuid(@Param("guardian_uuid") String guardian_uuid,
                                             @Param("protected_uuid") String protected_uuid);

    // 이 보호 대상의 위치를 받고 있는(공유가 켜진) 연결 개수
    @Query("""
            SELECT COUNT(l)
            FROM UserLink l
            WHERE l.protected_user.user_uuid = :user_uuid
              AND l.sharing = true
            """)
    long countSharingByProtectedUuid(@Param("user_uuid") String user_uuid);
}
