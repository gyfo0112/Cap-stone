package com.safetymap.safetymap.controller;

import com.safetymap.safetymap.dto.PostCreateDto;
import com.safetymap.safetymap.dto.PostDetailDto;
import com.safetymap.safetymap.dto.PostListDto;
import com.safetymap.safetymap.dto.PostUpdateDto;
import com.safetymap.safetymap.security.CustomUserDetails;
import com.safetymap.safetymap.service.PostsService;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/posts")
public class PostsController {

    private final PostsService postsService;

    public PostsController(PostsService postsService) {
        this.postsService = postsService;
    }

    // 게시글 전체 조회
    @GetMapping
    public List<PostListDto> getPostList() {
        return postsService.getPostList();
    }

    // 게시글 상세 조회
    @GetMapping("/{post_uuid}")
    public PostDetailDto getPostDetail(
            @PathVariable String post_uuid,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        return postsService.getPostDetail(
                post_uuid,
                userDetails.getUserUuid()
        );
    }

    // 게시글 작성
    @PostMapping
    public PostDetailDto createPost(
            @RequestBody PostCreateDto dto,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        return postsService.createPost(
                dto,
                userDetails.getUserUuid()
        );
    }

    // 게시글 수정 / 상태 변경
    @PatchMapping("/{post_uuid}")
    public PostDetailDto updatePost(
            @PathVariable String post_uuid,
            @RequestBody PostUpdateDto dto,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        return postsService.updatePost(
                post_uuid,
                dto,
                userDetails.getUserUuid()
        );
    }

    // 게시글 삭제
    @DeleteMapping("/{post_uuid}")
    public void deletePost(
            @PathVariable String post_uuid,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        postsService.deletePost(
                post_uuid,
                userDetails.getUserUuid()
        );
    }

    // 도움 요청 참여
    @PostMapping("/{post_uuid}/requests")
    public void requestPost(
            @PathVariable String post_uuid,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        postsService.requestPost(
                post_uuid,
                userDetails.getUserUuid()
        );
    }

    // 도움 요청 참여 취소
    @DeleteMapping("/{post_uuid}/requests")
    public void cancelPostRequest(
            @PathVariable String post_uuid,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        postsService.cancelPostRequest(
                post_uuid,
                userDetails.getUserUuid()
        );
    }
}