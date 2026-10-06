package com.safetymap.safetymap.entity;

import jakarta.persistence.*;

// 보호 대상의 마지막 위치. 회원 1명당 1줄만 두고 새 위치가 오면 덮어쓴다 (이동 기록은 남기지 않는다)
//  - updated_at : 마지막으로 위치를 받은 시각 (1970년부터 센 밀리초)
@Entity
@Table(name = "user_location")
public class UserLocation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int idx;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "user_uuid",
            referencedColumnName = "user_uuid",
            nullable = false,
            unique = true
    )
    private Users user;

    @Column(name = "latitude", nullable = false)
    private double latitude;

    @Column(name = "longitude", nullable = false)
    private double longitude;

    @Column(name = "updated_at", nullable = false)
    private long updated_at;


    public int getIdx() { return idx; }
    public void setIdx(int idx) { this.idx = idx; }

    public Users getUser() { return user; }
    public void setUser(Users user) { this.user = user; }

    public double getLatitude() { return latitude; }
    public void setLatitude(double latitude) { this.latitude = latitude; }

    public double getLongitude() { return longitude; }
    public void setLongitude(double longitude) { this.longitude = longitude; }

    public long getUpdated_at() { return updated_at; }
    public void setUpdated_at(long updated_at) { this.updated_at = updated_at; }
}
