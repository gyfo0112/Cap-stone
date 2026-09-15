package com.safetymap.safetymap.entity;

import jakarta.persistence.*;

import java.util.UUID;


@Entity
@Table(name = "user_tel")
public class UserTel {

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

    @Column(name = "tel_uuid", nullable = false, length = 36)
    private String tel_uuid;


    @Column(name = "tel_num", unique = true, length = 20)
    private String tel_num;


    @Column(name = "tel_name", nullable = false, length = 50)
    private String tel_name;


    @Column(name = "tel_type", length = 20)
    private String tel_type;

    @PrePersist
    protected void onCreate() {
        if (this.tel_uuid == null) {
            this.tel_uuid = UUID.randomUUID().toString();
        }
        if (this.tel_type == null) {
            this.tel_type = "SUB";
        }
    }


    public int getIdx() { return idx; }
    public void setIdx(int idx) { this.idx = idx; }

    public Users getUser() { return user; }
    public void setUser(Users user) { this.user = user; }

    public String getTel_uuid() { return tel_uuid; }
    public void setTel_uuid(String tel_uuid) { this.tel_uuid = tel_uuid; }

    public String getTel_num() { return tel_num; }
    public void setTel_num(String tel_num) { this.tel_num = tel_num; }

    public String getTel_name() { return tel_name; }
    public void setTel_name(String tel_name) { this.tel_name = tel_name; }

    public String getTel_type() { return tel_type; }
    public void setTel_type(String tel_type) { this.tel_type = tel_type; }
}