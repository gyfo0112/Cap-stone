package com.safetymap.safetymap.repository;

import com.safetymap.safetymap.entity.PostRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

public interface PostRequestRepository
        extends JpaRepository<PostRequest, Integer> {

    // 특정 사용자가 특정 게시글에 이미 요청했는지 확인
    @Query("""
            SELECT CASE WHEN COUNT(r) > 0 THEN true ELSE false END
            FROM PostRequest r
            WHERE r.user.user_uuid = :userUuid
            AND r.post.post_uuid = :postUuid
            """)
    boolean existsByUser_uuidAndPost_uuid(
            @Param("userUuid") String user_uuid,
            @Param("postUuid") String post_uuid
    );


    // 특정 사용자의 특정 게시글 요청 조회
    @Query("""
            SELECT r
            FROM PostRequest r
            WHERE r.user.user_uuid = :userUuid
            AND r.post.post_uuid = :postUuid
            """)
    Optional<PostRequest> findByUser_uuidAndPost_uuid(
            @Param("userUuid") String user_uuid,
            @Param("postUuid") String post_uuid
    );


    // 특정 게시글에 들어온 요청 목록
    @Query("""
            SELECT r
            FROM PostRequest r
            WHERE r.post.post_uuid = :postUuid
            ORDER BY r.idx ASC
            """)
    List<PostRequest> findAllByPost_uuid(
            @Param("postUuid") String post_uuid
    );


    // 특정 게시글 요청 수
    @Query("""
            SELECT COUNT(r)
            FROM PostRequest r
            WHERE r.post.post_uuid = :postUuid
            """)
    long countByPost_uuid(
            @Param("postUuid") String post_uuid
    );


    // 특정 사용자의 특정 게시글 요청 삭제
    @Modifying
    @Transactional
    @Query("""
            DELETE FROM PostRequest r
            WHERE r.user.user_uuid = :userUuid
            AND r.post.post_uuid = :postUuid
            """)
    void deleteByUser_uuidAndPost_uuid(
            @Param("userUuid") String user_uuid,
            @Param("postUuid") String post_uuid
    );


    // 게시글 삭제 전 해당 게시글의 요청 전체 삭제
    @Modifying
    @Transactional
    @Query("""
            DELETE FROM PostRequest r
            WHERE r.post.post_uuid = :postUuid
            """)
    void deleteAllByPost_uuid(
            @Param("postUuid") String post_uuid
    );
}