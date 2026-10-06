package com.safetymap.safetymap.repository;

import com.safetymap.safetymap.entity.LinkInvite;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface LinkInviteRepository extends JpaRepository<LinkInvite, Integer> {

    // 코드로 1개 조회
    @Query("""
            SELECT i
            FROM LinkInvite i
            JOIN FETCH i.user u
            WHERE i.code = :code
            """)
    Optional<LinkInvite> findByCode(@Param("code") String code);

    // 이 회원이 만든 코드 전부 (새 코드를 만들 때 이전 코드를 지우려고 찾는다)
    @Query("""
            SELECT i
            FROM LinkInvite i
            WHERE i.user.user_uuid = :user_uuid
            """)
    List<LinkInvite> findAllByUserUuid(@Param("user_uuid") String user_uuid);

    // 만료된 코드 전부 (청소용)
    @Query("""
            SELECT i
            FROM LinkInvite i
            WHERE i.expires_at <= :now
            """)
    List<LinkInvite> findAllExpired(@Param("now") long now);
}
