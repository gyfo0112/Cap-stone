package com.safetymap.safetymap.service;

import com.safetymap.safetymap.dto.PostsUploadRequestDto;
import com.safetymap.safetymap.entity.Posts;
import com.safetymap.safetymap.entity.Users;
import com.safetymap.safetymap.repository.PostsRepository;
import org.springframework.stereotype.Service;

@Service
public class BoardService {

    private final PostsRepository postsRepository;

    public BoardService(PostsRepository postsRepository) {
        this.postsRepository = postsRepository;
    }

    // 1. 글쓰기 로직
    public void createPost(PostsUploadRequestDto dto) {
        Users dummyUser = new Users();
        dummyUser.setUser_uuid("718c1e59-c12f-11f1-af34-f8b46abe5624");

        Posts post = new Posts();
        post.setPost_title(dto.getPost_title());
        post.setPost_type(dto.getPost_type());
        post.setBody(dto.getBody());
        post.setLatitude(dto.getLatitude());
        post.setLongitude(dto.getLongitude());

        post.setUser(dummyUser);
        postsRepository.save(post);

        System.out.println("=========================================");
        System.out.println("🎉 [DB 저장 완료] 프론트엔드 데이터가 MySQL에 성공적으로 들어갔습니다!");
        System.out.println("👉 작성된 제목: " + post.getPost_title());
        System.out.println("=========================================");
    }

    // 2. 글 수정 로직
    public void updatePost(String post_uuid, PostsUploadRequestDto dto) {
        Posts post = postsRepository.findByPostUuid(post_uuid)
                .orElseThrow(() -> new IllegalArgumentException("해당 도움 요청을 찾을 수 없습니다. UUID: " + post_uuid));

        post.setPost_title(dto.getPost_title());
        post.setPost_type(dto.getPost_type());
        post.setBody(dto.getBody());
        post.setLatitude(dto.getLatitude());
        post.setLongitude(dto.getLongitude());


        postsRepository.save(post);

        System.out.println("✏️ [글 수정 완료] " + post.getPost_title());
    }

    // 3. 글 삭제
    public void deletePost(String post_uuid) {
        Posts post = postsRepository.findByPostUuid(post_uuid)
                .orElseThrow(() -> new IllegalArgumentException("해당 도움 요청을 찾을 수 없습니다. UUID: " + post_uuid));

        postsRepository.delete(post);

        System.out.println("🗑️ [글 삭제 완료] UUID: " + post_uuid);
    }

    // 4. 수락 / 수락 취소
    public void toggleAccept(String post_uuid, boolean isAccepted) {
        Posts post = postsRepository.findByPostUuid(post_uuid)
                .orElseThrow(() -> new IllegalArgumentException("해당 도움 요청을 찾을 수 없습니다. UUID: " + post_uuid));

        if (isAccepted) {
            post.setPost_status("ACCEPTED");
        } else {
            post.setPost_status("WAITING");
        }

        postsRepository.save(post);

        System.out.println("✅ [수락 상태 변경 완료] 현재 상태: " + post.getPost_status());
    }
}
