package com.safetymap.safetymap.dto;

// 즐겨찾기 담기 요청. 두 가지 방법 중 하나로 보낸다
//  1) 이미 있는 마커:  marker_uuid (+ fav_name)
//  2) 검색한 장소:     marker_name + latitude + longitude (+ fav_name)
public class FavoriteRegisterDto {

    private String marker_uuid;
    private String marker_name;
    private Double latitude;
    private Double longitude;
    private String fav_name;

    public FavoriteRegisterDto() {

    }

    public FavoriteRegisterDto(String marker_uuid, String fav_name) {
        this.marker_uuid = marker_uuid;
        this.fav_name = fav_name;
    }

    public FavoriteRegisterDto(String marker_name, Double latitude, Double longitude, String fav_name) {
        this.marker_name = marker_name;
        this.latitude = latitude;
        this.longitude = longitude;
        this.fav_name = fav_name;
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

    public String getFav_name() {
        return fav_name;
    }

    public void setFav_name(String fav_name) {
        this.fav_name = fav_name;
    }
}
