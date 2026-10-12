package com.safetymap.safetymap.repository;

import com.safetymap.safetymap.entity.Posts;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface PostsRepository extends JpaRepository<Posts, Integer> {

    // post_uuid로 게시글 단일 조회
    @Query("SELECT p FROM Posts p WHERE p.post_uuid = :postUuid")
    Optional<Posts> findByPost_uuid(@Param("postUuid") String post_uuid);


    // 최신 게시글 순으로 전체 조회
    @Query("""
            SELECT p
            FROM Posts p
            ORDER BY p.created_at DESC, p.idx DESC
            """)
    List<Posts> findAllOrderByCreatedAtDesc();


    // 게시글 타입별 조회
    @Query("""
            SELECT p
            FROM Posts p
            WHERE p.post_type = :postType
            ORDER BY p.created_at DESC, p.idx DESC
            """)
    List<Posts> findAllByPost_type(
            @Param("postType") String post_type
    );


    // 게시글 상태별 조회
    @Query("""
            SELECT p
            FROM Posts p
            WHERE p.post_status = :postStatus
            ORDER BY p.created_at DESC, p.idx DESC
            """)
    List<Posts> findAllByPost_status(
            @Param("postStatus") String post_status
    );


    // 작성자 UUID 기준 게시글 조회
    @Query("""
            SELECT p
            FROM Posts p
            WHERE p.user.user_uuid = :userUuid
            ORDER BY p.created_at DESC, p.idx DESC
            """)
    List<Posts> findAllByUser_uuid(
            @Param("userUuid") String user_uuid
    );


    // post_uuid 존재 여부
    @Query("""
            SELECT CASE WHEN COUNT(p) > 0 THEN true ELSE false END
            FROM Posts p
            WHERE p.post_uuid = :postUuid
            """)
    boolean existsByPost_uuid(
            @Param("postUuid") String post_uuid
    );
}