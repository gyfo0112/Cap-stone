package com.safetymap.safetymap.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "marker")
public class Marker {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int idx;

    @Column(name = "marker_uuid", unique = true, length = 36)
    private String marker_uuid;

    @Column(name = "marker_name", nullable = false, length = 50)
    private String marker_name;

    @Column(name = "marker_type", nullable = false, length = 20)
    private String marker_type;

    @Column(name = "latitude", nullable = false)
    private double latitude;

    @Column(name = "longitude", nullable = false)
    private double longitude;


    public int getIdx() {
        return idx;
    }

    public void setIdx(int idx) {
        this.idx = idx;
    }

    public String getMarker_uuid() {
        return marker_uuid;
    }

    public void setMarker_uuid(String marker_uuid) {
        this.marker_uuid = marker_uuid;
    }

    public String getMarker_name() {
        return marker_name;
    }

    public void setMarker_name(String marker_name) {
        this.marker_name = marker_name;
    }

    public String getMarker_type() {
        return marker_type;
    }

    public void setMarker_type(String marker_type) {
        this.marker_type = marker_type;
    }

    public double getLatitude() {
        return latitude;
    }

    public void setLatitude(double latitude) {
        this.latitude = latitude;
    }

    public double getLongitude() {
        return longitude;
    }

    public void setLongitude(double longitude) {
        this.longitude = longitude;
    }
}
