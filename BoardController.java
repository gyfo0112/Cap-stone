package com.myprofile.myprofileweb.controller;

import com.myprofile.myprofileweb.dto.*;
import com.myprofile.myprofileweb.entity.Comments;
import com.myprofile.myprofileweb.entity.Posts;
import com.myprofile.myprofileweb.entity.Profile;
import com.myprofile.myprofileweb.repository.PostsRepository;
import com.myprofile.myprofileweb.repository.ProfileRepository;
import com.myprofile.myprofileweb.service.CommentService;
import com.myprofile.myprofileweb.service.PostService;
import com.myprofile.myprofileweb.service.ProfileService;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

@Controller
public class BoardController {

    private final ProfileService profileService;
    private final PostService postService;
    private final CommentService commentService;

    public BoardController(ProfileService profileService, PostService postService, CommentService commentService) {
        this.profileService = profileService;
        this.postService = postService;
        this.commentService = commentService;
    }

    // 전체 글 보기
    @GetMapping("/board/list")
    public String boardList(Model model,
                            @RequestParam(defaultValue = "") String searchType,
                            @RequestParam(required = false) String keyword,
                            @RequestParam(defaultValue = "0") int page,
                            @RequestParam(defaultValue = "") String mode) {

        Pageable pageable = PageRequest.of(page, 10);
        Slice<PostsListDto> list;

        if(keyword!=null && !keyword.isBlank()) {
            if(searchType.equals("title")) {
                list = postService.getPostsSearchTitle(keyword, pageable);
            } else {
                list = postService.getPostsSearchContent(keyword, pageable);
            }
        } else {
            if(mode.equals("hot")) {
                list = postService.getPostsAbove10Comments(pageable);
            } else {
                list = postService.getPosts(pageable);
            }
        }

        model.addAttribute("posts", list);
        model.addAttribute("mode", mode);
        model.addAttribute("searchType", searchType);
        model.addAttribute("keyword", keyword);

        return "posts/list";
    }

    // 글 작성 매핑
    @GetMapping("/board/post")
    public String postUpload() {
        return "posts/post";
    }

    // 글 작성 처리 매핑
    @PostMapping("/board/post")
    public String postUploadProc(@ModelAttribute PostsUploadRequestDto dto, Authentication auth) {

        String postUUID = UUID.randomUUID().toString();

        Posts post = new Posts();
        post.setPostUUID(postUUID);
        post.setProfile(profileService.getProfile(auth.getName()));
        post.setPostTitle(dto.getPostTitle());
        post.setPostContent(dto.getPostContent());
        post.setCreatedAt(LocalDate.now());

        postService.uploadPost(post);

        return "redirect:/board/list";
    }

    // 글 내용 보기 매핑
    @GetMapping("/board/detail/{postUUID}")
    public String detail(Model model,
                         @PathVariable String postUUID,
                         @RequestParam(defaultValue = "0") int page,
                         Authentication auth) {

        Pageable pageable = PageRequest.of(page, 10);

        model.addAttribute("post", postService.getPostsPublic(postUUID));
        model.addAttribute("userUUID", profileService.getProfileUUID(auth.getName()));
        model.addAttribute("commentlist", commentService.getCommentList(postUUID, pageable));

        return "posts/detail";
    }

    // 댓글 작성 매핑
    @PostMapping("/board/detail/{postUUID}")
    public String detailCommentProc(@PathVariable String postUUID,
                                    @ModelAttribute CommentsUploadRequestDto dto,
                                    Authentication auth) {

        String userUUID = profileService.getProfileUUID(auth.getName());
        commentService.uploadComment(dto, postUUID, userUUID);

        return "redirect:/board/detail/" + postUUID;
    }

    // 글 삭제
    @PostMapping("/board/detail/delete")
    public String deletePost(@RequestParam String postUUID, Authentication auth) {
        String profileUUID = profileService.getProfileUUID(auth.getName());
        PostsPublicDto dto = postService.getPostsPublic(postUUID);

        if(profileUUID.equals(profileService.getProfileUUIDByName(dto.getProfileName()))) {
            postService.deletePost(postUUID);
        }

        return "redirect:/board/list";
    }

    // 댓글 삭제
    @PostMapping("/board/comment/delete")
    public String deleteComment(@RequestParam int idxComment,
                                @RequestParam String postUUID,
                                Authentication auth) {

        String userUUID = profileService.getProfileUUID(auth.getName());

        boolean res = commentService.deleteComment(idxComment, userUUID);

        if(res) {
            return "redirect:/board/detail/" + postUUID;
        }

        return "redirect:/board/detail/" + postUUID +"?error";
    }

    // 글 수정
    @GetMapping("/board/edit/{postUUID}")
    public String editPost(@PathVariable String postUUID, Authentication auth, Model model) {

        PostsPublicDto dto = postService.getPostsPublic(postUUID);

        String postUserUUID = profileService.getProfileUUIDByName(dto.getProfileName());
        String userUUID = profileService.getProfileUUID(auth.getName());

        if(postUserUUID.equals(userUUID)) {
            model.addAttribute("post", dto);

            return "posts/edit";
        }

        return "redirect:/board/detail/" + postUUID +"?error";
    }

    // 글 수정 처리
    @PostMapping("/board/edit")
    public String editPostProc(@ModelAttribute PostsEditRequestDto dto, Authentication auth) {

        String userUUID = profileService.getProfileUUID(auth.getName());

        boolean res = postService.editPost(dto, userUUID);

        if(res) {
            return "redirect:/board/detail/"+ dto.getPostUUID();
        }
        return "redirect:/board/detail/"+ dto.getPostUUID() +"?error";
    }
}
