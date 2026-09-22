package com.safetymap.safetymap.entity;

import jakarta.persistence.*;

import java.time.LocalDate;
import java.util.UUID;

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

    @Column(name = "body", columnDefinition = "TEXT")
    private String body;


    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "user_uuid",
            referencedColumnName = "user_uuid",
            nullable = false
    )
    private Users user;


    @Column(name = "post_type", nullable = false, length = 20)
    private String post_type;


    @Column(name = "post_status", nullable = false, length = 20)
    private String post_status;

    @Column(name = "created_at")
    private LocalDate created_at;


    @PrePersist
    protected void onCreate() {
        if (this.post_uuid == null) {
            this.post_uuid = UUID.randomUUID().toString();
        }
        if (this.created_at == null) {
            this.created_at = LocalDate.now();
        }
        if (this.post_status == null) {
            this.post_status = "WAITING";
        }
    }



    public int getIdx() { return idx; }
    public void setIdx(int idx) { this.idx = idx; }

    public String getPost_uuid() { return post_uuid; }
    public void setPost_uuid(String post_uuid) { this.post_uuid = post_uuid; }

    public String getPost_title() { return post_title; }
    public void setPost_title(String post_title) { this.post_title = post_title; }

    public String getBody() { return body; }
    public void setBody(String body) { this.body = body; }

    public Users getUser() { return user; }
    public void setUser(Users user) { this.user = user; }

    public String getPost_type() { return post_type; }
    public void setPost_type(String post_type) { this.post_type = post_type; }

    public String getPost_status() { return post_status; }
    public void setPost_status(String post_status) { this.post_status = post_status; }

    public LocalDate getCreated_at() { return created_at; }
    public void setCreated_at(LocalDate created_at) { this.created_at = created_at; }
}