package com.safetymap.safetymap.dto;

import java.time.LocalDate; // 날짜 데이터를 다루기 위해 추가
    // 게시판 목록 화면에서 게시글의 요약 정보만 프론트엔드로 전달하는 응답용 DTO
public class PostsListDto {


    // 서버 성능과 네트워크 통신량
    private String post_uuid;    // 고유 식별자
    private String post_title;   // 글 제목
    private String user_name;    // 작성자 이름 (또는 닉네임)
    private LocalDate created_at; // 작성일


    public PostsListDto() {
    }


    public PostsListDto(String post_uuid, String post_title, String user_name, LocalDate created_at) {
        this.post_uuid = post_uuid;
        this.post_title = post_title;
        this.user_name = user_name;
        this.created_at = created_at;
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

    public String getUser_name() {
        return user_name;
    }

    public void setUser_name(String user_name) {
        this.user_name = user_name;
    }

    public LocalDate getCreated_at() {
        return created_at;
    }

    public void setCreated_at(LocalDate created_at) {
        this.created_at = created_at;
    }
}