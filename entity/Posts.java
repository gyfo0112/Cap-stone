package com.safetymap.safetymap.entity;

import jakarta.persistence.*;

import java.util.Date;

@Entity
@Table(name = "posts")
public class Posts {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int idx;

    @Column(name = "post_uuid", unique = true, length = 36)
    private String post_uuid;

    @Column(name = "post_title", nullable = false, length = 50)
    private String post_title;

    @Column(name = "body")
    private String body;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
        name = "user_uuid",
        referencedColumnName = "user_uuid"
    )
    private Users user;

    @Column(name = "created_at")
    private Date created_at;

    public int getIdx() {
        return idx;
    }

    public void setIdx(int idx) {
        this.idx = idx;
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

    public Users getUser() {
        return user;
    }

    public void setUser(Users user) {
        this.user = user;
    }

    public Date getCreated_at() {
        return created_at;
    }

    public void setCreated_at(Date created_at) {
        this.created_at = created_at;
    }
}
