package com.safetymap.safetymap.dto;

import java.time.LocalDate;
    // 작성자 본인 확인(수정/삭제 권한)을 위한 응답용 DTO
public class PostsPublicDto {

    // 화면에 출력할 상세 데이터 및 권한 대조용 데이터
    private String post_uuid;    // 현재 보고 있는 게시글의 고유 식별자
    private String user_uuid;

    private String user_name;    // 작성자 이름 (화면 출력용)
    private String post_title;   // 글 제목
    private String post_content; // 글 전체 내용
    private LocalDate created_at; // 작성일


    public PostsPublicDto() {
    }


    public PostsPublicDto(String post_uuid, String user_uuid, String user_name, String post_title, String post_content, LocalDate created_at) {
        this.post_uuid = post_uuid;
        this.user_uuid = user_uuid;
        this.user_name = user_name;
        this.post_title = post_title;
        this.post_content = post_content;
        this.created_at = created_at;
    }



    public String getPost_uuid() {
        return post_uuid;
    }

    public void setPost_uuid(String post_uuid) {
        this.post_uuid = post_uuid;
    }

    public String getUser_uuid() {
        return user_uuid;
    }

    public void setUser_uuid(String user_uuid) {
        this.user_uuid = user_uuid;
    }

    public String getUser_name() {
        return user_name;
    }

    public void setUser_name(String user_name) {
        this.user_name = user_name;
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

    public LocalDate getCreated_at() {
        return created_at;
    }

    public void setCreated_at(LocalDate created_at) {
        this.created_at = created_at;
    }
}