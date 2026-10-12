package com.safetymap.safetymap.dto;

import java.time.LocalDate;

public class PostListDto {

    private String post_uuid;
    private String post_title;
    private String body;

    private String user_uuid;
    private String user_name;

    private String post_type;
    private String post_status;

    private LocalDate created_at;

    private long request_count;

    public PostListDto(
            String post_uuid,
            String post_title,
            String body,
            String user_uuid,
            String user_name,
            String post_type,
            String post_status,
            LocalDate created_at,
            long request_count
    ) {
        this.post_uuid = post_uuid;
        this.post_title = post_title;
        this.body = body;
        this.user_uuid = user_uuid;
        this.user_name = user_name;
        this.post_type = post_type;
        this.post_status = post_status;
        this.created_at = created_at;
        this.request_count = request_count;
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

    public String getBody() {
        return body;
    }

    public void setBody(String body) {
        this.body = body;
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

    public String getPost_type() {
        return post_type;
    }

    public void setPost_type(String post_type) {
        this.post_type = post_type;
    }

    public String getPost_status() {
        return post_status;
    }

    public void setPost_status(String post_status) {
        this.post_status = post_status;
    }

    public LocalDate getCreated_at() {
        return created_at;
    }

    public void setCreated_at(LocalDate created_at) {
        this.created_at = created_at;
    }

    public long getRequest_count() {
        return request_count;
    }

    public void setRequest_count(long request_count) {
        this.request_count = request_count;
    }
}