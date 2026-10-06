package com.safetymap.safetymap.controller;

import com.safetymap.safetymap.dto.PostsUploadRequestDto;
import com.safetymap.safetymap.service.BoardService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/board")
@CrossOrigin(origins = "http://localhost:5173")
public class BoardController {

    private final BoardService boardService;

    public BoardController(BoardService boardService) {
        this.boardService = boardService;
    }

    // 1. 글쓰기 (도움 요청 올리기)
    @PostMapping("/post")
    public ResponseEntity<String> createPost(@RequestBody PostsUploadRequestDto dto) {


        boardService.createPost(dto);

        return ResponseEntity.ok("도움 요청 글 등록 성공! 백엔드가 잘 받았습니다.");
    }

    // 2. 글 목록 조회 (임시 처리)
    @GetMapping("/posts")
    public ResponseEntity<?> getPosts() {

        // boardService.getPostList();

        return ResponseEntity.ok("목록 조회 테스트 (데이터 연동 필요)");
    }

    // 3. 글 수정
    @PutMapping("/post/{post_uuid}")
    public ResponseEntity<String> updatePost(@PathVariable String post_uuid, @RequestBody PostsUploadRequestDto dto) {

        // boardService.updatePost(post_uuid, dto); // 서비스 쪽에 만들 함수
        return ResponseEntity.ok("도움 요청 글이 성공적으로 수정되었습니다.");
    }

    // 4. 글 삭제
    @DeleteMapping("/post/{post_uuid}")
    public ResponseEntity<String> deletePost(@PathVariable String post_uuid) {

        // boardService.deletePost(post_uuid); // 서비스 쪽에 만들 함수
        return ResponseEntity.ok("글이 성공적으로 삭제되었습니다.");
    }

    // 5. 수락 / 수락 취소
    @PatchMapping("/post/{post_uuid}/accept")
    public ResponseEntity<String> toggleAccept(@PathVariable String post_uuid, @RequestParam boolean isAccepted) {

        // boardService.toggleAccept(post_uuid, isAccepted); // 서비스 쪽에 만들 함수
        return ResponseEntity.ok(isAccepted ? "도움 요청을 수락했습니다." : "수락을 취소했습니다.");
    }
}
