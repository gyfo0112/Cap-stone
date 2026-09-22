package com.safetymap.safetymap.entity;

import jakarta.persistence.*;

@Entity
@Table(
        name = "post_request",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "req_user_post_uk",
                        columnNames = {"user_uuid", "post_uuid"}
                )
        }
)
public class PostRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int idx;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "user_uuid",
            referencedColumnName = "user_uuid",
            nullable = false
    )
    private Users user;


    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "post_uuid",
            referencedColumnName = "post_uuid",
            nullable = false
    )
    private Posts post;


    public int getIdx() {
        return idx;
    }

    public void setIdx(int idx) {
        this.idx = idx;
    }

    public Users getUser() {
        return user;
    }

    public void setUser(Users user) {
        this.user = user;
    }

    public Posts getPost() {
        return post;
    }

    public void setPost(Posts post) {
        this.post = post;
    }
}