package com.safetymap.safetymap.dto;

    // 어떤 글을 어떻게 수정할지 데이터를 받는 DTO
public class PostsEditRequestDto {

    // 고유 식별자
    private String post_uuid;

    // 사용자가 새롭게 수정한 제목과 내용
    private String post_title;
    private String post_content;


    public PostsEditRequestDto() {
    }


    public PostsEditRequestDto(String post_uuid, String post_title, String post_content) {
        this.post_uuid = post_uuid;
        this.post_title = post_title;
        this.post_content = post_content;
    }



    public String getPost_uuid() {
        return post_uuid;
    }

    public void setPost_uuid(String post_uuid) {
        this.post_uuid = post_uuid;
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