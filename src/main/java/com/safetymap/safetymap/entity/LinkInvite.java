package com.safetymap.safetymap.entity;

import jakarta.persistence.*;

// 연결 코드: 보호 대상이 만들고, 보호자가 이 코드를 입력하면 두 계정이 연결된다
//  - code       : 숫자 6자리
//  - expires_at : 만료 시각 (1970년부터 센 밀리초. 만든 뒤 10분)
@Entity
@Table(name = "link_invite")
public class LinkInvite {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int idx;

    @Column(name = "code", unique = true, nullable = false, length = 6)
    private String code;

    // 코드를 만든 보호 대상
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "user_uuid",
            referencedColumnName = "user_uuid",
            nullable = false
    )
    private Users user;

    @Column(name = "expires_at", nullable = false)
    private long expires_at;


    public int getIdx() { return idx; }
    public void setIdx(int idx) { this.idx = idx; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public Users getUser() { return user; }
    public void setUser(Users user) { this.user = user; }

    public long getExpires_at() { return expires_at; }
    public void setExpires_at(long expires_at) { this.expires_at = expires_at; }
}
