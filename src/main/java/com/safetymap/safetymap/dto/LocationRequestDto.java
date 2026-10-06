package com.safetymap.safetymap.dto;

// 위치 올리기 요청
public class LocationRequestDto {

    private Double latitude;
    private Double longitude;

    public LocationRequestDto() {

    }

    public LocationRequestDto(Double latitude, Double longitude) {
        this.latitude = latitude;
        this.longitude = longitude;
    }

    public Double getLatitude() {
        return latitude;
    }

    public void setLatitude(Double latitude) {
        this.latitude = latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public void setLongitude(Double longitude) {
        this.longitude = longitude;
    }
}
