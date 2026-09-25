package com.safetymap.safetymap.repository;

import com.safetymap.safetymap.entity.Favorite;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface FavoriteRepository extends JpaRepository<Favorite, Integer> {

    // 사용자의 즐겨찾기 전체 목록
    @Query("""
            SELECT f
            FROM Favorite f
            JOIN FETCH f.user u
            JOIN FETCH f.marker m
            WHERE u.user_uuid = :user_uuid
            ORDER BY f.idx DESC
            """)
    List<Favorite> findAllByUserUuid(@Param("user_uuid") String user_uuid);

    // 사용자 + 마커로 즐겨찾기 1개 조회 (이름 변경·해제에 쓴다)
    @Query("""
            SELECT f
            FROM Favorite f
            JOIN FETCH f.user u
            JOIN FETCH f.marker m
            WHERE u.user_uuid = :user_uuid
              AND m.marker_uuid = :marker_uuid
            """)
    Optional<Favorite> findByUserUuidAndMarkerUuid(@Param("user_uuid") String user_uuid,
                                                   @Param("marker_uuid") String marker_uuid);

    // 이미 담았는지 확인
    @Query("""
            SELECT COUNT(f)
            FROM Favorite f
            WHERE f.user.user_uuid = :user_uuid
              AND f.marker.marker_uuid = :marker_uuid
            """)
    long countByUserUuidAndMarkerUuid(@Param("user_uuid") String user_uuid,
                                      @Param("marker_uuid") String marker_uuid);
}