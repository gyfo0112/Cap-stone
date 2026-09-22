package com.safetymap.safetymap.dto;

// 사용자가 폼에 입력한 게시글 제목과 내용
public class PostsUploadRequestDto {

    private String post_title; // 게시글 제목
    private String post_content; // 게시글 내용

    public PostsUploadRequestDto() {
    }

    public PostsUploadRequestDto(String post_title, String post_content) {
        this.post_title = post_title;
        this.post_content = post_content;
    }

    public String getPost_title() {
        return post_title;
    }

    public void setPost_title(String post_title) {
        this.post_title = post_title;
    }

    public String getPost_content() {
        return post_content;
    }

    public void setPost_content(String post_content) {
        this.post_content = post_content;
    }
}