package com.safetymap.safetymap.repository;

import com.safetymap.safetymap.entity.Marker;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface MarkerRepository extends JpaRepository<Marker, Integer> {

    // UUID로 마커 1개 조회
    @Query("""
            SELECT m
            FROM Marker m
            WHERE m.marker_uuid = :marker_uuid
            """)
    Optional<Marker> findByMarkerUuid(@Param("marker_uuid") String marker_uuid);

    // 지도 화면 사각형 안의 마커 조회
    @Query("""
            SELECT m
            FROM Marker m
            WHERE m.latitude BETWEEN :min_latitude AND :max_latitude
              AND m.longitude BETWEEN :min_longitude AND :max_longitude
            ORDER BY m.idx ASC
            """)
    List<Marker> findAllInBounds(@Param("min_latitude") double min_latitude,
                                 @Param("max_latitude") double max_latitude,
                                 @Param("min_longitude") double min_longitude,
                                 @Param("max_longitude") double max_longitude);

    // 지도 화면 사각형 안에서 종류로 거른 마커 조회
    @Query("""
            SELECT m
            FROM Marker m
            WHERE m.marker_type = :marker_type
              AND m.latitude BETWEEN :min_latitude AND :max_latitude
              AND m.longitude BETWEEN :min_longitude AND :max_longitude
            ORDER BY m.idx ASC
            """)
    List<Marker> findAllInBoundsByType(@Param("marker_type") String marker_type,
                                       @Param("min_latitude") double min_latitude,
                                       @Param("max_latitude") double max_latitude,
                                       @Param("min_longitude") double min_longitude,
                                       @Param("max_longitude") double max_longitude);
}