package com.safetymap.safetymap.entity;

import jakarta.persistence.*;

@Entity
@Table(
        name = "favorite",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "fav_user_marker_uk",
                        columnNames = {"user_uuid", "marker_uuid"}
                )
        }
)

public class Favorite {

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
            name = "marker_uuid",
            referencedColumnName = "marker_uuid",
            nullable = false
    )
    private Marker marker;

    @Column(name = "fav_name", length = 50)
    private String fav_name;


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

    public Marker getMarker() {
        return marker;
    }

    public void setMarker(Marker marker) {
        this.marker = marker;
    }

    public String getFav_name() {
        return fav_name;
    }

    public void setFav_name(String fav_name) {
        this.fav_name = fav_name;
    }
}