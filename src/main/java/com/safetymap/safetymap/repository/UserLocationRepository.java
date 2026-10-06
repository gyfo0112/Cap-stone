package com.safetymap.safetymap.repository;

import com.safetymap.safetymap.entity.UserLocation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface UserLocationRepository extends JpaRepository<UserLocation, Integer> {

    // 회원의 마지막 위치 조회
    @Query("""
            SELECT loc
            FROM UserLocation loc
            WHERE loc.user.user_uuid = :user_uuid
            """)
    Optional<UserLocation> findByUserUuid(@Param("user_uuid") String user_uuid);
}
