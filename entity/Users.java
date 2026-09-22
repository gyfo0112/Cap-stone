package com.safetymap.safetymap.entity;

import jakarta.persistence.*;

import java.util.UUID;   // [추가] @PrePersist 에서 uuid 생성에 사용

@Entity
@Table(name = "users")
public class Users {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int idx;

    @Column(name = "user_uuid", unique = true, length = 36)
    private String user_uuid;

    @Column(name = "user_name", nullable = false, length = 50)
    private String user_name;

    @Column(name = "user_id", unique = true, length = 30)
    private String user_id;

    //  일단 30으로넣어놨습니다
    @Column(name = "user_pw", nullable = false, length = 30)
    private String user_pw;


    @Column(name = "info", columnDefinition = "TEXT")
    private String info;


    public int getIdx() { return idx; }
    public void setIdx(int idx) { this.idx = idx; }

    public String getUser_uuid() { return user_uuid; }
    public void setUser_uuid(String user_uuid) { this.user_uuid = user_uuid; }

    public String getUser_name() { return user_name; }
    public void setUser_name(String user_name) { this.user_name = user_name; }

    public String getUser_id() { return user_id; }
    public void setUser_id(String user_id) { this.user_id = user_id; }

    public String getUser_pw() { return user_pw; }
    public void setUser_pw(String user_pw) { this.user_pw = user_pw; }

    public String getInfo() { return info; }
    public void setInfo(String info) { this.info = info; }
}