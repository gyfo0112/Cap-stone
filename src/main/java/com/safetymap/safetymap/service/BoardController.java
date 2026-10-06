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
}