package com.safetymap.safetymap.service;

import com.safetymap.safetymap.dto.PostCreateDto;
import com.safetymap.safetymap.dto.PostDetailDto;
import com.safetymap.safetymap.dto.PostListDto;
import com.safetymap.safetymap.dto.PostUpdateDto;
import com.safetymap.safetymap.entity.PostRequest;
import com.safetymap.safetymap.entity.Posts;
import com.safetymap.safetymap.entity.Users;
import com.safetymap.safetymap.exception.BadRequestException;
import com.safetymap.safetymap.exception.ConflictException;
import com.safetymap.safetymap.exception.ForbiddenException;
import com.safetymap.safetymap.exception.NotFoundException;
import com.safetymap.safetymap.repository.PostRequestRepository;
import com.safetymap.safetymap.repository.PostsRepository;
import com.safetymap.safetymap.repository.UsersRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class PostsService {

    private final PostsRepository postsRepository;
    private final PostRequestRepository postRequestRepository;
    private final UsersRepository usersRepository;

    public PostsService(
            PostsRepository postsRepository,
            PostRequestRepository postRequestRepository,
            UsersRepository usersRepository) {

        this.postsRepository = postsRepository;
        this.postRequestRepository = postRequestRepository;
        this.usersRepository = usersRepository;
    }


    // 게시글 전체 목록 조회
    @Transactional(readOnly = true)
    public List<PostListDto> getPostList() {

        List<Posts> posts = postsRepository.findAllOrderByCreatedAtDesc();

        return posts.stream()
                .map(post -> new PostListDto(
                        post.getPost_uuid(),
                        post.getPost_title(),
                        post.getBody(),
                        post.getUser().getUser_uuid(),
                        post.getUser().getUser_name(),
                        post.getPost_type(),
                        post.getPost_status(),
                        post.getCreated_at(),
                        postRequestRepository.countByPost_uuid(
                                post.getPost_uuid()
                        )
                ))
                .toList();
    }


    // 게시글 상세 조회
    @Transactional(readOnly = true)
    public PostDetailDto getPostDetail(
            String post_uuid,
            String user_uuid) {

        Posts post = findPost(post_uuid);

        boolean requestedByMe =
                postRequestRepository.existsByUser_uuidAndPost_uuid(
                        user_uuid,
                        post_uuid
                );

        return toDetailDto(post, requestedByMe);
    }


    // 게시글 작성
    @Transactional
    public PostDetailDto createPost(
            PostCreateDto dto,
            String user_uuid) {

        validateCreateDto(dto);

        Users user = usersRepository.findByUser_uuid(user_uuid)
                .orElseThrow(() ->
                        new NotFoundException("사용자를 찾을 수 없습니다.")
                );

        Posts post = new Posts();

        post.setPost_title(dto.getPost_title());
        post.setBody(dto.getBody());
        post.setPost_type(dto.getPost_type());
        post.setUser(user);

        /*
         * post_uuid
         * created_at
         * post_status = WAITING
         *
         * 위 세 값은 Posts의 @PrePersist에서 자동 생성됩니다.
         */
        Posts savedPost = postsRepository.save(post);

        return toDetailDto(savedPost, false);
    }


    // 게시글 수정
    @Transactional
    public PostDetailDto updatePost(
            String post_uuid,
            PostUpdateDto dto,
            String user_uuid) {

        Posts post = findPost(post_uuid);

        checkPostOwner(post, user_uuid);

        if (dto.getPost_title() != null) {

            if (dto.getPost_title().isBlank()) {
                throw new BadRequestException(
                        "게시글 제목은 비워둘 수 없습니다."
                );
            }

            post.setPost_title(dto.getPost_title());
        }

        if (dto.getBody() != null) {
            post.setBody(dto.getBody());
        }

        if (dto.getPost_type() != null) {

            if (dto.getPost_type().isBlank()) {
                throw new BadRequestException(
                        "게시글 종류는 비워둘 수 없습니다."
                );
            }

            post.setPost_type(dto.getPost_type());
        }

        if (dto.getPost_status() != null) {

            if (dto.getPost_status().isBlank()) {
                throw new BadRequestException(
                        "게시글 상태는 비워둘 수 없습니다."
                );
            }

            post.setPost_status(dto.getPost_status());
        }

        Posts savedPost = postsRepository.save(post);

        boolean requestedByMe =
                postRequestRepository.existsByUser_uuidAndPost_uuid(
                        user_uuid,
                        post_uuid
                );

        return toDetailDto(savedPost, requestedByMe);
    }


    // 게시글 삭제
    @Transactional
    public void deletePost(
            String post_uuid,
            String user_uuid) {

        Posts post = findPost(post_uuid);

        checkPostOwner(post, user_uuid);

        /*
         * post_request가 posts를 FK로 참조하므로
         * 요청 데이터를 먼저 삭제합니다.
         */
        postRequestRepository.deleteAllByPost_uuid(post_uuid);

        postsRepository.delete(post);
    }


    // 도움 요청 참여
    @Transactional
    public void requestPost(
            String post_uuid,
            String user_uuid) {

        Posts post = findPost(post_uuid);

        Users user = usersRepository.findByUser_uuid(user_uuid)
                .orElseThrow(() ->
                        new NotFoundException("사용자를 찾을 수 없습니다.")
                );


        // 자기 게시글에는 도움 요청 불가
        if (post.getUser().getUser_uuid().equals(user_uuid)) {
            throw new BadRequestException(
                    "자신이 작성한 게시글에는 도움 요청을 할 수 없습니다."
            );
        }


        // 완료된 게시글에는 요청 불가
        if (!"WAITING".equals(post.getPost_status())) {
            throw new BadRequestException(
                    "현재 도움 요청을 받을 수 없는 게시글입니다."
            );
        }


        // 중복 요청 검사
        boolean exists =
                postRequestRepository.existsByUser_uuidAndPost_uuid(
                        user_uuid,
                        post_uuid
                );

        if (exists) {
            throw new ConflictException(
                    "이미 도움 요청에 참여했습니다."
            );
        }


        PostRequest request = new PostRequest();

        request.setUser(user);
        request.setPost(post);

        postRequestRepository.save(request);
    }


    // 도움 요청 참여 취소
    @Transactional
    public void cancelPostRequest(
            String post_uuid,
            String user_uuid) {

        findPost(post_uuid);

        boolean exists =
                postRequestRepository.existsByUser_uuidAndPost_uuid(
                        user_uuid,
                        post_uuid
                );

        if (!exists) {
            throw new NotFoundException(
                    "참여 중인 도움 요청을 찾을 수 없습니다."
            );
        }

        postRequestRepository.deleteByUser_uuidAndPost_uuid(
                user_uuid,
                post_uuid
        );
    }


    // =========================
    // 내부 공통 메서드
    // =========================

    private Posts findPost(String post_uuid) {

        return postsRepository.findByPost_uuid(post_uuid)
                .orElseThrow(() ->
                        new NotFoundException(
                                "게시글을 찾을 수 없습니다."
                        )
                );
    }


    private void checkPostOwner(
            Posts post,
            String user_uuid) {

        if (!post.getUser().getUser_uuid().equals(user_uuid)) {

            throw new ForbiddenException(
                    "게시글을 수정하거나 삭제할 권한이 없습니다."
            );
        }
    }


    private void validateCreateDto(PostCreateDto dto) {

        if (dto.getPost_title() == null
                || dto.getPost_title().isBlank()) {

            throw new BadRequestException(
                    "게시글 제목을 입력해주세요."
            );
        }

        if (dto.getPost_type() == null
                || dto.getPost_type().isBlank()) {

            throw new BadRequestException(
                    "게시글 종류를 입력해주세요."
            );
        }
    }


    private PostDetailDto toDetailDto(
            Posts post,
            boolean requestedByMe) {

        return new PostDetailDto(
                post.getPost_uuid(),
                post.getPost_title(),
                post.getBody(),
                post.getUser().getUser_uuid(),
                post.getUser().getUser_name(),
                post.getPost_type(),
                post.getPost_status(),
                post.getCreated_at(),
                postRequestRepository.countByPost_uuid(
                        post.getPost_uuid()
                ),
                requestedByMe
        );
    }
}